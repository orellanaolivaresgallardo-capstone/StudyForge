# app/routers/stats.py
"""
Router de estadísticas - Progreso y desempeño del usuario.
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.quiz import Quiz
from app.models.quiz_attempt import QuizAttempt
from app.models.study_space import StudySpace
from app.schemas.study_space import StudySpaceStatsResponse

router = APIRouter()


@router.get("/performance")
def get_user_performance(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Obtiene el historial de desempeño del usuario.

    Args:
        limit: Número de intentos recientes a retornar
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Historial de intentos recientes
    """
    # Obtener intentos recientes con información del quiz
    recent_attempts = (
        db.query(QuizAttempt, Quiz.title, Quiz.difficulty_level, Quiz.study_space_id)
        .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
        .filter(
            QuizAttempt.user_id == current_user.id,
            QuizAttempt.completed_at.isnot(None),
        )
        .order_by(QuizAttempt.completed_at.desc())
        .limit(limit)
        .all()
    )

    # Formatear resultados
    performance_history = []
    for attempt, quiz_title, difficulty_level, study_space_id in recent_attempts:
        performance_history.append({
            "attempt_id": str(attempt.id),
            "quiz_id": str(attempt.quiz_id),
            "quiz_title": quiz_title,
            "difficulty_level": difficulty_level,
            "score": round(attempt.score, 2) if attempt.score else 0,
            "completed_at": attempt.completed_at.isoformat(),
            "study_space_id": str(study_space_id) if study_space_id else None,
        })

    return {
        "recent_attempts": performance_history,
    }


@router.get("/summary")
def get_user_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Obtiene un resumen completo de estadísticas del usuario.

    Args:
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Resumen de estadísticas generales
    """
    # Total de resúmenes creados
    from app.models.summary import Summary
    total_summaries = db.query(Summary).filter(
        Summary.user_id == current_user.id
    ).count()

    # Total de cuestionarios generados
    total_quizzes = db.query(Quiz).filter(
        Quiz.user_id == current_user.id
    ).count()

    # Total de intentos completados
    total_completed_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.completed_at.isnot(None),
    ).count()

    # Promedio general de score
    avg_score = db.query(func.avg(QuizAttempt.score)).filter(
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.completed_at.isnot(None),
    ).scalar()

    # Mejor score
    best_score = db.query(func.max(QuizAttempt.score)).filter(
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.completed_at.isnot(None),
    ).scalar()

    # Total de espacios de estudio creados por el usuario
    unique_spaces = db.query(StudySpace).filter(
        StudySpace.user_id == current_user.id
    ).count()

    return {
        "total_summaries": total_summaries,
        "total_quizzes": total_quizzes,
        "total_completed_attempts": total_completed_attempts,
        "avg_score": round(avg_score, 2) if avg_score else 0,
        "best_score": round(best_score, 2) if best_score else 0,
        "unique_spaces_studied": unique_spaces or 0,
    }


@router.get("/progress-by-space", response_model=List[StudySpaceStatsResponse])
def get_progress_by_space(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[StudySpaceStatsResponse]:
    """
    Obtiene estadísticas de progreso segregadas por espacio de estudio.

    Incluye una entrada "Global" para quizzes que no pertenecen a ningún espacio.

    Args:
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Lista de estadísticas por espacio
    """
    results = []

    # 1. Estadísticas por cada espacio del usuario
    from sqlalchemy import select
    from sqlalchemy.orm import joinedload

    stmt = (
        select(StudySpace)
        .options(joinedload(StudySpace.documents), joinedload(StudySpace.summaries))
        .where(StudySpace.user_id == current_user.id)
    )
    # NOTE: .unique() is required when using joinedload() with collections
    user_spaces = list(db.execute(stmt).unique().scalars().all())

    for space in user_spaces:
        # Contar recursos
        num_documents = len(space.documents)
        num_summaries = len(space.summaries)

        # Obtener quizzes del espacio
        quizzes_in_space = db.query(Quiz).filter(Quiz.study_space_id == space.id).all()
        quiz_ids = [q.id for q in quizzes_in_space]

        # Obtener attempts completados para quizzes del espacio
        if quiz_ids:
            attempts = db.query(QuizAttempt).filter(
                QuizAttempt.quiz_id.in_(quiz_ids),
                QuizAttempt.user_id == current_user.id,
                QuizAttempt.completed_at.isnot(None)
            ).all()

            total_attempts = len(attempts)
            avg_score = (
                sum(a.score for a in attempts if a.score) / total_attempts
                if total_attempts > 0
                else 0
            )
            best_score = max((a.score for a in attempts if a.score), default=0)
        else:
            total_attempts = 0
            avg_score = 0
            best_score = 0

        results.append(StudySpaceStatsResponse(
            space_id=str(space.id),
            space_name=space.name,
            num_documents=num_documents,
            num_summaries=num_summaries,
            num_quizzes=len(quizzes_in_space),
            total_attempts=total_attempts,
            avg_score=round(avg_score, 2),
            best_score=round(best_score, 2),
        ))

    # 2. Estadísticas "Global" para quizzes sin espacio
    global_quizzes = db.query(Quiz).filter(
        Quiz.user_id == current_user.id,
        Quiz.study_space_id.is_(None)
    ).all()
    global_quiz_ids = [q.id for q in global_quizzes]

    if global_quiz_ids:
        global_attempts = db.query(QuizAttempt).filter(
            QuizAttempt.quiz_id.in_(global_quiz_ids),
            QuizAttempt.user_id == current_user.id,
            QuizAttempt.completed_at.isnot(None)
        ).all()

        global_total_attempts = len(global_attempts)
        global_avg_score = (
            sum(a.score for a in global_attempts if a.score) / global_total_attempts
            if global_total_attempts > 0
            else 0
        )
        global_best_score = max((a.score for a in global_attempts if a.score), default=0)
    else:
        global_total_attempts = 0
        global_avg_score = 0
        global_best_score = 0

    # Agregar entrada "Global" al principio si hay quizzes sin espacio
    if len(global_quizzes) > 0 or global_total_attempts > 0:
        results.insert(0, StudySpaceStatsResponse(
            space_id="global",
            space_name="Global",
            num_documents=0,
            num_summaries=0,
            num_quizzes=len(global_quizzes),
            total_attempts=global_total_attempts,
            avg_score=round(global_avg_score, 2),
            best_score=round(global_best_score, 2),
        ))

    return results
