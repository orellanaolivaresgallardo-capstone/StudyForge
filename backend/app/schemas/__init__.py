# app/schemas/__init__.py
"""
Schemas de Pydantic para validación de datos.
"""
from app.schemas.user import UserCreate, UserResponse, UserLogin
from app.schemas.auth import Token, TokenPayload
from app.schemas.summary import (
    SummaryCreate,
    SummaryResponse,
    SummaryListResponse,
    ExpertiseLevelEnum,
)
from app.schemas.quiz import (
    QuizCreate,
    QuizResponse,
    QuizListResponse,
    QuestionResponse,
)
from app.schemas.quiz_attempt import (
    QuizAttemptCreate,
    QuizAttemptResponse,
    AnswerCreate,
    AnswerResponse,
    QuizResultResponse,
)

__all__ = [
    "UserCreate",
    "UserResponse",
    "UserLogin",
    "Token",
    "TokenPayload",
    "SummaryCreate",
    "SummaryResponse",
    "SummaryListResponse",
    "ExpertiseLevelEnum",
    "QuizCreate",
    "QuizResponse",
    "QuizListResponse",
    "QuestionResponse",
    "QuizAttemptCreate",
    "QuizAttemptResponse",
    "AnswerCreate",
    "AnswerResponse",
    "QuizResultResponse",
]
