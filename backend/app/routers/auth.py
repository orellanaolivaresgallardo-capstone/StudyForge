# app/routers/auth.py
"""
Router de autenticación - Registro, login y usuario actual.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.core.dependencies import get_current_user
from app.core.logging import log_audit_event
from app.services.auth_service import AuthService
from app.schemas.user import UserCreate, UserLogin, UserResponse, UserDetailResponse
from app.schemas.auth import Token
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario en el sistema.

    Args:
        user_data: Datos del usuario a registrar
        db: Sesión de base de datos

    Returns:
        Usuario creado

    Raises:
        HTTPException: Si el email o username ya existen
    """
    try:
        user = AuthService.register(
            db=db,
            email=user_data.email,
            username=user_data.username,
            password=user_data.password,
        )

        # Audit log: successful registration
        log_audit_event(
            event="user_registration",
            user_id=str(user.id),
            action="register",
            result="success",
            extra={"email": user.email, "username": user.username}
        )

        return user
    except HTTPException as e:
        # Audit log: failed registration
        log_audit_event(
            event="user_registration",
            action="register",
            result="failure",
            extra={"email": user_data.email, "error": e.detail}
        )
        raise


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Autentica un usuario y retorna un token JWT.

    Args:
        credentials: Credenciales del usuario
        db: Sesión de base de datos

    Returns:
        Token de acceso JWT

    Raises:
        HTTPException: Si las credenciales son inválidas
    """
    try:
        access_token = AuthService.login(
            db=db,
            email=credentials.email,
            password=credentials.password,
        )

        # Audit log: successful login
        log_audit_event(
            event="login_attempt",
            action="login",
            result="success",
            extra={"email": credentials.email}
        )

        return Token(access_token=access_token)
    except HTTPException as e:
        # Audit log: failed login
        log_audit_event(
            event="login_attempt",
            action="login",
            result="failure",
            extra={"email": credentials.email, "error": e.detail}
        )
        raise


@router.get("/me", response_model=UserDetailResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Obtiene la información del usuario autenticado incluyendo cuotas.

    Args:
        current_user: Usuario autenticado (inyectado por dependencia)

    Returns:
        Información detallada del usuario con cuotas de almacenamiento
    """
    return current_user
