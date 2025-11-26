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
from app.models.user import User
from app.core.dependencies import verify_quiz_ownership, verify_summary_ownership
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
        if max_questions is not None:
            # Usuario especificó cantidad: validar rango 5-30
            num_questions = max(settings.MIN_QUESTIONS_PER_QUIZ,
                               min(max_questions, settings.MAX_QUESTIONS_PER_QUIZ))
        else:
            # Usar valor por defecto
            num_questions = settings.DEFAULT_QUIZ_QUESTIONS

        # 3. Calcular dificultad adaptativa
        difficulty_level = self.calculate_adaptive_difficulty(db, user_id, topic)

        # 4. Generar cuestionario con OpenAI
        questions_data = self.openai_service.generate_quiz(
            text=text,
            topic=topic,
            difficulty_level=difficulty_level,
            num_questions=num_questions,
        )

        # 5. Crear cuestionario en BD con preguntas en formato JSON
        quiz = QuizRepository.create_quiz(
            db=db,
            user_id=user_id,
            summary_id=None,  # No hay resumen asociado
            study_space_id=None,  # No hay espacio asociado
            title=f"Cuestionario: {filename}",
            topic=topic,
            difficulty_level=difficulty_level,
            questions=questions_data[:num_questions],
        )

        return quiz

    def create_quiz_from_summary(
        self,
        db: Session,
        user: User,
        summary_id: UUID,
        topic: str = "general",
        max_questions: Optional[int] = None,
    ) -> Quiz:
        """
        Crea un cuestionario a partir de un resumen existente.

        Args:
            db: Sesión de base de datos
            user: Usuario autenticado
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
        summary = verify_summary_ownership(summary, user)

        # 2. Inferir tema automáticamente si es "general" o None
        # TODO: Mejorar esto en el futuro para inferir el tema de las preguntas generadas
        if topic == "general" or topic is None:
            # Usar el primer tema del resumen, o "general" si no hay temas
            if summary.topics and len(summary.topics) > 0:
                topic = summary.topics[0]
            else:
                topic = "general"

        # 3. Usar el contenido del resumen
        summary_text = summary.content.get("summary", "")

        # 4. Determinar número de preguntas
        if max_questions is not None:
            # Usuario especificó cantidad: validar rango 5-30
            num_questions = max(settings.MIN_QUESTIONS_PER_QUIZ,
                               min(max_questions, settings.MAX_QUESTIONS_PER_QUIZ))
        else:
            # Usar valor por defecto
            num_questions = settings.DEFAULT_QUIZ_QUESTIONS

        # 5. Calcular dificultad adaptativa
        difficulty_level = self.calculate_adaptive_difficulty(db, user.id, topic)

        # 5.5. Obtener contexto del espacio si el resumen pertenece a un espacio
        space_context = None
        if len(summary.study_spaces) > 0:
            # Usar la descripción del primer espacio como contexto
            first_space = summary.study_spaces[0]
            if first_space.description:
                space_context = first_space.description

        # 6. Generar cuestionario con OpenAI (con contexto del espacio si está disponible)
        questions_data = self.openai_service.generate_quiz(
            text=summary_text,
            topic=topic,
            difficulty_level=difficulty_level,
            num_questions=num_questions,
            space_context=space_context,
        )

        # 7. Determinar study_space_id automáticamente
        # Si el resumen pertenece a exactamente un espacio, heredar
        study_space_id = None
        if len(summary.study_spaces) == 1:
            study_space_id = summary.study_spaces[0].id

        # 8. Crear cuestionario en BD con preguntas en formato JSON
        quiz = QuizRepository.create_quiz(
            db=db,
            user_id=user.id,
            summary_id=summary_id,
            study_space_id=study_space_id,
            title=f"Cuestionario: {summary.title}",
            topic=topic,
            difficulty_level=difficulty_level,
            questions=questions_data[:num_questions],
        )

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

    def get_quiz(self, db: Session, quiz_id: UUID, user: User) -> Quiz:
        """
        Obtiene un cuestionario específico.

        Args:
            db: Sesión de base de datos
            quiz_id: ID del cuestionario
            user: Usuario autenticado

        Returns:
            Cuestionario

        Raises:
            HTTPException: Si no existe o no pertenece al usuario
        """
        quiz = QuizRepository.get_quiz_by_id(db, quiz_id)
        quiz = verify_quiz_ownership(quiz, user)
        return quiz

    def create_quiz_from_space(
        self,
        db: Session,
        user: User,
        space_id: UUID,
        topic: str = "general",
        max_questions: Optional[int] = None,
    ) -> Quiz:
        """
        Crea un cuestionario a partir de todos los resúmenes de un espacio de estudio.

        Args:
            db: Sesión de base de datos
            user: Usuario autenticado
            space_id: ID del espacio de estudio
            topic: Tema específico o "general"
            max_questions: Número de preguntas (opcional)

        Returns:
            Cuestionario creado

        Raises:
            HTTPException: Si el espacio no existe, no pertenece al usuario, o no tiene resúmenes
        """
        # 1. Verificar que el espacio existe y pertenece al usuario
        from app.repositories.study_space_repository import StudySpaceRepository
        from app.core.dependencies import verify_space_ownership

        space = StudySpaceRepository.get_by_id(db, space_id)
        space = verify_space_ownership(space, user)

        # 2. Verificar que el espacio tiene resúmenes
        if not space.summaries or len(space.summaries) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El espacio no tiene resúmenes. Debe generar al menos un resumen antes de crear un cuestionario."
            )

        # 3. Combinar el contenido de todos los resúmenes del espacio
        combined_texts = []
        all_topics = []
        for summary in space.summaries:
            summary_text = summary.content.get("summary", "")
            if summary_text:
                combined_texts.append(summary_text)
            # Recopilar todos los temas de los resúmenes
            if summary.topics:
                all_topics.extend(summary.topics)

        if not combined_texts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Los resúmenes del espacio no contienen contenido válido"
            )

        combined_text = "\n\n".join(combined_texts)

        # 4. Inferir tema automáticamente si es "general" o None
        if topic == "general" or topic is None:
            # Usar el tema más común de los resúmenes, o "general" si no hay temas
            if all_topics:
                # Encontrar el tema más frecuente
                from collections import Counter
                topic_counts = Counter(all_topics)
                topic = topic_counts.most_common(1)[0][0]
            else:
                topic = "general"

        # 5. Determinar número de preguntas
        if max_questions is not None:
            # Usuario especificó cantidad: validar rango 5-30
            num_questions = max(settings.MIN_QUESTIONS_PER_QUIZ,
                               min(max_questions, settings.MAX_QUESTIONS_PER_QUIZ))
        else:
            # Usar valor por defecto
            num_questions = settings.DEFAULT_QUIZ_QUESTIONS

        # 6. Calcular dificultad adaptativa
        difficulty_level = self.calculate_adaptive_difficulty(db, user.id, topic)

        # 7. Obtener contexto del espacio (descripción)
        space_context = space.description if space.description else None

        # 8. Generar cuestionario con OpenAI (con contexto del espacio)
        questions_data = self.openai_service.generate_quiz(
            text=combined_text,
            topic=topic,
            difficulty_level=difficulty_level,
            num_questions=num_questions,
            space_context=space_context,
        )

        # 9. Crear cuestionario en BD con preguntas en formato JSON
        quiz = QuizRepository.create_quiz(
            db=db,
            user_id=user.id,
            summary_id=None,  # No está asociado a un resumen específico, sino al espacio
            study_space_id=space_id,  # Auto-asignado al espacio
            title=f"Cuestionario: {space.name}",
            topic=topic,
            difficulty_level=difficulty_level,
            questions=questions_data[:num_questions],
        )

        return quiz
