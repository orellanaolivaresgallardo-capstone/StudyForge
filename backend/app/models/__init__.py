# app/models/__init__.py
"""
Modelos de base de datos (SQLAlchemy ORM).
"""
from app.models.user import User
from app.models.document import Document
from app.models.summary import Summary, ExpertiseLevel
from app.models.quiz import Quiz
from app.models.quiz_attempt import QuizAttempt
from app.models.summary_document import summary_documents

__all__ = [
    "User",
    "Document",
    "Summary",
    "ExpertiseLevel",
    "Quiz",
    "QuizAttempt",
    "summary_documents",
]
