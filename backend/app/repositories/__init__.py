# app/repositories/__init__.py
"""
Repositories - Capa de acceso a datos.
"""
from app.repositories.user_repository import UserRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.summary_repository import SummaryRepository
from app.repositories.quiz_repository import QuizRepository
from app.repositories.quiz_attempt_repository import QuizAttemptRepository

__all__ = [
    "UserRepository",
    "DocumentRepository",
    "SummaryRepository",
    "QuizRepository",
    "QuizAttemptRepository",
]
