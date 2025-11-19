# app/services/quiz_service.py
"""
Service para gestión de cuestionarios y sistema adaptativo.
"""
from uuid import UUID
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from app.repositories.quiz_repository import QuizRepository
from app.repositories.quiz_attempt_repository import QuizAttemptRepository
from app.repositories.summary_repository import SummaryRepository
from app.services.file_processor import FileProcessor
from app.services.openai_service import OpenAIService
from app.models.quiz import Quiz
from app.models.quiz_attempt import QuizAttempt
from app.models.question import OptionEnum
from app.config import settings


class QuizService:
    """Service para crear y gestionar cuestionarios."""

    def __init__(self):
        """Inicializa el service con OpenAI."""
        self.openai_service = OpenAIService()

    def calculate_adaptive_difficulty(
        self, db: Session, user_id: UUID, topic: str
    ) -> int:
        """
        Calcula el nivel de dificultad adaptativo basado en el desempeño histórico.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            topic: Tema del cuestionario

        Returns:
            Nivel de dificultad (1-5)
        """
        # Obtener últimos 5 intentos del usuario en el tema
        recent_attempts = QuizAttemptRepository.get_recent_attempts_by_topic(
            db, user_id, topic, limit=5
        )

        if not recent_attempts:
            # Si no hay historial, empezar con nivel medio
            return 2

        # Calcular promedio de scores
        scores = [attempt.score for attempt in recent_attempts if attempt.score is not None]

        if not scores:
            return 2

        avg_score = sum(scores) / len(scores)

        # Determinar dificultad basada en el promedio
        if avg_score >= 90:
            return 5  # Muy difícil
        elif avg_score >= 75:
            return 4  # Difícil
        elif avg_score >= 60:
            return 3  # Medio
        elif avg_score >= 40:
            return 2  # Fácil
        else:
            return 1  # Muy fácil

    async def create_quiz_from_file(
        self,
        db: Session,
        user_id: UUID,
        file: UploadFile,
        topic: str = "general",
        max_questions: Optional[int] = None,
    ) -> Quiz:
        """
        Crea un cuestionario a partir de un archivo temporal.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            file: Archivo subido
            topic: Tema específico o "general"
            max_questions: Número de preguntas (opcional)

        Returns:
            Cuestionario creado
        """
        # 1. Extraer texto del archivo
        filename, _ = FileProcessor.validate_file(file)
        text = await FileProcessor.extract_text(file)

        # 2. Determinar número de preguntas
        num_questions = max_questions or settings.DEFAULT_QUIZ_QUESTIONS
        num_questions = min(num_questions, settings.MAX_QUESTIONS_PER_QUIZ)

        # 3. Calcular dificultad adaptativa
        difficulty_level = self.calculate_adaptive_difficulty(db, user_id, topic)

        # 4. Generar cuestionario con OpenAI
        questions_data = self.openai_service.generate_quiz(
            text=text,
            topic=topic,
            difficulty_level=difficulty_level,
            num_questions=num_questions,
        )

        # 5. Crear cuestionario en BD
        quiz = QuizRepository.create_quiz(
            db=db,
            user_id=user_id,
            summary_id=None,  # No hay resumen asociado
            title=f"Cuestionario: {filename}",
            topic=topic,
            difficulty_level=difficulty_level,
            max_questions=num_questions,
        )

        # 6. Crear preguntas
        for idx, q_data in enumerate(questions_data[:num_questions], start=1):
            options = q_data.get("options", {})
            QuizRepository.create_question(
                db=db,
                quiz_id=quiz.id,
                question_text=q_data.get("question", ""),
                option_a=options.get("A", ""),
                option_b=options.get("B", ""),
                option_c=options.get("C", ""),
                option_d=options.get("D", ""),
                correct_option=OptionEnum(q_data.get("correct", "A")),
                explanation=q_data.get("explanation", ""),
                order=idx,
            )

        # Refrescar para cargar las preguntas
        db.refresh(quiz)
        return quiz

    def create_quiz_from_summary(
        self,
        db: Session,
        user_id: UUID,
        summary_id: UUID,
        topic: str = "general",
        max_questions: Optional[int] = None,
    ) -> Quiz:
        """
        Crea un cuestionario a partir de un resumen existente.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            summary_id: ID del resumen
            topic: Tema específico o "general"
            max_questions: Número de preguntas (opcional)

        Returns:
            Cuestionario creado

        Raises:
            HTTPException: Si el resumen no existe o no pertenece al usuario
        """
        # 1. Verificar que el resumen existe y pertenece al usuario
        summary = SummaryRepository.get_by_id(db, summary_id)

        if not summary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resumen no encontrado"
            )

        if summary.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para usar este resumen"
            )

        # 2. Usar el contenido del resumen
        summary_text = summary.content.get("summary", "")

        # 3. Determinar número de preguntas
        num_questions = max_questions or settings.DEFAULT_QUIZ_QUESTIONS
        num_questions = min(num_questions, settings.MAX_QUESTIONS_PER_QUIZ)

        # 4. Calcular dificultad adaptativa
        difficulty_level = self.calculate_adaptive_difficulty(db, user_id, topic)

        # 5. Generar cuestionario con OpenAI
        questions_data = self.openai_service.generate_quiz(
            text=summary_text,
            topic=topic,
            difficulty_level=difficulty_level,
            num_questions=num_questions,
        )

        # 6. Crear cuestionario en BD
        quiz = QuizRepository.create_quiz(
            db=db,
            user_id=user_id,
            summary_id=summary_id,
            title=f"Cuestionario: {summary.title}",
            topic=topic,
            difficulty_level=difficulty_level,
            max_questions=num_questions,
        )

        # 7. Crear preguntas
        for idx, q_data in enumerate(questions_data[:num_questions], start=1):
            options = q_data.get("options", {})
            QuizRepository.create_question(
                db=db,
                quiz_id=quiz.id,
                question_text=q_data.get("question", ""),
                option_a=options.get("A", ""),
                option_b=options.get("B", ""),
                option_c=options.get("C", ""),
                option_d=options.get("D", ""),
                correct_option=OptionEnum(q_data.get("correct", "A")),
                explanation=q_data.get("explanation", ""),
                order=idx,
            )

        # Refrescar para cargar las preguntas
        db.refresh(quiz)
        return quiz

    def get_quizzes(
        self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> Tuple[List[Quiz], int]:
        """
        Obtiene los cuestionarios de un usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            skip: Número de registros a saltar
            limit: Número máximo de registros

        Returns:
            Tupla (lista de cuestionarios, total)
        """
        quizzes = QuizRepository.get_quizzes_by_user(db, user_id, skip, limit)
        total = QuizRepository.count_quizzes_by_user(db, user_id)
        return quizzes, total

    def get_quiz(self, db: Session, quiz_id: UUID, user_id: UUID) -> Quiz:
        """
        Obtiene un cuestionario específico.

        Args:
            db: Sesión de base de datos
            quiz_id: ID del cuestionario
            user_id: ID del usuario

        Returns:
            Cuestionario

        Raises:
            HTTPException: Si no existe o no pertenece al usuario
        """
        quiz = QuizRepository.get_quiz_by_id(db, quiz_id)

        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cuestionario no encontrado"
            )

        if quiz.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para acceder a este cuestionario"
            )

        return quiz
