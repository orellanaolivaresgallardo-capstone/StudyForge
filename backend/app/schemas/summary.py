# app/schemas/summary.py
"""
Schemas para Resumen.
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import List, Dict, Any
from enum import Enum


class ExpertiseLevelEnum(str, Enum):
    """Niveles de expertise."""
    BASICO = "basico"
    MEDIO = "medio"
    AVANZADO = "avanzado"


class SummaryCreate(BaseModel):
    """Schema para crear un resumen (desde upload de archivo)."""
    file: bytes = Field(..., description="Contenido del archivo")
    file_name: str = Field(..., description="Nombre del archivo")
    file_type: str = Field(..., description="Tipo de archivo (pdf, pptx, docx, txt)")
    expertise_level: ExpertiseLevelEnum = Field(..., description="Nivel de expertise del resumen")


class SummaryResponse(BaseModel):
    """Schema para respuesta de resumen."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    content: Dict[str, Any]  # Contenido estructurado
    expertise_level: str
    topics: List[str]
    key_concepts: List[str]
    original_file_name: str
    original_file_type: str
    created_at: datetime
    updated_at: datetime


class SummaryListResponse(BaseModel):
    """Schema para lista de resúmenes."""
    items: List[SummaryResponse]
    total: int
