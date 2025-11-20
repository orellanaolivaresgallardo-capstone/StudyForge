# app/schemas/__init__.py
"""
Schemas de Pydantic para validación de datos.
"""
from app.schemas.user import UserCreate, UserResponse, UserLogin, UserDetailResponse, UserQuotaUpdate
from app.schemas.auth import Token, TokenPayload
from app.schemas.document import (
    DocumentUpload,
    DocumentResponse,
    DocumentDetailResponse,
    DocumentListResponse,
    DocumentUpdateTitle,
    StorageInfo,
)
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
    QuestionData,
    QuestionWithRandomizedOptions,
)
from app.schemas.quiz_attempt import (
    QuizAttemptCreate,
    QuizAttemptResponse,
    AnswerCreate,
    AnswerFeedback,
    QuizResultResponse,
)

__all__ = [
    "UserCreate",
    "UserResponse",
    "UserLogin",
    "UserDetailResponse",
    "UserQuotaUpdate",
    "Token",
    "TokenPayload",
    "DocumentUpload",
    "DocumentResponse",
    "DocumentDetailResponse",
    "DocumentListResponse",
    "DocumentUpdateTitle",
    "StorageInfo",
    "SummaryCreate",
    "SummaryResponse",
    "SummaryListResponse",
    "ExpertiseLevelEnum",
    "QuizCreate",
    "QuizResponse",
    "QuizListResponse",
    "QuestionData",
    "QuestionWithRandomizedOptions",
    "QuizAttemptCreate",
    "QuizAttemptResponse",
    "AnswerCreate",
    "AnswerFeedback",
    "QuizResultResponse",
]
