# app/services/summary_service.py
"""
Service para gestión de resúmenes.
"""
from uuid import UUID
from typing import List, Tuple
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from app.repositories.summary_repository import SummaryRepository
from app.services.file_processor import FileProcessor
from app.services.openai_service import OpenAIService
from app.models.summary import Summary, ExpertiseLevel


class SummaryService:
    """Service para crear y gestionar resúmenes."""

    def __init__(self):
        """Inicializa el service con OpenAI."""
        self.openai_service = OpenAIService()

    async def create_summary_from_file(
        self,
        db: Session,
        user_id: UUID,
        file: UploadFile,
        expertise_level: ExpertiseLevel,
    ) -> Summary:
        """
        Crea un resumen a partir de un archivo subido.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            file: Archivo subido
            expertise_level: Nivel de expertise del resumen

        Returns:
            Resumen creado

        Raises:
            HTTPException: Si hay error al procesar
        """
        # 1. Validar y extraer texto del archivo
        filename, file_type = FileProcessor.validate_file(file)
        text = await FileProcessor.extract_text(file)

        # 2. Generar resumen con OpenAI
        summary_data = self.openai_service.generate_summary(
            text=text,
            expertise_level=expertise_level.value
        )

        # 3. Guardar resumen en base de datos (NO guardamos el archivo original)
        summary = SummaryRepository.create(
            db=db,
            user_id=user_id,
            title=summary_data.get("title", filename),
            content={
                "summary": summary_data.get("summary", ""),
                "full_data": summary_data
            },
            expertise_level=expertise_level,
            topics=summary_data.get("topics", []),
            key_concepts=summary_data.get("key_concepts", []),
            original_file_name=filename,
            original_file_type=file_type,
        )

        return summary

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

    def get_summary(self, db: Session, summary_id: UUID, user_id: UUID) -> Summary:
        """
        Obtiene un resumen específico.

        Args:
            db: Sesión de base de datos
            summary_id: ID del resumen
            user_id: ID del usuario

        Returns:
            Resumen

        Raises:
            HTTPException: Si no existe o no pertenece al usuario
        """
        summary = SummaryRepository.get_by_id(db, summary_id)

        if not summary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resumen no encontrado"
            )

        if summary.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para acceder a este resumen"
            )

        return summary

    def delete_summary(self, db: Session, summary_id: UUID, user_id: UUID) -> None:
        """
        Elimina un resumen.

        Args:
            db: Sesión de base de datos
            summary_id: ID del resumen
            user_id: ID del usuario

        Raises:
            HTTPException: Si no existe o no pertenece al usuario
        """
        summary = self.get_summary(db, summary_id, user_id)
        SummaryRepository.delete(db, summary)
