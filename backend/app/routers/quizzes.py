# app/routers/quizzes.py
"""
Router de cuestionarios - Generar y listar cuestionarios.
"""
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.core.dependencies import get_current_user
from app.services.quiz_service import QuizService
from app.schemas.quiz import QuizResponse, QuizListResponse
from app.models.user import User

router = APIRouter()
quiz_service = QuizService()


@router.post("/generate-from-file", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def generate_quiz_from_file(
    file: UploadFile = File(..., description="Archivo a procesar"),
    topic: str = Form("general", description="Tema específico o 'general'"),
    max_questions: Optional[int] = Form(None, ge=1, le=30, description="Número de preguntas (máx 30)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Genera un cuestionario a partir de un archivo temporal.

    La dificultad se adapta automáticamente según el desempeño histórico del usuario.

    Args:
        file: Archivo a procesar
        topic: Tema del cuestionario o "general"
        max_questions: Número de preguntas (si no se especifica, se calcula automáticamente)
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Cuestionario generado con preguntas
    """
    quiz = await quiz_service.create_quiz_from_file(
        db=db,
        user_id=current_user.id,
        file=file,
        topic=topic,
        max_questions=max_questions,
    )
    return quiz


@router.post("/generate-from-summary/{summary_id}", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
def generate_quiz_from_summary(
    summary_id: UUID,
    topic: str = Form("general", description="Tema específico o 'general'"),
    max_questions: Optional[int] = Form(None, ge=1, le=30, description="Número de preguntas (máx 30)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Genera un cuestionario a partir de un resumen existente.

    Args:
        summary_id: ID del resumen
        topic: Tema del cuestionario o "general"
        max_questions: Número de preguntas
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Cuestionario generado

    Raises:
        HTTPException: Si el resumen no existe o no pertenece al usuario
    """
    quiz = quiz_service.create_quiz_from_summary(
        db=db,
        user_id=current_user.id,
        summary_id=summary_id,
        topic=topic,
        max_questions=max_questions,
    )
    return quiz


@router.get("", response_model=QuizListResponse)
def list_quizzes(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lista todos los cuestionarios del usuario.

    Args:
        skip: Número de registros a saltar
        limit: Número máximo de registros
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Lista de cuestionarios
    """
    quizzes, total = quiz_service.get_quizzes(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )
    return QuizListResponse(items=quizzes, total=total)


@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(
    quiz_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Obtiene un cuestionario específico con sus preguntas.

    **Nota:** Las respuestas correctas NO se incluyen en este endpoint.

    Args:
        quiz_id: ID del cuestionario
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Cuestionario con preguntas (sin respuestas correctas)

    Raises:
        HTTPException: Si el cuestionario no existe o no pertenece al usuario
    """
    quiz = quiz_service.get_quiz(
        db=db,
        quiz_id=quiz_id,
        user_id=current_user.id,
    )
    return quiz
