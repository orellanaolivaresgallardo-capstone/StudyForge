# app/services/summary_service.py
"""
Service para gestión de resúmenes.
"""
from uuid import UUID
from typing import List, Tuple
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from app.repositories.summary_repository import SummaryRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.user_repository import UserRepository
from app.services.file_processor import FileProcessor
from app.services.openai_service import OpenAIService
from app.models.summary import Summary, ExpertiseLevel
from app.models.user import User
from app.core.dependencies import verify_summary_ownership
from app.core.logging import log_quota_event, log_error, log_openai_request


class SummaryService:
    """Service para crear y gestionar resúmenes."""

    def __init__(self):
        """Inicializa el service con OpenAI."""
        self.openai_service = OpenAIService()

    async def create_summary_from_file(
        self,
        db: Session,
        user_id: UUID,
        study_space_id: UUID,
        file: UploadFile,
        expertise_level: ExpertiseLevel,
    ) -> Summary:
        """
        Crea un resumen a partir de un archivo subido.

        Guarda el archivo en la tabla documents, genera el resumen con OpenAI,
        y actualiza la cuota de almacenamiento del usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            study_space_id: ID del espacio de estudio (requerido)
            file: Archivo subido
            expertise_level: Nivel de expertise del resumen

        Returns:
            Resumen creado

        Raises:
            HTTPException: Si hay error al procesar o se exceden cuotas
        """
        try:
            # 1. Validar archivo
            filename, file_type = FileProcessor.validate_file(file)

            # 2. Leer contenido del archivo
            await file.seek(0)  # Reiniciar puntero
            file_content = await file.read()
            file_size = len(file_content)

            # 3. Obtener usuario y validar cuota
            user = UserRepository.get_by_id(db, user_id)
            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Usuario no encontrado"
                )

            # Validar tamaño máximo del archivo
            if file_size > user.max_file_size_bytes:  # type: ignore[operator]
                log_quota_event(
                    event_type="quota_exceeded",
                    user_id=str(user_id),
                    bytes_delta=file_size,
                    resource_type="document",
                    message=f"File size {file_size} exceeds max {user.max_file_size_bytes}"
                )
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"El archivo excede el tamaño máximo permitido de {user.max_file_size_bytes / (1024*1024):.1f} MB"
                )

            # Validar espacio disponible
            if user.storage_available_bytes < file_size:
                log_quota_event(
                    event_type="quota_exceeded",
                    user_id=str(user_id),
                    bytes_delta=file_size,
                    storage_used=user.storage_used_bytes,
                    storage_quota=user.storage_quota_bytes,
                    resource_type="document",
                    message="Insufficient storage space"
                )
                raise HTTPException(
                    status_code=status.HTTP_507_INSUFFICIENT_STORAGE,
                    detail="No hay suficiente espacio de almacenamiento disponible"
                )

            # 4. Extraer texto del archivo
            await file.seek(0)  # Reiniciar puntero para extracción
            text = await FileProcessor.extract_text(file)

            # 5. Generar resumen con OpenAI
            try:
                summary_data = self.openai_service.generate_summary(
                    text=text,
                    expertise_level=expertise_level.value
                )
                log_openai_request(
                    request_type="summary",
                    user_id=str(user_id),
                    model=self.openai_service.model,
                    status="success"
                )
            except Exception as e:
                log_openai_request(
                    request_type="summary",
                    user_id=str(user_id),
                    model=self.openai_service.model,
                    status="failed",
                    error=str(e)
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error al generar resumen: {str(e)}"
                )

            # 6. Validar que el espacio de estudio existe y pertenece al usuario
            from app.repositories.study_space_repository import StudySpaceRepository
            from app.core.dependencies import verify_space_ownership

            study_space = StudySpaceRepository.get_by_id(db, study_space_id)
            study_space = verify_space_ownership(study_space, user)

            # 7. Guardar documento en la base de datos
            document = DocumentRepository.create(
                db=db,
                user_id=user_id,
                title=summary_data.get("title", filename),
                file_name=filename,
                file_type=file_type,
                file_size_bytes=file_size,
                file_content=file_content,
                extracted_text=text
            )

            # 8. Crear resumen con campos denormalizados
            summary = SummaryRepository.create(
                db=db,
                user_id=user_id,
                document_id=document.id,
                study_space_id=study_space_id,
                title=summary_data.get("title", filename),
                content={
                    "summary": summary_data.get("summary", ""),
                    "full_data": summary_data
                },
                expertise_level=expertise_level,
                topics=summary_data.get("topics", []),
                key_concepts=summary_data.get("key_concepts", []),
                source_document_title=document.title,
                source_document_filename=document.file_name,
                document_state="active_in_space",
            )

            # 9. Actualizar cuota del usuario
            user.storage_used_bytes += file_size
            db.commit()
            db.refresh(user)

            log_quota_event(
                event_type="upload",
                user_id=str(user_id),
                bytes_delta=file_size,
                storage_used=user.storage_used_bytes,
                storage_quota=user.storage_quota_bytes,
                resource_type="document",
                resource_id=str(document.id),
                message=f"Document uploaded for summary {summary.id}"
            )

            return summary

        except HTTPException:
            # Re-raise HTTP exceptions
            db.rollback()
            raise
        except Exception as e:
            # Log y rollback en caso de error inesperado
            db.rollback()
            log_error(
                error=e,
                context="SummaryService.create_summary_from_file",
                user_id=str(user_id)
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error interno al crear resumen: {str(e)}"
            )

    def get_summaries(
        self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> Tuple[List[Summary], int]:
        """
        Obtiene los resúmenes de un usuario con paginación.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            skip: Número de registros a saltar
            limit: Número máximo de registros

        Returns:
            Tupla (lista de resúmenes, total de resúmenes)
        """
        summaries = SummaryRepository.get_by_user(db, user_id, skip, limit)
        total = SummaryRepository.count_by_user(db, user_id)
        return summaries, total

    def get_summary(self, db: Session, summary_id: UUID, user: User) -> Summary:
        """
        Obtiene un resumen específico.

        Args:
            db: Sesión de base de datos
            summary_id: ID del resumen
            user: Usuario autenticado

        Returns:
            Resumen

        Raises:
            HTTPException: Si no existe o no pertenece al usuario
        """
        summary = SummaryRepository.get_by_id(db, summary_id)
        summary = verify_summary_ownership(summary, user)
        return summary

    def create_summary_from_documents(
        self,
        db: Session,
        user: User,
        document_id: UUID,
        study_space_id: UUID,
        expertise_level: ExpertiseLevel,
    ) -> Summary:
        """
        Crea un resumen a partir de UN documento almacenado.

        Args:
            db: Sesión de base de datos
            user: Usuario autenticado
            document_id: ID del documento
            study_space_id: ID del espacio de estudio (requerido)
            expertise_level: Nivel de expertise del resumen

        Returns:
            Resumen creado

        Raises:
            HTTPException: Si hay error al procesar o validación falla
        """
        try:
            # 1. Obtener y validar ownership del documento
            from app.core.dependencies import verify_document_ownership, verify_space_ownership
            from app.repositories.study_space_repository import StudySpaceRepository

            document = DocumentRepository.get_by_id(db, document_id)
            document = verify_document_ownership(document, user)

            # 2. Validar que el espacio de estudio existe y pertenece al usuario
            study_space = StudySpaceRepository.get_by_id(db, study_space_id)
            study_space = verify_space_ownership(study_space, user)

            # 3. Usar texto del documento
            combined_text = document.extracted_text or ""

            if not combined_text.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El documento no contiene texto extraíble"
                )

            # 4. Obtener contexto del espacio
            space_context = study_space.description if study_space.description else None

            # 4. Generar resumen con OpenAI (con contexto del espacio si está disponible)
            try:
                summary_data = self.openai_service.generate_summary(
                    text=combined_text,
                    expertise_level=expertise_level.value,
                    space_context=space_context
                )
                log_openai_request(
                    request_type="summary",
                    user_id=str(user.id),
                    model=self.openai_service.model,
                    status="success"
                )
            except Exception as e:
                log_openai_request(
                    request_type="summary",
                    user_id=str(user.id),
                    model=self.openai_service.model,
                    status="failed",
                    error=str(e)
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error al generar resumen: {str(e)}"
                )

            # 5. Crear resumen con campos denormalizados
            summary = SummaryRepository.create(
                db=db,
                user_id=user.id,
                document_id=document.id,
                study_space_id=study_space_id,
                title=summary_data.get("title", document.title),
                content={
                    "summary": summary_data.get("summary", ""),
                    "full_data": summary_data
                },
                expertise_level=expertise_level,
                topics=summary_data.get("topics", []),
                key_concepts=summary_data.get("key_concepts", []),
                source_document_title=document.title,
                source_document_filename=document.file_name,
                document_state="active_in_space",
            )

            return summary

        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            log_error(
                error=e,
                context="SummaryService.create_summary_from_documents",
                user_id=str(user.id)
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error interno al crear resumen: {str(e)}"
            )

    def delete_summary(self, db: Session, summary_id: UUID, user: User) -> None:
        """
        Elimina un resumen.

        NOTA: NO elimina los documentos asociados ya que pueden estar
        vinculados a otros resúmenes. Solo elimina el resumen y la relación
        en summary_documents.

        Args:
            db: Sesión de base de datos
            summary_id: ID del resumen
            user: Usuario autenticado

        Raises:
            HTTPException: Si no existe o no pertenece al usuario
        """
        summary = self.get_summary(db, summary_id, user)
        SummaryRepository.delete(db, summary)
