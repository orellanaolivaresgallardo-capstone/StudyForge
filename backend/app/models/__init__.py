# app/models/__init__.py
"""
Modelos de base de datos (SQLAlchemy ORM).
"""
from app.models.user import User
from app.models.summary import Summary
from app.models.quiz import Quiz
from app.models.question import Question
from app.models.quiz_attempt import QuizAttempt
from app.models.answer import Answer

__all__ = [
    "User",
    "Summary",
    "Quiz",
    "Question",
    "QuizAttempt",
    "Answer",
]
