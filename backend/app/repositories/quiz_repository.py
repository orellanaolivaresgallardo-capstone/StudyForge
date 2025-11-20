# app/repositories/quiz_repository.py
"""
Repository para operaciones de base de datos relacionadas con cuestionarios.
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.quiz import Quiz


class QuizRepository:
    """Repository para gestionar cuestionarios en la base de datos."""

    @staticmethod
    def create_quiz(
        db: Session,
        user_id: UUID,
        summary_id: Optional[UUID],
        title: str,
        topic: str,
        difficulty_level: int,
        questions: List[Dict[str, Any]],
    ) -> Quiz:
        """
        Crea un nuevo cuestionario en la base de datos con preguntas en formato JSON.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            summary_id: ID del resumen (opcional)
            title: Título del cuestionario
            topic: Tema del cuestionario
            difficulty_level: Nivel de dificultad (1-5)
            questions: Lista de preguntas en formato JSON
                Cada pregunta debe tener:
                - question: str (texto de la pregunta)
                - options: dict con keys "correct", "semi-correct", "incorrect1", "incorrect2"
                - explanation: str (explicación de la respuesta)

        Returns:
            Cuestionario creado
        """
        quiz = Quiz(
            user_id=user_id,
            summary_id=summary_id,
            title=title,
            topic=topic,
            difficulty_level=difficulty_level,
            questions=questions,
        )
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
        return quiz

    @staticmethod
    def get_quiz_by_id(db: Session, quiz_id: UUID) -> Optional[Quiz]:
        """
        Obtiene un cuestionario por su ID.

        Args:
            db: Sesión de base de datos
            quiz_id: ID del cuestionario

        Returns:
            Cuestionario si existe, None en caso contrario
        """
        return db.query(Quiz).filter(Quiz.id == quiz_id).first()

    @staticmethod
    def get_quizzes_by_user(db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Quiz]:
        """
        Obtiene todos los cuestionarios de un usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            skip: Número de registros a saltar
            limit: Número máximo de registros

        Returns:
            Lista de cuestionarios
        """
        return (
            db.query(Quiz)
            .filter(Quiz.user_id == user_id)
            .order_by(Quiz.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

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
        return db.query(Quiz).filter(Quiz.user_id == user_id).count()
