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
    max_questions: Optional[int] = Field(None, ge=5, le=30, description="Número de preguntas (5-30)")
    file: Optional[bytes] = Field(None, description="Archivo temporal (si no hay summary_id)")
    file_name: Optional[str] = Field(None, description="Nombre del archivo")
    file_type: Optional[str] = Field(None, description="Tipo de archivo")


class QuizCreateFromSpace(BaseModel):
    """Schema para crear un cuestionario desde un espacio de estudio."""
    max_questions: Optional[int] = Field(None, ge=5, le=30, description="Número de preguntas (5-30)")


class QuizResponse(BaseModel):
    """Schema para respuesta de cuestionario con preguntas en formato JSON."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    study_space_id: UUID  # NOW: Required (NOT NULL, CASCADE)
    source_type: str  # NEW: 'document' | 'summary' | 'study_space'
    title: str
    difficulty_level: int
    created_at: datetime
    questions: List[Dict[str, Any]] = Field(
        description="Lista de preguntas en formato JSON"
    )

    # NEW: Source tracking fields (nullable, SET NULL on delete)
    source_document_id: Optional[UUID] = None
    source_summary_id: Optional[UUID] = None

    # NEW: Denormalized cache fields (JSONB)
    source_names: Optional[Dict[str, Any]] = None  # {"document": "...", "summary": "...", etc}
    source_metadata: Optional[Dict[str, Any]] = None  # Additional metadata

    # Campos calculados en el router (no vienen del modelo)
    study_space_name: Optional[str] = None
    num_questions: int  # Cantidad de preguntas
    num_attempts: int  # Cantidad de intentos del usuario en este quiz


class QuizListResponse(BaseModel):
    """Schema para lista de cuestionarios."""
    items: List[QuizResponse]
    total: int
