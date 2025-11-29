# app/routers/study_spaces.py
"""
Router para operaciones de espacios de estudio.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.core.dependencies import get_current_user
from app.services.study_space_service import StudySpaceService
from app.schemas.study_space import (
    StudySpaceCreate,
    StudySpaceUpdate,
    StudySpaceResponse,
    StudySpaceDetailResponse,
    StudySpaceListResponse,
    StudySpaceWithStatsResponse,
    StudySpaceListWithStatsResponse,
    AddResourceRequest,
    DeleteSpaceRequest,
    StudySpaceStatsResponse,
)
from app.schemas.summary import SummaryResponse
from app.schemas.document import DocumentResponse
from app.schemas.quiz import QuizCreateFromSpace, QuizResponse, QuizListResponse
from app.models.user import User

router = APIRouter()
service = StudySpaceService()


@router.post("", response_model=StudySpaceResponse, status_code=status.HTTP_201_CREATED)
def create_study_space(
    request: StudySpaceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crear nuevo espacio de estudio."""
    return service.create_space(
        db, current_user.id, request.name, request.description, request.color
    )


@router.get("", response_model=StudySpaceListResponse | StudySpaceListWithStatsResponse)
def list_study_spaces(
    skip: int = 0,
    limit: int = 100,
    include_stats: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Listar espacios, opcionalmente con estadísticas."""
    if include_stats:
        spaces_data, total = service.get_spaces_with_stats(
            db, current_user.id, skip, limit
        )
        items = [
            StudySpaceWithStatsResponse(
                **space['space'].__dict__,
                num_documents=space['num_documents'],
                num_summaries=space['num_summaries'],
                num_quizzes=space['num_quizzes'],
                avg_score=space['avg_score']
            )
            for space in spaces_data
        ]
        return StudySpaceListWithStatsResponse(items=items, total=total)
    else:
        # Comportamiento actual sin cambios
        spaces, total = service.get_spaces(db, current_user.id, skip, limit)
        return StudySpaceListResponse(items=spaces, total=total)


@router.get("/{space_id}", response_model=StudySpaceDetailResponse)
def get_study_space(
    space_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtener detalle de espacio con recursos."""
    space = service.get_space(db, space_id, current_user)

    return StudySpaceDetailResponse(
        id=space.id,
        user_id=space.user_id,
        name=space.name,
        description=space.description,
        color=space.color,
        created_at=space.created_at,
        updated_at=space.updated_at,
        summaries=[SummaryResponse.model_validate(s) for s in space.summaries],
        documents=[DocumentResponse.model_validate(d) for d in space.documents],
    )


@router.put("/{space_id}", response_model=StudySpaceResponse)
def update_study_space(
    space_id: UUID,
    request: StudySpaceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Actualizar espacio."""
    return service.update_space(
        db, space_id, current_user, request.name, request.description, request.color
    )


@router.delete("/{space_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_space(
    space_id: UUID,
    request: DeleteSpaceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Eliminar espacio de estudio con confirmación de contraseña.

    IMPORTANTE: Esta operación elimina permanentemente:
    - El espacio de estudio
    - Todos los quizzes del espacio (CASCADE)
    - Todos los quiz_attempts de esos quizzes
    - Todas las relaciones con documentos y summaries (CASCADE en junction tables)

    Requiere confirmación con la contraseña del usuario.
    """
    from app.core.security import verify_password
    from fastapi import HTTPException

    # Verificar contraseña del usuario
    if not verify_password(request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña incorrecta"
        )

    # Eliminar espacio usando el servicio de eliminación con cascade
    from app.services.deletion_service import DeletionService
    success = DeletionService.delete_study_space_with_cascade(
        db, space_id, current_user.id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Espacio de estudio no encontrado"
        )


@router.post("/{space_id}/summaries", status_code=status.HTTP_204_NO_CONTENT)
def add_summary_to_space(
    space_id: UUID,
    request: AddResourceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Agregar resumen a espacio."""
    service.add_summary_to_space(db, space_id, request.resource_id, current_user)


@router.delete("/{space_id}/summaries/{summary_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_summary_from_space(
    space_id: UUID,
    summary_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remover resumen de espacio."""
    service.remove_summary_from_space(db, space_id, summary_id, current_user)


@router.post("/{space_id}/documents", status_code=status.HTTP_204_NO_CONTENT)
def add_document_to_space(
    space_id: UUID,
    request: AddResourceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Agregar documento a espacio."""
    service.add_document_to_space(db, space_id, request.resource_id, current_user)


@router.delete("/{space_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_document_from_space(
    space_id: UUID,
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remover documento de espacio."""
    service.remove_document_from_space(db, space_id, document_id, current_user)


@router.get("/{space_id}/stats", response_model=StudySpaceStatsResponse)
def get_space_stats(
    space_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtener estadísticas del espacio."""
    return service.get_space_stats(db, space_id, current_user)


@router.post("/{space_id}/quizzes", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
def create_quiz_from_space(
    space_id: UUID,
    request: QuizCreateFromSpace,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Crear un cuestionario desde los resúmenes de un espacio de estudio.

    El cuestionario se genera a partir de todos los resúmenes del espacio
    y se asigna automáticamente a ese espacio.
    """
    from app.services.quiz_service import QuizService
    from app.repositories.quiz_attempt_repository import QuizAttemptRepository

    quiz_service = QuizService()
    quiz = quiz_service.create_quiz_from_space(
        db=db,
        user=current_user,
        space_id=space_id,
        max_questions=request.max_questions,
    )

    # Enriquecer con metadata (misma lógica que en quizzes router)
    quiz_dict = {
        "id": quiz.id,
        "user_id": quiz.user_id,
        "study_space_id": quiz.study_space_id,  # NOW: Always present (NOT NULL)
        "source_type": quiz.source_type,  # NEW: 'document' | 'summary' | 'study_space'
        "title": quiz.title,
        "difficulty_level": quiz.difficulty_level,
        "created_at": quiz.created_at,
        "questions": quiz.questions,
        # NEW: Source tracking fields
        "source_document_id": quiz.source_document_id,
        "source_summary_id": quiz.source_summary_id,
        "source_names": quiz.source_names,  # JSONB cache
        "source_metadata": quiz.source_metadata,  # JSONB cache
        # Computed fields
        "study_space_name": quiz.study_space.name if quiz.study_space else None,
        "num_questions": len(quiz.questions),
        "num_attempts": QuizAttemptRepository.count_attempts_by_quiz(db, quiz.id, current_user.id)
    }

    return QuizResponse(**quiz_dict)


@router.get("/{space_id}/quizzes", response_model=QuizListResponse)
def get_space_quizzes(
    space_id: UUID,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Obtener todos los quizzes del espacio con metadata completa.

    Args:
        space_id: ID del espacio de estudio
        skip: Número de registros a saltar
        limit: Número máximo de registros
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Lista de quizzes del espacio con metadata y origen
    """
    from app.repositories.quiz_repository import QuizRepository
    from app.repositories.quiz_attempt_repository import QuizAttemptRepository

    # Verify space ownership
    space = service.get_space(db, space_id, current_user)

    # Get quizzes using repository method
    quizzes = QuizRepository.get_quizzes_by_space(db, space_id, current_user.id, skip, limit)

    # Enrich with metadata
    enriched_quizzes = []
    for quiz in quizzes:
        quiz_dict = {
            "id": quiz.id,
            "user_id": quiz.user_id,
            "study_space_id": quiz.study_space_id,  # NOW: Always present (NOT NULL)
            "source_type": quiz.source_type,  # NEW: 'document' | 'summary' | 'study_space'
            "title": quiz.title,
            "difficulty_level": quiz.difficulty_level,
            "created_at": quiz.created_at,
            "questions": quiz.questions,
            # NEW: Source tracking fields
            "source_document_id": quiz.source_document_id,
            "source_summary_id": quiz.source_summary_id,
            "source_names": quiz.source_names,  # JSONB cache
            "source_metadata": quiz.source_metadata,  # JSONB cache
            # Computed fields
            "study_space_name": space.name,
            "num_questions": len(quiz.questions),
            "num_attempts": QuizAttemptRepository.count_attempts_by_quiz(db, quiz.id, current_user.id)
        }
        enriched_quizzes.append(QuizResponse(**quiz_dict))

    total = QuizRepository.count_quizzes_by_space(db, space_id, current_user.id)
    return QuizListResponse(items=enriched_quizzes, total=total)
