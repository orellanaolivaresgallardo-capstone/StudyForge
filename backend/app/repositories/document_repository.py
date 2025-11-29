# app/repositories/document_repository.py
"""
Repositorio para manejo de documentos.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models import Document


class DocumentRepository:
    """Repositorio para operaciones CRUD de documentos."""

    @staticmethod
    def create(
        db: Session,
        user_id: UUID,
        title: str,
        file_name: str,
        file_type: str,
        file_size_bytes: int,
        file_content: bytes,
        extracted_text: Optional[str] = None
    ) -> Document:
        """
        Crea un nuevo documento.

        IMPORTANTE: NO hace commit. El caller debe hacer commit explícitamente
        para asegurar que las relaciones (espacios, resúmenes, etc.) se persistan
        en la misma transacción.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario propietario
            title: Título del documento
            file_name: Nombre original del archivo
            file_type: Tipo de archivo (pdf, docx, etc.)
            file_size_bytes: Tamaño del archivo en bytes
            file_content: Contenido binario del archivo
            extracted_text: Texto extraído (opcional)

        Returns:
            Documento creado (NO comiteado aún)
        """
        document = Document(
            user_id=user_id,
            title=title,
            file_name=file_name,
            file_type=file_type,
            file_size_bytes=file_size_bytes,
            file_content=file_content,
            extracted_text=extracted_text
        )
        db.add(document)
        db.flush()  # Genera el ID sin commitear
        db.refresh(document)
        return document

    @staticmethod
    def get_by_id(db: Session, document_id: UUID) -> Optional[Document]:
        """Obtiene un documento por su ID con relaciones cargadas."""
        from sqlalchemy.orm import joinedload
        stmt = (
            select(Document)
            .options(joinedload(Document.study_spaces))
            .where(Document.id == document_id)
        )
        # NOTE: .unique() is required when using joinedload() with collections
        return db.execute(stmt).unique().scalar_one_or_none()

    @staticmethod
    def get_by_user(
        db: Session,
        user_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> List[Document]:
        """
        Obtiene documentos de un usuario con paginación y relaciones cargadas.

        IMPORTANT: No carga file_content ni extracted_text para optimizar rendimiento.
        Estos campos solo se cargan cuando se descarga el documento individual.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            skip: Número de documentos a saltar
            limit: Máximo número de documentos a retornar

        Returns:
            Lista de documentos (sin file_content ni extracted_text)
        """
        from sqlalchemy.orm import joinedload, defer
        stmt = (
            select(Document)
            .options(
                # Excluir campos pesados en listados (solo cargar metadatos)
                defer(Document.file_content),      # Binario grande (MB de datos)
                defer(Document.extracted_text),    # Texto extraído grande
                joinedload(Document.study_spaces)  # Cargar espacios relacionados
            )
            .where(Document.user_id == user_id)
            .order_by(Document.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        # NOTE: .unique() is required when using joinedload() with collections
        return list(db.execute(stmt).unique().scalars().all())

    @staticmethod
    def count_by_user(db: Session, user_id: UUID) -> int:
        """Cuenta el número total de documentos de un usuario."""
        stmt = select(func.count()).select_from(Document).where(Document.user_id == user_id)
        return db.execute(stmt).scalar() or 0

    @staticmethod
    def delete(db: Session, document_id: UUID) -> bool:
        """
        Elimina un documento.

        Args:
            db: Sesión de base de datos
            document_id: ID del documento a eliminar

        Returns:
            True si se eliminó, False si no se encontró
        """
        stmt = select(Document).where(Document.id == document_id)
        document = db.execute(stmt).scalar_one_or_none()
        if document:
            db.delete(document)
            db.commit()
            return True
        return False

    @staticmethod
    def update_title(db: Session, document_id: UUID, new_title: str) -> Optional[Document]:
        """
        Actualiza el título de un documento.

        Args:
            db: Sesión de base de datos
            document_id: ID del documento
            new_title: Nuevo título

        Returns:
            Documento actualizado o None si no se encontró
        """
        stmt = select(Document).where(Document.id == document_id)
        document = db.execute(stmt).scalar_one_or_none()
        if document:
            document.title = new_title
            db.commit()
            db.refresh(document)
            return document
        return None

    @staticmethod
    def calculate_total_size_by_user(db: Session, user_id: UUID) -> int:
        """
        Calcula el tamaño total de almacenamiento usado por un usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario

        Returns:
            Tamaño total en bytes
        """
        stmt = select(func.sum(Document.file_size_bytes)).where(Document.user_id == user_id)
        result = db.execute(stmt).scalar()
        return result or 0
