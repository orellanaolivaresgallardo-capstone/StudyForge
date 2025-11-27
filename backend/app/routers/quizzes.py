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
from app.repositories.quiz_attempt_repository import QuizAttemptRepository
from app.schemas.quiz import QuizResponse, QuizListResponse
from app.models.user import User

router = APIRouter()
quiz_service = QuizService()


def _enrich_quiz_response(quiz, db: Session, user_id: UUID) -> dict:
    """
    Enriquece un quiz con campos computados (metadata y origen).

    Args:
        quiz: Objeto Quiz de la base de datos
        db: Sesión de base de datos
        user_id: ID del usuario

    Returns:
        Diccionario con todos los campos para QuizResponse
    """
    # Determinar source_type
    if quiz.study_space_id:
        source_type = "space"
    elif quiz.summary_id:
        source_type = "summary"
    else:
        source_type = "file"

    # Construir diccionario con campos computados
    return {
        "id": quiz.id,
        "user_id": quiz.user_id,
        "summary_id": quiz.summary_id,
        "study_space_id": quiz.study_space_id,
        "title": quiz.title,
        "difficulty_level": quiz.difficulty_level,
        "created_at": quiz.created_at,
        "questions": quiz.questions,
        "source_document_ids": quiz.source_document_ids,
        "source_summary_ids": quiz.source_summary_ids,
        "study_space_name": quiz.study_space.name if quiz.study_space else None,
        "summary_title": quiz.summary.title if quiz.summary else None,
        "document_names": [d.file_name for d in quiz.summary.documents] if quiz.summary else [],
        "source_type": source_type,
        "num_questions": len(quiz.questions),
        "num_attempts": QuizAttemptRepository.count_attempts_by_quiz(db, quiz.id, user_id)
    }


@router.post("/generate-from-file", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def generate_quiz_from_file(
    file: UploadFile = File(..., description="Archivo a procesar"),
    max_questions: Optional[int] = Form(None, ge=5, le=30, description="Número de preguntas (5-30)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Genera un cuestionario a partir de un archivo temporal.

    La dificultad es fija (nivel 2) para archivos sin espacio asignado.

    Args:
        file: Archivo a procesar
        max_questions: Número de preguntas (si no se especifica, se calcula automáticamente)
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Cuestionario generado con preguntas y metadata
    """
    quiz = await quiz_service.create_quiz_from_file(
        db=db,
        user_id=current_user.id,
        file=file,
        max_questions=max_questions,
    )

    # Enriquecer con metadata
    quiz_dict = _enrich_quiz_response(quiz, db, current_user.id)
    return QuizResponse(**quiz_dict)


@router.post("/generate-from-summary/{summary_id}", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
def generate_quiz_from_summary(
    summary_id: UUID,
    max_questions: Optional[int] = Form(None, ge=5, le=30, description="Número de preguntas (5-30)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Genera un cuestionario a partir de un resumen existente.

    La dificultad se adapta según el espacio de estudio si está disponible.

    Args:
        summary_id: ID del resumen
        max_questions: Número de preguntas
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Cuestionario generado con metadata

    Raises:
        HTTPException: Si el resumen no existe o no pertenece al usuario
    """
    quiz = quiz_service.create_quiz_from_summary(
        db=db,
        user=current_user,
        summary_id=summary_id,
        max_questions=max_questions,
    )

    # Enriquecer con metadata
    quiz_dict = _enrich_quiz_response(quiz, db, current_user.id)
    return QuizResponse(**quiz_dict)


@router.post("/generate-from-document/{document_id}", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
def generate_quiz_from_document(
    document_id: UUID,
    max_questions: Optional[int] = Form(None, ge=5, le=30, description="Número de preguntas (5-30)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Genera un cuestionario a partir de un documento existente.

    La dificultad se adapta según el espacio de estudio si está disponible.

    Args:
        document_id: ID del documento
        max_questions: Número de preguntas
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Cuestionario generado con metadata

    Raises:
        HTTPException: Si el documento no existe o no pertenece al usuario
    """
    quiz = quiz_service.create_quiz_from_document(
        db=db,
        user=current_user,
        document_id=document_id,
        max_questions=max_questions,
    )

    # Enriquecer con metadata
    quiz_dict = _enrich_quiz_response(quiz, db, current_user.id)
    return QuizResponse(**quiz_dict)


@router.get("", response_model=QuizListResponse)
def list_quizzes(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lista todos los cuestionarios del usuario con metadata completa.

    Args:
        skip: Número de registros a saltar
        limit: Número máximo de registros
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Lista de cuestionarios con metadata y origen
    """
    quizzes, total = quiz_service.get_quizzes(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )

    # Enriquecer cada quiz con metadata
    enriched_quizzes = []
    for quiz in quizzes:
        quiz_dict = _enrich_quiz_response(quiz, db, current_user.id)
        enriched_quizzes.append(QuizResponse(**quiz_dict))

    return QuizListResponse(items=enriched_quizzes, total=total)


@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(
    quiz_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Obtiene un cuestionario específico con sus preguntas y metadata completa.

    **Nota:** Las respuestas correctas NO se incluyen en este endpoint.

    Args:
        quiz_id: ID del cuestionario
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Cuestionario con preguntas, metadata y origen

    Raises:
        HTTPException: Si el cuestionario no existe o no pertenece al usuario
    """
    quiz = quiz_service.get_quiz(
        db=db,
        quiz_id=quiz_id,
        user=current_user,
    )

    # Enriquecer con metadata
    quiz_dict = _enrich_quiz_response(quiz, db, current_user.id)
    return QuizResponse(**quiz_dict)


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(
    quiz_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Elimina un quiz (hard delete).

    IMPORTANTE: Los quiz_attempts asociados se preservan automáticamente
    para mantener el historial de progreso del usuario.

    Args:
        quiz_id: ID del quiz
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Raises:
        HTTPException: Si el quiz no existe o no pertenece al usuario
    """
    # Verificar ownership
    quiz = quiz_service.get_quiz(db, quiz_id, current_user)

    # Eliminar quiz usando el servicio de eliminación
    from app.services.deletion_service import DeletionService
    success = DeletionService.delete_quiz(db, quiz_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz no encontrado"
        )

    return None
