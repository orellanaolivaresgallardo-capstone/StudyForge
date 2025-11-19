# app/schemas/document.py
"""
Schemas de Pydantic para documentos.
"""
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class DocumentUpload(BaseModel):
    """Schema para subir un documento."""
    title: str = Field(..., min_length=1, max_length=255, description="Título del documento")


class DocumentResponse(BaseModel):
    """Schema para respuesta de documento (sin contenido binario)."""
    id: UUID
    user_id: UUID
    title: str
    file_name: str
    file_type: str
    file_size_bytes: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentDetailResponse(DocumentResponse):
    """Schema para respuesta detallada de documento (con texto extraído)."""
    extracted_text: str | None = None

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """Schema para lista de documentos."""
    items: list[DocumentResponse]
    total: int
    skip: int
    limit: int


class DocumentUpdateTitle(BaseModel):
    """Schema para actualizar el título de un documento."""
    title: str = Field(..., min_length=1, max_length=255, description="Nuevo título")


class StorageInfo(BaseModel):
    """Schema para información de almacenamiento del usuario."""
    storage_quota_bytes: int = Field(..., description="Cuota total de almacenamiento en bytes")
    storage_used_bytes: int = Field(..., description="Almacenamiento usado en bytes")
    storage_available_bytes: int = Field(..., description="Almacenamiento disponible en bytes")
    storage_usage_percentage: float = Field(..., description="Porcentaje de uso (0-100)")
    total_documents: int = Field(..., description="Número total de documentos")
