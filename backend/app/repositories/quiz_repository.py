# app/repositories/quiz_repository.py
"""
Repository para operaciones de base de datos relacionadas con cuestionarios.
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload
from app.models.quiz import Quiz
from app.models.summary import Summary


class QuizRepository:
    """Repository para gestionar cuestionarios en la base de datos."""

    @staticmethod
    def create_quiz(
        db: Session,
        user_id: UUID,
        study_space_id: UUID,
        source_type: str,
        title: str,
        difficulty_level: int,
        questions: List[Dict[str, Any]],
        source_document_id: Optional[UUID] = None,
        source_summary_id: Optional[UUID] = None,
        source_names: Optional[Dict[str, Any]] = None,
        source_metadata: Optional[Dict[str, Any]] = None,
    ) -> Quiz:
        """
        Crea un nuevo cuestionario en la base de datos con preguntas en formato JSON.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            study_space_id: ID del espacio de estudio (requerido)
            source_type: Tipo de fuente ('document' | 'summary' | 'study_space')
            title: Título del cuestionario
            difficulty_level: Nivel de dificultad (1-5)
            questions: Lista de preguntas en formato JSON
                Cada pregunta debe tener:
                - question: str (texto de la pregunta)
                - options: dict con keys "correct", "semi-correct", "incorrect1", "incorrect2"
                - explanation: str (explicación de la respuesta)
            source_document_id: ID del documento fuente (opcional, solo si source_type='document')
            source_summary_id: ID del resumen fuente (opcional, solo si source_type='summary')
            source_names: Cache de nombres de fuentes (JSONB)
            source_metadata: Cache de metadatos de fuentes (JSONB)

        Returns:
            Cuestionario creado
        """
        quiz = Quiz(
            user_id=user_id,
            study_space_id=study_space_id,
            source_type=source_type,
            title=title,
            difficulty_level=difficulty_level,
            questions=questions,
            source_document_id=source_document_id,
            source_summary_id=source_summary_id,
            source_names=source_names,
            source_metadata=source_metadata,
        )
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
        return quiz

    @staticmethod
    def get_quiz_by_id(db: Session, quiz_id: UUID) -> Optional[Quiz]:
        """
        Obtiene un cuestionario por su ID con eager loading de relaciones.

        Args:
            db: Sesión de base de datos
            quiz_id: ID del cuestionario

        Returns:
            Cuestionario si existe, None en caso contrario
        """
        stmt = (
            select(Quiz)
            .where(Quiz.id == quiz_id)
            .options(
                joinedload(Quiz.study_space),
                joinedload(Quiz.summary)
            )
        )
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def get_quizzes_by_user(db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Quiz]:
        """
        Obtiene todos los cuestionarios de un usuario con eager loading de relaciones.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            skip: Número de registros a saltar
            limit: Número máximo de registros

        Returns:
            Lista de cuestionarios
        """
        stmt = (
            select(Quiz)
            .where(Quiz.user_id == user_id)
            .options(
                joinedload(Quiz.study_space),
                joinedload(Quiz.summary)
            )
            .order_by(Quiz.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(db.execute(stmt).scalars().all())

    @staticmethod
    def count_quizzes_by_user(db: Session, user_id: UUID) -> int:
        """
        Cuenta el total de cuestionarios de un usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario

        Returns:
            Número total de cuestionarios
        """
        stmt = select(func.count()).select_from(Quiz).where(Quiz.user_id == user_id)
        return db.execute(stmt).scalar() or 0

    @staticmethod
    def get_quizzes_by_space(
        db: Session,
        space_id: UUID,
        user_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> List[Quiz]:
        """
        Obtiene todos los cuestionarios de un espacio específico con eager loading.

        Args:
            db: Sesión de base de datos
            space_id: ID del espacio de estudio
            user_id: ID del usuario
            skip: Número de registros a saltar
            limit: Número máximo de registros

        Returns:
            Lista de cuestionarios del espacio
        """
        from sqlalchemy.orm import joinedload
        from app.models.summary import Summary

        stmt = (
            select(Quiz)
            .where(Quiz.study_space_id == space_id)
            .where(Quiz.user_id == user_id)
            .options(
                joinedload(Quiz.study_space),
                joinedload(Quiz.summary).joinedload(Summary.document)  # ← Fix: eager load document (singular, one-to-one)
            )
            .order_by(Quiz.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(db.execute(stmt).unique().scalars().all())

    @staticmethod
    def count_quizzes_by_space(db: Session, space_id: UUID, user_id: UUID) -> int:
        """
        Cuenta el total de cuestionarios de un espacio específico.

        Args:
            db: Sesión de base de datos
            space_id: ID del espacio de estudio
            user_id: ID del usuario

        Returns:
            Número total de cuestionarios en el espacio
        """
        stmt = (
            select(func.count())
            .select_from(Quiz)
            .where(Quiz.study_space_id == space_id)
            .where(Quiz.user_id == user_id)
        )
        return db.execute(stmt).scalar() or 0
