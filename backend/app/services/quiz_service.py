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
        self, db: Session, user_id: UUID, space_id: UUID
    ) -> int:
        """
        Calcula el nivel de dificultad adaptativo basado en el desempeño histórico.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            space_id: ID del espacio de estudio

        Returns:
            Nivel de dificultad (1-5)
        """
        # Obtener últimos 5 intentos del usuario en el espacio
        recent_attempts = QuizAttemptRepository.get_recent_attempts_by_space(
            db, user_id, space_id, limit=5
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
        study_space_id: UUID,
        file: UploadFile,
        max_questions: Optional[int] = None,
    ) -> Quiz:
        """
        Crea un cuestionario a partir de un archivo temporal.
        NOTA: Ahora requiere study_space_id ya que todos los quizzes deben pertenecer a un espacio.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            study_space_id: ID del espacio de estudio (requerido)
            file: Archivo subido
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

        # 3. Calcular dificultad adaptativa basada en el espacio
        difficulty_level = self.calculate_adaptive_difficulty(db, user_id, study_space_id)

        # 4. Generar cuestionario con OpenAI
        questions_data = self.openai_service.generate_quiz(
            text=text,
            difficulty_level=difficulty_level,
            num_questions=num_questions,
        )

        # 5. Crear cuestionario en BD con preguntas en formato JSON
        quiz = QuizRepository.create_quiz(
            db=db,
            user_id=user_id,
            study_space_id=study_space_id,
            source_type='study_space',  # Quiz temporal desde archivo
            title=f"Cuestionario: {filename}",
            difficulty_level=difficulty_level,
            questions=questions_data[:num_questions],
            source_document_id=None,
            source_summary_id=None,
            source_names={"file": filename},
            source_metadata={"file_type": "temporary"}
        )

        return quiz

    def create_quiz_from_document(
        self,
        db: Session,
        user: User,
        document_id: UUID,
        study_space_id: UUID,
        max_questions: Optional[int] = None,
    ) -> Quiz:
        """
        Crea un cuestionario a partir de un documento existente.

        Args:
            db: Sesión de base de datos
            user: Usuario autenticado
            document_id: ID del documento
            study_space_id: ID del espacio de estudio (requerido)
            max_questions: Número de preguntas (opcional)

        Returns:
            Cuestionario creado

        Raises:
            HTTPException: Si el documento no existe o no pertenece al usuario
        """
        # 1. Verificar que el documento existe y pertenece al usuario
        from app.repositories.document_repository import DocumentRepository
        from app.core.dependencies import verify_document_ownership

        document = DocumentRepository.get_by_id(db, document_id)
        document = verify_document_ownership(document, user)

        # 2. Usar el texto extraído del documento
        document_text = document.extracted_text

        if not document_text or document_text.strip() == "":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El documento no tiene texto extraído válido"
            )

        # 3. Determinar número de preguntas
        if max_questions is not None:
            # Usuario especificó cantidad: validar rango 5-30
            num_questions = max(settings.MIN_QUESTIONS_PER_QUIZ,
                               min(max_questions, settings.MAX_QUESTIONS_PER_QUIZ))
        else:
            # Usar valor por defecto
            num_questions = settings.DEFAULT_QUIZ_QUESTIONS

        # 4. Verificar que el documento está en el espacio especificado y obtener contexto
        from app.repositories.study_space_repository import StudySpaceRepository
        from app.core.dependencies import verify_space_ownership

        # Verificar que el espacio existe y pertenece al usuario
        space = StudySpaceRepository.get_by_id(db, study_space_id)
        space = verify_space_ownership(space, user)

        # Verificar que el documento está asociado a este espacio
        document_in_space = any(s.id == study_space_id for s in document.study_spaces)
        if not document_in_space:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El documento no está asociado al espacio de estudio especificado"
            )

        # Calcular dificultad adaptativa basada en el espacio
        difficulty_level = self.calculate_adaptive_difficulty(db, user.id, study_space_id)

        # Obtener contexto del espacio si está disponible
        space_context = space.description if space.description else None

        # 5. Generar cuestionario con OpenAI (con contexto del espacio si está disponible)
        questions_data = self.openai_service.generate_quiz(
            text=document_text,
            difficulty_level=difficulty_level,
            num_questions=num_questions,
            space_context=space_context,
        )

        # 6. Crear cuestionario en BD con preguntas en formato JSON
        quiz = QuizRepository.create_quiz(
            db=db,
            user_id=user.id,
            study_space_id=study_space_id,
            source_type='document',
            title=f"Cuestionario: {document.title}",
            difficulty_level=difficulty_level,
            questions=questions_data[:num_questions],
            source_document_id=document_id,
            source_summary_id=None,
            source_names={"document": document.title},
            source_metadata={"document_filename": document.file_name, "document_type": document.file_type}
        )

        return quiz

    def create_quiz_from_summary(
        self,
        db: Session,
        user: User,
        summary_id: UUID,
        max_questions: Optional[int] = None,
    ) -> Quiz:
        """
        Crea un cuestionario a partir de un resumen existente.

        Args:
            db: Sesión de base de datos
            user: Usuario autenticado
            summary_id: ID del resumen
            max_questions: Número de preguntas (opcional)

        Returns:
            Cuestionario creado

        Raises:
            HTTPException: Si el resumen no existe o no pertenece al usuario
        """
        # 1. Verificar que el resumen existe y pertenece al usuario
        summary = SummaryRepository.get_by_id(db, summary_id)
        summary = verify_summary_ownership(summary, user)

        # 2. Usar el contenido del resumen
        summary_text = summary.content.get("summary", "")

        # 3. Determinar número de preguntas
        if max_questions is not None:
            # Usuario especificó cantidad: validar rango 5-30
            num_questions = max(settings.MIN_QUESTIONS_PER_QUIZ,
                               min(max_questions, settings.MAX_QUESTIONS_PER_QUIZ))
        else:
            # Usar valor por defecto
            num_questions = settings.DEFAULT_QUIZ_QUESTIONS

        # 4. Determinar study_space_id y calcular dificultad
        # Summary ahora tiene relación 1-N con StudySpace (siempre tiene uno)
        study_space_id = summary.study_space_id
        difficulty_level = 2  # Dificultad por defecto
        space_context = None

        if study_space_id:
            # Calcular dificultad basada en el espacio
            difficulty_level = self.calculate_adaptive_difficulty(db, user.id, study_space_id)
            # Obtener contexto del espacio
            if summary.study_space and summary.study_space.description:
                space_context = summary.study_space.description

        # 5. Generar cuestionario con OpenAI (con contexto del espacio si está disponible)
        questions_data = self.openai_service.generate_quiz(
            text=summary_text,
            difficulty_level=difficulty_level,
            num_questions=num_questions,
            space_context=space_context,
        )

        # 6. Crear cuestionario en BD con preguntas en formato JSON
        quiz = QuizRepository.create_quiz(
            db=db,
            user_id=user.id,
            study_space_id=study_space_id,
            source_type='summary',
            title=f"Cuestionario: {summary.title}",
            difficulty_level=difficulty_level,
            questions=questions_data[:num_questions],
            source_document_id=None,  # Must be NULL when source_type='summary' (constraint)
            source_summary_id=summary_id,
            source_names={"summary": summary.title, "document": summary.source_document_title or "Unknown"},
            source_metadata={"expertise_level": summary.expertise_level, "document_state": summary.document_state}
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
        max_questions: Optional[int] = None,
    ) -> Quiz:
        """
        Crea un cuestionario a partir de todos los resúmenes de un espacio de estudio.

        Args:
            db: Sesión de base de datos
            user: Usuario autenticado
            space_id: ID del espacio de estudio
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
        for summary in space.summaries:
            summary_text = summary.content.get("summary", "")
            if summary_text:
                combined_texts.append(summary_text)

        if not combined_texts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Los resúmenes del espacio no contienen contenido válido"
            )

        combined_text = "\n\n".join(combined_texts)

        # 4. Determinar número de preguntas
        if max_questions is not None:
            # Usuario especificó cantidad: validar rango 5-30
            num_questions = max(settings.MIN_QUESTIONS_PER_QUIZ,
                               min(max_questions, settings.MAX_QUESTIONS_PER_QUIZ))
        else:
            # Usar valor por defecto
            num_questions = settings.DEFAULT_QUIZ_QUESTIONS

        # 5. Calcular dificultad adaptativa basada en el espacio
        difficulty_level = self.calculate_adaptive_difficulty(db, user.id, space_id)

        # 6. Obtener contexto del espacio (descripción)
        space_context = space.description if space.description else None

        # 7. Generar cuestionario con OpenAI (con contexto del espacio)
        questions_data = self.openai_service.generate_quiz(
            text=combined_text,
            difficulty_level=difficulty_level,
            num_questions=num_questions,
            space_context=space_context,
        )

        # 8. Crear cuestionario en BD con preguntas en formato JSON
        # Recopilar nombres y metadatos de todos los resúmenes del espacio
        summary_names = [summary.title for summary in space.summaries]
        summary_ids = [str(summary.id) for summary in space.summaries]

        quiz = QuizRepository.create_quiz(
            db=db,
            user_id=user.id,
            study_space_id=space_id,
            source_type='study_space',
            title=f"Cuestionario: {space.name}",
            difficulty_level=difficulty_level,
            questions=questions_data[:num_questions],
            source_document_id=None,  # No hay un documento específico
            source_summary_id=None,  # No hay un resumen específico
            source_names={"space": space.name, "summaries": summary_names},
            source_metadata={"summary_count": len(space.summaries), "summary_ids": summary_ids}
        )

        return quiz
