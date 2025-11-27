# app/schemas/study_space.py
"""
Schemas para espacios de estudio.
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import List, Optional, Any


class StudySpaceCreate(BaseModel):
    """Schema para crear un espacio de estudio."""
    name: str = Field(..., min_length=1, max_length=255, description="Nombre del espacio")
    description: Optional[str] = Field(None, max_length=1000, description="Descripción del espacio")
    color: str = Field(default="#8B5CF6", pattern="^#[0-9A-Fa-f]{6}$", description="Color en formato hex")


class StudySpaceUpdate(BaseModel):
    """Schema para actualizar un espacio de estudio."""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Nombre del espacio")
    description: Optional[str] = Field(None, max_length=1000, description="Descripción del espacio")
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$", description="Color en formato hex")


class StudySpaceResponse(BaseModel):
    """Schema para respuesta de espacio de estudio."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    name: str
    description: Optional[str]
    color: str
    created_at: datetime
    updated_at: datetime


class StudySpaceDetailResponse(StudySpaceResponse):
    """Schema para detalle de espacio con recursos."""
    summaries: List[Any] = Field(default_factory=list, description="Resúmenes en el espacio")
    documents: List[Any] = Field(default_factory=list, description="Documentos en el espacio")


class StudySpaceListResponse(BaseModel):
    """Schema para lista de espacios."""
    items: List[StudySpaceResponse]
    total: int


class StudySpaceWithStatsResponse(StudySpaceResponse):
    """Schema para espacio con estadísticas resumidas."""
    num_documents: int = 0
    num_summaries: int = 0
    num_quizzes: int = 0
    avg_score: float = 0.0


class StudySpaceListWithStatsResponse(BaseModel):
    """Schema para lista con estadísticas."""
    items: List[StudySpaceWithStatsResponse]
    total: int


class AddResourceRequest(BaseModel):
    """Schema para agregar recurso a espacio."""
    resource_id: UUID = Field(..., description="ID del recurso a agregar")


class DeleteSpaceRequest(BaseModel):
    """Schema para eliminar espacio con confirmación de contraseña."""
    password: str = Field(..., min_length=1, description="Contraseña del usuario para confirmar eliminación")


class StudySpaceStatsResponse(BaseModel):
    """Schema para estadísticas del espacio."""
    space_id: str
    space_name: str
    num_documents: int
    num_summaries: int
    num_quizzes: int
    total_attempts: int
    avg_score: float
    best_score: float
