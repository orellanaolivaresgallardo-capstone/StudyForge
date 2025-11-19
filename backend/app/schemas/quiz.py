# app/schemas/quiz.py
"""
Schemas para Cuestionario.
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import List, Optional


class QuestionResponse(BaseModel):
    """Schema para respuesta de pregunta (sin mostrar la respuesta correcta)."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    order: int


class QuestionWithAnswerResponse(BaseModel):
    """Schema para pregunta con respuesta correcta (para resultados)."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: str
    order: int


class QuizCreate(BaseModel):
    """Schema para crear un cuestionario."""
    summary_id: Optional[UUID] = Field(None, description="ID del resumen (opcional)")
    topic: str = Field("general", description="Tema específico o 'general'")
    max_questions: Optional[int] = Field(None, ge=1, le=30, description="Número máximo de preguntas")
    file: Optional[bytes] = Field(None, description="Archivo temporal (si no hay summary_id)")
    file_name: Optional[str] = Field(None, description="Nombre del archivo")
    file_type: Optional[str] = Field(None, description="Tipo de archivo")


class QuizResponse(BaseModel):
    """Schema para respuesta de cuestionario."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    summary_id: Optional[UUID]
    title: str
    topic: str
    difficulty_level: int
    max_questions: int
    created_at: datetime
    questions: List[QuestionResponse]


class QuizListResponse(BaseModel):
    """Schema para lista de cuestionarios."""
    items: List[QuizResponse]
    total: int
