# app/schemas/quiz_attempt.py
"""
Schemas para Intento de Cuestionario y Respuestas.
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import List, Optional, Dict, Any


class QuizAttemptCreate(BaseModel):
    """Schema para iniciar un intento de cuestionario."""
    quiz_id: UUID = Field(..., description="ID del cuestionario")


class AnswerCreate(BaseModel):
    """Schema para responder una pregunta."""
    question_index: int = Field(..., ge=0, description="Índice de la pregunta (0-based)")
    selected_option: str = Field(..., pattern="^[ABCD]$", description="Opción seleccionada (A, B, C o D)")


class AnswerFeedback(BaseModel):
    """Schema para feedback inmediato de una respuesta."""
    is_correct: bool
    correct_option: str
    explanation: str
    selected_option: str
    score_so_far: Optional[float] = Field(None, description="Puntaje acumulado hasta el momento")


class QuizSnapshotData(BaseModel):
    """Schema para snapshot de quiz."""
    id: str = Field(..., description="UUID del quiz")
    title: str = Field(..., description="Título del quiz")
    difficulty_level: int = Field(..., description="Nivel de dificultad")


class StudySpaceSnapshotData(BaseModel):
    """Schema para snapshot de espacio de estudio."""
    id: str = Field(..., description="UUID del espacio")
    name: str = Field(..., description="Nombre del espacio")
    color: str = Field(..., description="Color del espacio en formato hex")


class QuizAttemptResponse(BaseModel):
    """Schema para respuesta de intento de cuestionario con respuestas en JSON."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    quiz_id: UUID
    user_id: UUID
    started_at: datetime
    completed_at: Optional[datetime]
    score: Optional[float]
    correct_answers: List[str] = Field(
        default_factory=list,
        description="Array de respuestas correctas: ['A', 'B', 'C', ...]"
    )
    user_answers: List[str] = Field(
        default_factory=list,
        description="Array de respuestas del usuario: ['A', 'C', 'B', ...]"
    )
    quiz_snapshot: Optional[QuizSnapshotData] = Field(
        None,
        description="Snapshot del quiz (preservado incluso si el quiz es eliminado)"
    )
    study_space_snapshot: Optional[StudySpaceSnapshotData] = Field(
        None,
        description="Snapshot del espacio de estudio (preservado incluso si el espacio es eliminado)"
    )


class QuizAttemptWithQuestionsResponse(QuizAttemptResponse):
    """Schema que incluye las preguntas aleatorizadas para el frontend."""
    randomized_questions: List[Dict[str, Any]] = Field(
        description="Preguntas con opciones aleatorizadas {'A': '...', 'B': '...', etc}"
    )


class QuestionResultDetail(BaseModel):
    """Detalle de una pregunta con la respuesta del usuario."""
    question_text: str
    options: Dict[str, str] = Field(
        description="Opciones aleatorizadas {'A': '...', 'B': '...', 'C': '...', 'D': '...'}"
    )
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
    study_space_snapshot: Optional[StudySpaceSnapshotData] = Field(
        None,
        description="Snapshot del espacio de estudio (para navegación)"
    )
