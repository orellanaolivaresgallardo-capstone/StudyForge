# app/routers/quiz_attempts.py
"""
Router de intentos de cuestionarios - Realizar cuestionarios y ver resultados.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.core.dependencies import get_current_user, verify_quiz_ownership, verify_quiz_attempt_ownership
from app.repositories.quiz_repository import QuizRepository
from app.repositories.quiz_attempt_repository import QuizAttemptRepository
from app.schemas.quiz_attempt import (
    QuizAttemptCreate,
    QuizAttemptResponse,
    AnswerCreate,
    AnswerFeedback,
    QuizResultResponse,
    QuestionResultDetail,
)
from app.models.user import User
from app.models.question import OptionEnum

router = APIRouter()


@router.post("", response_model=QuizAttemptResponse, status_code=status.HTTP_201_CREATED)
def start_quiz_attempt(
    attempt_data: QuizAttemptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Inicia un nuevo intento de cuestionario.

    Args:
        attempt_data: Datos del intento (quiz_id)
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Intento creado

    Raises:
        HTTPException: Si el cuestionario no existe o no pertenece al usuario
    """
    # Verificar que el quiz existe y pertenece al usuario
    quiz = QuizRepository.get_quiz_by_id(db, attempt_data.quiz_id)
    quiz = verify_quiz_ownership(quiz, current_user)

    # Crear intento
    attempt = QuizAttemptRepository.create_attempt(
        db=db,
        quiz_id=attempt_data.quiz_id,
        user_id=current_user.id,
    )

    return attempt


@router.post("/{attempt_id}/answer", response_model=AnswerFeedback)
def answer_question(
    attempt_id: UUID,
    answer_data: AnswerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Responde una pregunta y obtiene feedback inmediato.

    Args:
        attempt_id: ID del intento
        answer_data: Respuesta del usuario
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Feedback con la respuesta correcta y explicación

    Raises:
        HTTPException: Si el intento no existe, ya fue completado, o la pregunta ya fue respondida
    """
    # Verificar que el intento existe y pertenece al usuario
    attempt = QuizAttemptRepository.get_attempt_by_id(db, attempt_id)
    attempt = verify_quiz_attempt_ownership(attempt, current_user)

    if attempt.completed_at:  # type: ignore[truthy-bool]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este intento ya ha sido completado"
        )

    # Verificar que la pregunta existe y pertenece al quiz
    question = QuizRepository.get_question_by_id(db, answer_data.question_id)

    if not question:  # type: ignore[truthy-bool]
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pregunta no encontrada"
        )

    if question.quiz_id != attempt.quiz_id:  # type: ignore[comparison-overlap]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La pregunta no pertenece a este cuestionario"
        )

    # Verificar que no se haya respondido ya esta pregunta
    existing_answer = QuizAttemptRepository.get_answer(
        db, attempt_id, answer_data.question_id
    )

    if existing_answer:  # type: ignore[truthy-bool]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta pregunta ya ha sido respondida"
        )

    # Validar la respuesta
    selected_option = OptionEnum(answer_data.selected_option)
    is_correct = (selected_option == question.correct_option)  # type: ignore[comparison-overlap]

    # Guardar respuesta
    QuizAttemptRepository.create_answer(
        db=db,
        attempt_id=attempt_id,
        question_id=answer_data.question_id,
        selected_option=selected_option,
        is_correct=is_correct,
    )

    # Retornar feedback inmediato
    return AnswerFeedback(
        is_correct=is_correct,
        correct_option=question.correct_option.value,
        explanation=question.explanation,
        selected_option=answer_data.selected_option,
    )


@router.post("/{attempt_id}/complete", response_model=QuizAttemptResponse)
def complete_quiz_attempt(
    attempt_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Completa un intento de cuestionario y calcula el score.

    Args:
        attempt_id: ID del intento
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Intento completado con score

    Raises:
        HTTPException: Si el intento no existe o ya fue completado
    """
    # Verificar intento
    attempt = QuizAttemptRepository.get_attempt_by_id(db, attempt_id)
    attempt = verify_quiz_attempt_ownership(attempt, current_user)

    if attempt.completed_at:  # type: ignore[truthy-bool]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este intento ya ha sido completado"
        )

    # Calcular score
    total_questions = len(attempt.answers)
    if total_questions == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se han respondido preguntas"
        )

    correct_answers = sum(1 for answer in attempt.answers if answer.is_correct)
    score = (correct_answers / total_questions) * 100

    # Completar intento
    attempt = QuizAttemptRepository.complete_attempt(db, attempt, score)

    return attempt


@router.get("/{attempt_id}/results", response_model=QuizResultResponse)
def get_quiz_results(
    attempt_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Obtiene los resultados detallados de un intento completado.

    Args:
        attempt_id: ID del intento
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Resultados completos con todas las preguntas y respuestas

    Raises:
        HTTPException: Si el intento no existe o no ha sido completado
    """
    # Verificar intento
    attempt = QuizAttemptRepository.get_attempt_by_id(db, attempt_id)
    attempt = verify_quiz_attempt_ownership(attempt, current_user)

    if not attempt.completed_at:  # type: ignore[truthy-bool]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El intento aún no ha sido completado"
        )

    # Construir respuesta detallada
    questions_details = []
    for answer in attempt.answers:
        question = answer.question
        questions_details.append(
            QuestionResultDetail(
                question_text=question.question_text,
                option_a=question.option_a,
                option_b=question.option_b,
                option_c=question.option_c,
                option_d=question.option_d,
                correct_option=question.correct_option.value,
                selected_option=answer.selected_option.value,
                is_correct=answer.is_correct,
                explanation=question.explanation,
            )
        )

    total_questions = len(attempt.answers)
    correct_answers = sum(1 for answer in attempt.answers if answer.is_correct)
    incorrect_answers = total_questions - correct_answers

    return QuizResultResponse(
        attempt_id=attempt.id,
        quiz_id=attempt.quiz_id,
        score=attempt.score,
        total_questions=total_questions,
        correct_answers=correct_answers,
        incorrect_answers=incorrect_answers,
        completed_at=attempt.completed_at,
        questions=questions_details,
    )
