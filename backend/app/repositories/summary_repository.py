# app/repositories/summary_repository.py
"""
Repository para operaciones de base de datos relacionadas con resúmenes.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.summary import Summary, ExpertiseLevel


class SummaryRepository:
    """Repository para gestionar resúmenes en la base de datos."""

    @staticmethod
    def create(
        db: Session,
        user_id: UUID,
        title: str,
        content: dict,
        expertise_level: ExpertiseLevel,
        topics: List[str],
        key_concepts: List[str],
        original_file_name: str,
        original_file_type: str,
    ) -> Summary:
        """
        Crea un nuevo resumen en la base de datos.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            title: Título del resumen
            content: Contenido estructurado del resumen
            expertise_level: Nivel de expertise
            topics: Lista de temas identificados
            key_concepts: Lista de conceptos clave
            original_file_name: Nombre del archivo original
            original_file_type: Tipo del archivo original

        Returns:
            Resumen creado
        """
        summary = Summary(
            user_id=user_id,
            title=title,
            content=content,
            expertise_level=expertise_level,
            topics=topics,
            key_concepts=key_concepts,
            original_file_name=original_file_name,
            original_file_type=original_file_type,
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
        return db.query(Summary).filter(Summary.id == summary_id).first()

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
        return (
            db.query(Summary)
            .filter(Summary.user_id == user_id)
            .order_by(Summary.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

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
        return db.query(Summary).filter(Summary.user_id == user_id).count()

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
