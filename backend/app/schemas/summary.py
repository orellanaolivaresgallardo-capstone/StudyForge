# app/schemas/summary.py
"""
Schemas para Resumen.
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import List, Dict, Any, Optional
from enum import Enum


class KeyConceptItem(BaseModel):
    """Schema para un concepto clave con su definición."""
    concept: str = Field(..., min_length=1, max_length=200, description="Nombre del concepto")
    definition: str = Field(..., min_length=1, max_length=500, description="Definición del concepto")


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


class SummaryFromDocumentsRequest(BaseModel):
    """Schema para crear resumen desde un documento existente."""
    document_id: UUID = Field(..., description="ID del documento")
    study_space_id: UUID = Field(..., description="ID del espacio de estudio")
    expertise_level: ExpertiseLevelEnum = Field(..., description="Nivel de expertise del resumen")


class SummaryResponse(BaseModel):
    """Schema para respuesta de resumen."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    document_id: Optional[UUID]  # NOW: Nullable (SET NULL on delete)
    study_space_id: UUID
    title: str
    content: Dict[str, Any]  # Contenido estructurado
    expertise_level: str
    topics: List[str]
    key_concepts: List[KeyConceptItem]

    # Denormalized cache fields
    source_document_title: Optional[str]  # NEW: Renamed from document_title
    source_document_filename: Optional[str]  # NEW: Renamed from document_file_name
    document_state: str

    created_at: datetime
    updated_at: datetime


# Import DocumentResponse after SummaryResponse is defined to avoid any import issues
from app.schemas.document import DocumentResponse  # noqa: E402


class SummaryDetailResponse(SummaryResponse):
    """Schema para detalle de resumen con documento asociado."""
    document: Optional[DocumentResponse] = Field(None, description="Documento fuente asociado al resumen")


class SummaryListResponse(BaseModel):
    """Schema para lista de resúmenes."""
    items: List[SummaryResponse]
    total: int
