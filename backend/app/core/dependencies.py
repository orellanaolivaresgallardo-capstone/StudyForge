# app/core/dependencies.py
"""
Dependencias comunes para FastAPI.
Incluye autenticación y validación de ownership para proteger privacidad.
"""
from typing import Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db import get_db
from app.core.security import decode_access_token
from app.models import User, Document, Summary, Quiz, QuizAttempt

# Esquema de autenticación Bearer
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Obtiene el usuario actual a partir del token JWT.

    Args:
        credentials: Credenciales del header Authorization
        db: Sesión de base de datos

    Returns:
        Usuario autenticado

    Raises:
        HTTPException: Si el token es inválido o el usuario no existe
    """
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token malformado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Buscar usuario en la base de datos
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:  # type: ignore[truthy-bool]
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )

    return user


# ========================================
# FUNCIONES DE VALIDACIÓN DE OWNERSHIP
# Protegen la privacidad asegurando que los usuarios solo accedan a sus propios recursos
# ========================================

def verify_document_ownership(document: Document | None, user: User) -> Document:
    """
    Verifica que el documento pertenezca al usuario autenticado.

    Args:
        document: Documento a verificar
        user: Usuario autenticado

    Returns:
        Document si pertenece al usuario

    Raises:
        HTTPException 403: Si el documento no pertenece al usuario
        HTTPException 404: Si el documento es None
    """
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado"
        )

    if document.user_id != user.id:  # type: ignore[comparison-overlap]
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para acceder a este documento"
        )

    return document


def verify_summary_ownership(summary: Summary | None, user: User) -> Summary:
    """
    Verifica que el resumen pertenezca al usuario autenticado.

    Args:
        summary: Resumen a verificar
        user: Usuario autenticado

    Returns:
        Summary si pertenece al usuario

    Raises:
        HTTPException 403: Si el resumen no pertenece al usuario
        HTTPException 404: Si el resumen es None
    """
    if summary is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resumen no encontrado"
        )

    if summary.user_id != user.id:  # type: ignore[comparison-overlap]
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para acceder a este resumen"
        )

    return summary


def verify_quiz_ownership(quiz: Quiz | None, user: User) -> Quiz:
    """
    Verifica que el quiz pertenezca al usuario autenticado.

    Args:
        quiz: Quiz a verificar
        user: Usuario autenticado

    Returns:
        Quiz si pertenece al usuario

    Raises:
        HTTPException 403: Si el quiz no pertenece al usuario
        HTTPException 404: Si el quiz es None
    """
    if quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz no encontrado"
        )

    if quiz.user_id != user.id:  # type: ignore[comparison-overlap]
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para acceder a este quiz"
        )

    return quiz


def verify_quiz_attempt_ownership(attempt: QuizAttempt | None, user: User) -> QuizAttempt:
    """
    Verifica que el intento de quiz pertenezca al usuario autenticado.

    Args:
        attempt: Intento de quiz a verificar
        user: Usuario autenticado

    Returns:
        QuizAttempt si pertenece al usuario

    Raises:
        HTTPException 403: Si el intento no pertenece al usuario
        HTTPException 404: Si el intento es None
    """
    if attempt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intento de quiz no encontrado"
        )

    if attempt.user_id != user.id:  # type: ignore[comparison-overlap]
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para acceder a este intento de quiz"
        )

    return attempt
