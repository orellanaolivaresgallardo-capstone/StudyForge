# app/routers/__init__.py
"""
Routers - Endpoints de la API.
"""
from app.routers import auth, summaries, quizzes, quiz_attempts, stats

__all__ = [
    "auth",
    "summaries",
    "quizzes",
    "quiz_attempts",
    "stats",
]
