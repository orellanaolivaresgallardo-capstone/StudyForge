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
