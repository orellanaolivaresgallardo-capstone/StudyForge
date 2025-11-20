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
    QuizAttemptWithQuestionsResponse,
    AnswerCreate,
    AnswerFeedback,
    QuizResultResponse,
    QuestionResultDetail,
)
from app.models.user import User

router = APIRouter()


@router.post("", response_model=QuizAttemptWithQuestionsResponse, status_code=status.HTTP_201_CREATED)
def start_quiz_attempt(
    attempt_data: QuizAttemptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Inicia un nuevo intento de cuestionario con opciones aleatorizadas.

    Args:
        attempt_data: Datos del intento (quiz_id)
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Intento creado con preguntas aleatorizadas

    Raises:
        HTTPException: Si el cuestionario no existe o no pertenece al usuario
    """
    # Verificar que el quiz existe y pertenece al usuario
    quiz = QuizRepository.get_quiz_by_id(db, attempt_data.quiz_id)
    quiz = verify_quiz_ownership(quiz, current_user)

    # Crear intento con opciones aleatorizadas
    attempt, randomized_questions = QuizAttemptRepository.create_attempt(
        db=db,
        quiz=quiz,
        user_id=current_user.id,
    )

    # Retornar attempt con las preguntas aleatorizadas
    return QuizAttemptWithQuestionsResponse(
        id=attempt.id,
        quiz_id=attempt.quiz_id,
        user_id=attempt.user_id,
        started_at=attempt.started_at,
        completed_at=attempt.completed_at,
        score=attempt.score,
        correct_answers=attempt.correct_answers,
        user_answers=attempt.user_answers,
        randomized_questions=randomized_questions,
    )


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
        answer_data: Respuesta del usuario (question_index, selected_option)
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Feedback con la respuesta correcta y explicación

    Raises:
        HTTPException: Si el intento no existe, ya fue completado, o el índice es inválido
    """
    # Verificar que el intento existe y pertenece al usuario
    attempt = QuizAttemptRepository.get_attempt_by_id(db, attempt_id)
    attempt = verify_quiz_attempt_ownership(attempt, current_user)

    if attempt.completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este intento ya ha sido completado"
        )

    # Obtener quiz para acceder a las preguntas
    quiz = QuizRepository.get_quiz_by_id(db, attempt.quiz_id)

    # Validar índice de pregunta
    if answer_data.question_index < 0 or answer_data.question_index >= len(quiz.questions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Índice de pregunta inválido: {answer_data.question_index}"
        )

    # Verificar que no se haya respondido ya esta pregunta
    if (attempt.user_answers and
        len(attempt.user_answers) > answer_data.question_index and
        attempt.user_answers[answer_data.question_index] is not None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta pregunta ya ha sido respondida"
        )

    # Registrar respuesta
    try:
        is_correct = QuizAttemptRepository.record_answer(
            db=db,
            attempt=attempt,
            question_index=answer_data.question_index,
            selected_option=answer_data.selected_option
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Obtener la pregunta original para la explicación
    question_data = quiz.questions[answer_data.question_index]
    correct_option = attempt.correct_answers[answer_data.question_index]

    # Calcular score hasta el momento
    score_so_far = QuizAttemptRepository.calculate_score(attempt) if attempt.user_answers else 0.0

    # Retornar feedback inmediato
    return AnswerFeedback(
        is_correct=is_correct,
        correct_option=correct_option,
        explanation=question_data.get("explanation", ""),
        selected_option=answer_data.selected_option,
        score_so_far=score_so_far
    )


@router.post("/{attempt_id}/complete", response_model=QuizAttemptResponse)
def complete_quiz_attempt(
    attempt_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Completa un intento de cuestionario y calcula el score final.

    Args:
        attempt_id: ID del intento
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Intento completado con score final

    Raises:
        HTTPException: Si el intento no existe, ya fue completado, o no se respondieron preguntas
    """
    # Verificar intento
    attempt = QuizAttemptRepository.get_attempt_by_id(db, attempt_id)
    attempt = verify_quiz_attempt_ownership(attempt, current_user)

    if attempt.completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este intento ya ha sido completado"
        )

    # Verificar que se respondieron preguntas
    if not attempt.user_answers or len(attempt.user_answers) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se han respondido preguntas"
        )

    # Completar intento (auto-calcula score)
    attempt = QuizAttemptRepository.complete_attempt(db, attempt)

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

    if not attempt.completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El intento aún no ha sido completado"
        )

    # Obtener quiz para acceder a las preguntas originales
    quiz = QuizRepository.get_quiz_by_id(db, attempt.quiz_id)

    # NOTA: Necesitamos reconstruir las preguntas aleatorizadas desde el intento
    # Como no almacenamos las preguntas aleatorizadas, las reconstruiremos aquí
    # En una implementación real, podríamos almacenarlas en el attempt como JSONB

    # Por ahora, construir detalles de preguntas con las respuestas
    questions_details = []
    for idx, question_data in enumerate(quiz.questions):
        if idx >= len(attempt.correct_answers) or idx >= len(attempt.user_answers):
            continue

        # Reconstruir opciones aleatorizadas (esto es una limitación temporal)
        # En producción, deberíamos almacenar las opciones aleatorizadas en el attempt
        options = question_data.get("options", {})
        randomized_options = {
            "A": options.get("correct", ""),
            "B": options.get("semi-correct", ""),
            "C": options.get("incorrect1", ""),
            "D": options.get("incorrect2", "")
        }

        correct_option = attempt.correct_answers[idx]
        selected_option = attempt.user_answers[idx] if idx < len(attempt.user_answers) else None
        is_correct = (selected_option == correct_option) if selected_option else False

        questions_details.append(
            QuestionResultDetail(
                question_text=question_data.get("question", ""),
                options=randomized_options,
                correct_option=correct_option,
                selected_option=selected_option or "",
                is_correct=is_correct,
                explanation=question_data.get("explanation", ""),
            )
        )

    total_questions = len(attempt.correct_answers)
    correct_count = sum(
        1 for i, correct in enumerate(attempt.correct_answers)
        if i < len(attempt.user_answers) and attempt.user_answers[i] == correct
    )
    incorrect_count = total_questions - correct_count

    return QuizResultResponse(
        attempt_id=attempt.id,
        quiz_id=attempt.quiz_id,
        score=attempt.score or 0.0,
        total_questions=total_questions,
        correct_answers=correct_count,
        incorrect_answers=incorrect_count,
        completed_at=attempt.completed_at,
        questions=questions_details,
    )
