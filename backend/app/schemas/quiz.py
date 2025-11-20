# app/schemas/quiz.py
"""
Schemas para Cuestionario.
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import List, Optional, Dict, Any


class QuestionOptionsData(BaseModel):
    """Schema para las opciones de una pregunta en formato original."""
    correct: str
    semi_correct: str = Field(alias="semi-correct")
    incorrect1: str
    incorrect2: str

    model_config = ConfigDict(populate_by_name=True)


class QuestionData(BaseModel):
    """Schema para una pregunta en formato JSON (almacenado en BD)."""
    question: str
    options: QuestionOptionsData
    explanation: str


class QuestionWithRandomizedOptions(BaseModel):
    """Schema para una pregunta con opciones aleatorizadas (A, B, C, D)."""
    question: str
    options: Dict[str, str] = Field(
        description="Opciones aleatorizadas con keys A, B, C, D"
    )
    explanation: str


class QuizCreate(BaseModel):
    """Schema para crear un cuestionario."""
    summary_id: Optional[UUID] = Field(None, description="ID del resumen (opcional)")
    topic: str = Field("general", description="Tema específico o 'general'")
    max_questions: Optional[int] = Field(None, ge=1, le=30, description="Número de preguntas")
    file: Optional[bytes] = Field(None, description="Archivo temporal (si no hay summary_id)")
    file_name: Optional[str] = Field(None, description="Nombre del archivo")
    file_type: Optional[str] = Field(None, description="Tipo de archivo")


class QuizResponse(BaseModel):
    """Schema para respuesta de cuestionario con preguntas en formato JSON."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    summary_id: Optional[UUID]
    title: str
    topic: str
    difficulty_level: int
    created_at: datetime
    questions: List[Dict[str, Any]] = Field(
        description="Lista de preguntas en formato JSON"
    )


class QuizListResponse(BaseModel):
    """Schema para lista de cuestionarios."""
    items: List[QuizResponse]
    total: int
