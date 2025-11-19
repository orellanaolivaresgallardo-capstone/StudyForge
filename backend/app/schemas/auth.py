# app/schemas/auth.py
"""
Schemas para autenticación.
"""
from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    """Schema para token de acceso."""
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Schema para payload del token."""
    sub: Optional[str] = None
    exp: Optional[int] = None
