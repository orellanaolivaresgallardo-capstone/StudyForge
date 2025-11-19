# app/schemas/user.py
"""
Schemas para Usuario.
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from uuid import UUID


class UserCreate(BaseModel):
    """Schema para crear un usuario."""
    email: EmailStr = Field(..., description="Email del usuario")
    username: str = Field(..., min_length=3, max_length=100, description="Nombre de usuario")
    password: str = Field(..., min_length=8, max_length=100, description="Contraseña")


class UserLogin(BaseModel):
    """Schema para login de usuario."""
    email: EmailStr = Field(..., description="Email del usuario")
    password: str = Field(..., description="Contraseña")


class UserResponse(BaseModel):
    """Schema para respuesta de usuario."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    username: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UserDetailResponse(UserResponse):
    """Schema para respuesta detallada de usuario con información de cuotas."""
    storage_quota_bytes: int = Field(..., description="Cuota total de almacenamiento")
    storage_used_bytes: int = Field(..., description="Almacenamiento usado")
    max_documents_per_summary: int = Field(..., description="Máximo de documentos por resumen")
    max_file_size_bytes: int = Field(..., description="Tamaño máximo por archivo")

    @property
    def storage_available_bytes(self) -> int:
        """Calcula el espacio disponible."""
        return max(0, self.storage_quota_bytes - self.storage_used_bytes)

    @property
    def storage_usage_percentage(self) -> float:
        """Calcula el porcentaje de uso."""
        if self.storage_quota_bytes == 0:
            return 0.0
        return (self.storage_used_bytes / self.storage_quota_bytes) * 100


class UserQuotaUpdate(BaseModel):
    """Schema para actualizar cuotas de usuario (admin)."""
    storage_quota_bytes: int | None = Field(None, gt=0, description="Nueva cuota de almacenamiento")
    max_documents_per_summary: int | None = Field(None, ge=1, le=10, description="Nuevo máximo de documentos")
    max_file_size_bytes: int | None = Field(None, gt=0, description="Nuevo tamaño máximo de archivo")
