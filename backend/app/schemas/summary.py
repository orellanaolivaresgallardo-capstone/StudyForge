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
    document_ids: List[UUID] = Field(..., min_length=1, max_length=1, description="ID del documento (debe ser exactamente 1)")
    expertise_level: ExpertiseLevelEnum = Field(..., description="Nivel de expertise del resumen")


class DeletedDocumentInfo(BaseModel):
    """Schema para información de documento eliminado."""
    id: str = Field(..., description="UUID del documento eliminado")
    title: str = Field(..., description="Título del documento")
    file_name: str = Field(..., description="Nombre del archivo")


class SummaryResponse(BaseModel):
    """Schema para respuesta de resumen."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    content: Dict[str, Any]  # Contenido estructurado
    expertise_level: str
    topics: List[str]
    key_concepts: List[KeyConceptItem]
    deleted_documents_info: Optional[List[DeletedDocumentInfo]] = Field(
        None,
        description="Info de documentos eliminados que fueron fuente de este resumen"
    )
    created_at: datetime
    updated_at: datetime
    study_space_names: List[str] = Field(default_factory=list, description="Nombres de espacios a los que pertenece")


# Import DocumentResponse after SummaryResponse is defined to avoid any import issues
from app.schemas.document import DocumentResponse  # noqa: E402


class SummaryDetailResponse(SummaryResponse):
    """Schema para detalle de resumen con documentos asociados."""
    documents: List[DocumentResponse] = Field(default_factory=list, description="Documentos fuente asociados al resumen")


class SummaryListResponse(BaseModel):
    """Schema para lista de resúmenes."""
    items: List[SummaryResponse]
    total: int
