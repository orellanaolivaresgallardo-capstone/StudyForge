# app/repositories/quiz_attempt_repository.py
"""
Repository para operaciones de base de datos relacionadas con intentos de cuestionarios.
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.quiz_attempt import QuizAttempt
from app.models.answer import Answer
from app.models.question import OptionEnum


class QuizAttemptRepository:
    """Repository para gestionar intentos de cuestionarios."""

    @staticmethod
    def create_attempt(db: Session, quiz_id: UUID, user_id: UUID) -> QuizAttempt:
        """
        Crea un nuevo intento de cuestionario.

        Args:
            db: Sesión de base de datos
            quiz_id: ID del cuestionario
            user_id: ID del usuario

        Returns:
            Intento de cuestionario creado
        """
        attempt = QuizAttempt(
            quiz_id=quiz_id,
            user_id=user_id,
        )
        db.add(attempt)
        db.commit()
        db.refresh(attempt)
        return attempt

    @staticmethod
    def create_answer(
        db: Session,
        attempt_id: UUID,
        question_id: UUID,
        selected_option: OptionEnum,
        is_correct: bool,
    ) -> Answer:
        """
        Crea una respuesta del usuario.

        Args:
            db: Sesión de base de datos
            attempt_id: ID del intento
            question_id: ID de la pregunta
            selected_option: Opción seleccionada
            is_correct: Si la respuesta es correcta

        Returns:
            Respuesta creada
        """
        answer = Answer(
            attempt_id=attempt_id,
            question_id=question_id,
            selected_option=selected_option,
            is_correct=is_correct,
        )
        db.add(answer)
        db.commit()
        db.refresh(answer)
        return answer

    @staticmethod
    def get_attempt_by_id(db: Session, attempt_id: UUID) -> Optional[QuizAttempt]:
        """
        Obtiene un intento por su ID.

        Args:
            db: Sesión de base de datos
            attempt_id: ID del intento

        Returns:
            Intento si existe, None en caso contrario
        """
        return db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()

    @staticmethod
    def get_attempts_by_user(
        db: Session, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[QuizAttempt]:
        """
        Obtiene todos los intentos de un usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            skip: Número de registros a saltar
            limit: Número máximo de registros

        Returns:
            Lista de intentos
        """
        return (
            db.query(QuizAttempt)
            .filter(QuizAttempt.user_id == user_id)
            .order_by(QuizAttempt.started_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_attempts_by_quiz(db: Session, quiz_id: UUID, user_id: UUID) -> List[QuizAttempt]:
        """
        Obtiene todos los intentos de un cuestionario para un usuario.

        Args:
            db: Sesión de base de datos
            quiz_id: ID del cuestionario
            user_id: ID del usuario

        Returns:
            Lista de intentos
        """
        return (
            db.query(QuizAttempt)
            .filter(
                and_(
                    QuizAttempt.quiz_id == quiz_id,
                    QuizAttempt.user_id == user_id,
                )
            )
            .order_by(QuizAttempt.started_at.desc())
            .all()
        )

    @staticmethod
    def complete_attempt(db: Session, attempt: QuizAttempt, score: float) -> QuizAttempt:
        """
        Marca un intento como completado y establece su score.

        Args:
            db: Sesión de base de datos
            attempt: Intento a completar
            score: Puntuación obtenida (0-100)

        Returns:
            Intento actualizado
        """
        attempt.completed_at = datetime.utcnow()
        attempt.score = score
        db.commit()
        db.refresh(attempt)
        return attempt

    @staticmethod
    def get_answer(db: Session, attempt_id: UUID, question_id: UUID) -> Optional[Answer]:
        """
        Obtiene una respuesta específica de un intento.

        Args:
            db: Sesión de base de datos
            attempt_id: ID del intento
            question_id: ID de la pregunta

        Returns:
            Respuesta si existe, None en caso contrario
        """
        return (
            db.query(Answer)
            .filter(
                and_(
                    Answer.attempt_id == attempt_id,
                    Answer.question_id == question_id,
                )
            )
            .first()
        )

    @staticmethod
    def get_recent_attempts_by_topic(
        db: Session, user_id: UUID, topic: str, limit: int = 5
    ) -> List[QuizAttempt]:
        """
        Obtiene los intentos recientes de un usuario para un tema específico.
        Útil para el sistema adaptativo.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            topic: Tema del cuestionario
            limit: Número de intentos a retornar

        Returns:
            Lista de intentos recientes
        """
        from app.models.quiz import Quiz

        return (
            db.query(QuizAttempt)
            .join(Quiz)
            .filter(
                and_(
                    QuizAttempt.user_id == user_id,
                    Quiz.topic == topic,
                    QuizAttempt.completed_at.isnot(None),
                )
            )
            .order_by(QuizAttempt.completed_at.desc())
            .limit(limit)
            .all()
        )
