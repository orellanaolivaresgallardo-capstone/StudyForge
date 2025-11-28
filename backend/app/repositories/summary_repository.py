# app/repositories/summary_repository.py
"""
Repository para operaciones de base de datos relacionadas con resúmenes.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.summary import Summary, ExpertiseLevel


class SummaryRepository:
    """Repository para gestionar resúmenes en la base de datos."""

    @staticmethod
    def create(
        db: Session,
        user_id: UUID,
        document_id: UUID,
        study_space_id: UUID,
        title: str,
        content: dict,
        expertise_level: ExpertiseLevel,
        topics: List[str],
        key_concepts: List[str],
        source_document_title: str,
        source_document_filename: str,
        document_state: str = "active_in_space",
    ) -> Summary:
        """
        Crea un nuevo resumen en la base de datos con campos denormalizados.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            document_id: ID del documento fuente (FK, nullable)
            study_space_id: ID del espacio de estudio (FK, requerido)
            title: Título del resumen
            content: Contenido estructurado del resumen
            expertise_level: Nivel de expertise
            topics: Lista de temas identificados
            key_concepts: Lista de conceptos clave
            source_document_title: Título del documento (cache denormalizado)
            source_document_filename: Nombre del archivo (cache denormalizado)
            document_state: Estado del documento ('active_in_space' | 'removed_from_space' | 'permanently_deleted')

        Returns:
            Resumen creado
        """
        summary = Summary(
            user_id=user_id,
            document_id=document_id,
            study_space_id=study_space_id,
            title=title,
            content=content,
            expertise_level=expertise_level,
            topics=topics,
            key_concepts=key_concepts,
            source_document_title=source_document_title,
            source_document_filename=source_document_filename,
            document_state=document_state,
        )
        db.add(summary)
        db.commit()
        db.refresh(summary)
        return summary

    @staticmethod
    def get_by_id(db: Session, summary_id: UUID) -> Optional[Summary]:
        """
        Obtiene un resumen por su ID.

        Args:
            db: Sesión de base de datos
            summary_id: ID del resumen

        Returns:
            Resumen si existe, None en caso contrario
        """
        stmt = select(Summary).where(Summary.id == summary_id)
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def get_by_user(db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Summary]:
        """
        Obtiene todos los resúmenes de un usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            skip: Número de registros a saltar (paginación)
            limit: Número máximo de registros a retornar

        Returns:
            Lista de resúmenes del usuario
        """
        stmt = (
            select(Summary)
            .where(Summary.user_id == user_id)
            .order_by(Summary.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(db.execute(stmt).scalars().all())

    @staticmethod
    def get_by_space(db: Session, space_id: UUID, skip: int = 0, limit: int = 100) -> List[Summary]:
        """
        Obtiene todos los resúmenes en un espacio de estudio.

        Args:
            db: Sesión de base de datos
            space_id: ID del espacio de estudio
            skip: Número de registros a saltar (paginación)
            limit: Número máximo de registros a retornar

        Returns:
            Lista de resúmenes del espacio
        """
        stmt = (
            select(Summary)
            .where(Summary.study_space_id == space_id)
            .order_by(Summary.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(db.execute(stmt).scalars().all())

    @staticmethod
    def count_by_user(db: Session, user_id: UUID) -> int:
        """
        Cuenta el total de resúmenes de un usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario

        Returns:
            Número total de resúmenes
        """
        stmt = select(func.count()).select_from(Summary).where(Summary.user_id == user_id)
        return db.execute(stmt).scalar() or 0

    @staticmethod
    def delete(db: Session, summary: Summary) -> None:
        """
        Elimina un resumen de la base de datos.

        Args:
            db: Sesión de base de datos
            summary: Resumen a eliminar
        """
        db.delete(summary)
        db.commit()
