# app/schemas/quiz_attempt.py
"""
Schemas para Intento de Cuestionario y Respuestas.
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import List, Optional


class QuizAttemptCreate(BaseModel):
    """Schema para iniciar un intento de cuestionario."""
    quiz_id: UUID = Field(..., description="ID del cuestionario")


class AnswerCreate(BaseModel):
    """Schema para responder una pregunta."""
    question_id: UUID = Field(..., description="ID de la pregunta")
    selected_option: str = Field(..., pattern="^[ABCD]$", description="Opción seleccionada (A, B, C o D)")


class AnswerResponse(BaseModel):
    """Schema para respuesta de una pregunta."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    question_id: UUID
    selected_option: str
    is_correct: bool
    answered_at: datetime


class AnswerFeedback(BaseModel):
    """Schema para feedback inmediato de una respuesta."""
    is_correct: bool
    correct_option: str
    explanation: str
    selected_option: str


class QuizAttemptResponse(BaseModel):
    """Schema para respuesta de intento de cuestionario."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    quiz_id: UUID
    user_id: UUID
    started_at: datetime
    completed_at: Optional[datetime]
    score: Optional[float]


class QuestionResultDetail(BaseModel):
    """Detalle de una pregunta con la respuesta del usuario."""
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    selected_option: str
    is_correct: bool
    explanation: str


class QuizResultResponse(BaseModel):
    """Schema para resultados completos de un cuestionario."""
    attempt_id: UUID
    quiz_id: UUID
    score: float
    total_questions: int
    correct_answers: int
    incorrect_answers: int
    completed_at: datetime
    questions: List[QuestionResultDetail]
