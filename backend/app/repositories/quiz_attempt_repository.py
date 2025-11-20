# app/repositories/quiz_attempt_repository.py
"""
Repository para operaciones de base de datos relacionadas con intentos de cuestionarios.
"""
from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID
from datetime import datetime
import random
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.quiz_attempt import QuizAttempt
from app.models.quiz import Quiz


class QuizAttemptRepository:
    """Repository para gestionar intentos de cuestionarios."""

    @staticmethod
    def _randomize_options(questions: List[Dict[str, Any]]) -> Tuple[List[str], List[Dict[str, Any]]]:
        """
        Aleatoriza las opciones de las preguntas y retorna las respuestas correctas.

        Args:
            questions: Lista de preguntas con formato:
                [{"question": "...", "options": {"correct": "...", "semi-correct": "...", ...}, "explanation": "..."}]

        Returns:
            Tupla (correct_answers, randomized_questions):
            - correct_answers: Lista de letras correctas ["A", "B", "C", ...]
            - randomized_questions: Preguntas con opciones aleatorizadas
        """
        correct_answers = []
        randomized_questions = []

        for q_data in questions:
            # Obtener opciones originales
            options = q_data.get("options", {})
            option_list = [
                ("correct", options.get("correct", "")),
                ("semi-correct", options.get("semi-correct", "")),
                ("incorrect1", options.get("incorrect1", "")),
                ("incorrect2", options.get("incorrect2", ""))
            ]

            # Aleatorizar orden
            random.shuffle(option_list)

            # Asignar A, B, C, D
            randomized_options = {}
            correct_letter = None

            for idx, (option_type, option_text) in enumerate(option_list):
                letter = ["A", "B", "C", "D"][idx]
                randomized_options[letter] = option_text

                if option_type == "correct":
                    correct_letter = letter

            # Guardar respuesta correcta
            correct_answers.append(correct_letter)

            # Crear pregunta aleatorizada
            randomized_questions.append({
                "question": q_data.get("question", ""),
                "options": randomized_options,
                "explanation": q_data.get("explanation", "")
            })

        return correct_answers, randomized_questions

    @staticmethod
    def create_attempt(db: Session, quiz: Quiz, user_id: UUID) -> Tuple[QuizAttempt, List[Dict[str, Any]]]:
        """
        Crea un nuevo intento de cuestionario con opciones aleatorizadas.

        Args:
            db: Sesión de base de datos
            quiz: Objeto Quiz con preguntas en formato JSON
            user_id: ID del usuario

        Returns:
            Tupla (attempt, randomized_questions):
            - attempt: Intento de cuestionario creado
            - randomized_questions: Lista de preguntas con opciones aleatorizadas
        """
        # Aleatorizar opciones
        correct_answers, randomized_questions = QuizAttemptRepository._randomize_options(quiz.questions)

        # Crear intento con respuestas correctas
        attempt = QuizAttempt(
            quiz_id=quiz.id,
            user_id=user_id,
            correct_answers=correct_answers,
            user_answers=[],  # Se llenarán conforme el usuario responde
        )
        db.add(attempt)
        db.commit()
        db.refresh(attempt)

        return attempt, randomized_questions

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
    def record_answer(
        db: Session,
        attempt: QuizAttempt,
        question_index: int,
        selected_option: str
    ) -> bool:
        """
        Registra la respuesta del usuario para una pregunta.

        Args:
            db: Sesión de base de datos
            attempt: Intento de cuestionario
            question_index: Índice de la pregunta (0-based)
            selected_option: Opción seleccionada ("A", "B", "C", "D")

        Returns:
            True si la respuesta es correcta, False si no
        """
        # Verificar si el índice es válido
        if question_index < 0 or question_index >= len(attempt.correct_answers):
            raise ValueError(f"Índice de pregunta inválido: {question_index}")

        # Actualizar user_answers
        user_answers = attempt.user_answers.copy() if attempt.user_answers else []

        # Rellenar con None si es necesario
        while len(user_answers) <= question_index:
            user_answers.append(None)

        user_answers[question_index] = selected_option
        attempt.user_answers = user_answers

        db.commit()
        db.refresh(attempt)

        # Verificar si es correcta
        is_correct = attempt.correct_answers[question_index] == selected_option
        return is_correct

    @staticmethod
    def calculate_score(attempt: QuizAttempt) -> float:
        """
        Calcula el score del intento basado en las respuestas.

        Args:
            attempt: Intento de cuestionario

        Returns:
            Score calculado (0-100)
        """
        if not attempt.correct_answers or not attempt.user_answers:
            return 0.0

        total_questions = len(attempt.correct_answers)
        correct_count = sum(
            1 for i, correct in enumerate(attempt.correct_answers)
            if i < len(attempt.user_answers) and attempt.user_answers[i] == correct
        )

        return (correct_count / total_questions) * 100.0

    @staticmethod
    def complete_attempt(db: Session, attempt: QuizAttempt) -> QuizAttempt:
        """
        Marca un intento como completado y calcula su score.

        Args:
            db: Sesión de base de datos
            attempt: Intento a completar

        Returns:
            Intento actualizado
        """
        # Calcular score
        score = QuizAttemptRepository.calculate_score(attempt)

        attempt.completed_at = datetime.utcnow()
        attempt.score = score
        db.commit()
        db.refresh(attempt)
        return attempt

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
