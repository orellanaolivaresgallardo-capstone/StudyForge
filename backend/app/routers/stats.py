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

router = APIRouter()


@router.get("/progress")
def get_user_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Obtiene estadísticas de progreso del usuario por tema.

    Args:
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Diccionario con progreso por tema
    """
    # Obtener estadísticas por tema
    stats_by_topic = (
        db.query(
            Quiz.topic,
            func.count(QuizAttempt.id).label("total_attempts"),
            func.avg(QuizAttempt.score).label("avg_score"),
            func.max(QuizAttempt.score).label("max_score"),
            func.min(QuizAttempt.score).label("min_score"),
        )
        .join(QuizAttempt, Quiz.id == QuizAttempt.quiz_id)
        .filter(
            QuizAttempt.user_id == current_user.id,
            QuizAttempt.completed_at.isnot(None),
        )
        .group_by(Quiz.topic)
        .all()
    )

    # Formatear resultados
    progress_by_topic = []
    for stat in stats_by_topic:
        progress_by_topic.append({
            "topic": stat.topic,
            "total_attempts": stat.total_attempts,
            "avg_score": round(stat.avg_score, 2) if stat.avg_score else 0,
            "max_score": round(stat.max_score, 2) if stat.max_score else 0,
            "min_score": round(stat.min_score, 2) if stat.min_score else 0,
        })

    # Estadísticas generales
    total_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.completed_at.isnot(None),
    ).count()

    avg_score_overall = db.query(func.avg(QuizAttempt.score)).filter(
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.completed_at.isnot(None),
    ).scalar()

    return {
        "total_attempts": total_attempts,
        "avg_score_overall": round(avg_score_overall, 2) if avg_score_overall else 0,
        "progress_by_topic": progress_by_topic,
    }


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
        db.query(QuizAttempt, Quiz.title, Quiz.topic, Quiz.difficulty_level)
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
    for attempt, quiz_title, quiz_topic, difficulty_level in recent_attempts:
        performance_history.append({
            "attempt_id": str(attempt.id),
            "quiz_id": str(attempt.quiz_id),
            "quiz_title": quiz_title,
            "topic": quiz_topic,
            "difficulty_level": difficulty_level,
            "score": round(attempt.score, 2) if attempt.score else 0,
            "completed_at": attempt.completed_at.isoformat(),
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

    # Temas únicos estudiados
    unique_topics = db.query(func.count(func.distinct(Quiz.topic))).join(
        QuizAttempt, Quiz.id == QuizAttempt.quiz_id
    ).filter(
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.completed_at.isnot(None),
    ).scalar()

    return {
        "total_summaries": total_summaries,
        "total_quizzes": total_quizzes,
        "total_completed_attempts": total_completed_attempts,
        "avg_score": round(avg_score, 2) if avg_score else 0,
        "best_score": round(best_score, 2) if best_score else 0,
        "unique_topics_studied": unique_topics or 0,
    }
