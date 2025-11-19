# app/repositories/quiz_repository.py
"""
Repository para operaciones de base de datos relacionadas con cuestionarios.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.quiz import Quiz
from app.models.question import Question, OptionEnum


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
        max_questions: int,
    ) -> Quiz:
        """
        Crea un nuevo cuestionario en la base de datos.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            summary_id: ID del resumen (opcional)
            title: Título del cuestionario
            topic: Tema del cuestionario
            difficulty_level: Nivel de dificultad (1-5)
            max_questions: Número máximo de preguntas

        Returns:
            Cuestionario creado
        """
        quiz = Quiz(
            user_id=user_id,
            summary_id=summary_id,
            title=title,
            topic=topic,
            difficulty_level=difficulty_level,
            max_questions=max_questions,
        )
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
        return quiz

    @staticmethod
    def create_question(
        db: Session,
        quiz_id: UUID,
        question_text: str,
        option_a: str,
        option_b: str,
        option_c: str,
        option_d: str,
        correct_option: OptionEnum,
        explanation: str,
        order: int,
    ) -> Question:
        """
        Crea una nueva pregunta para un cuestionario.

        Args:
            db: Sesión de base de datos
            quiz_id: ID del cuestionario
            question_text: Texto de la pregunta
            option_a: Opción A
            option_b: Opción B
            option_c: Opción C
            option_d: Opción D
            correct_option: Opción correcta (A, B, C, D)
            explanation: Explicación de la respuesta
            order: Orden de la pregunta

        Returns:
            Pregunta creada
        """
        question = Question(
            quiz_id=quiz_id,
            question_text=question_text,
            option_a=option_a,
            option_b=option_b,
            option_c=option_c,
            option_d=option_d,
            correct_option=correct_option,
            explanation=explanation,
            order=order,
        )
        db.add(question)
        db.commit()
        db.refresh(question)
        return question

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

    @staticmethod
    def get_question_by_id(db: Session, question_id: UUID) -> Optional[Question]:
        """
        Obtiene una pregunta por su ID.

        Args:
            db: Sesión de base de datos
            question_id: ID de la pregunta

        Returns:
            Pregunta si existe, None en caso contrario
        """
        return db.query(Question).filter(Question.id == question_id).first()
