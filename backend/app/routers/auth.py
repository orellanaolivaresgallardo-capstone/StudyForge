# app/routers/auth.py
"""
Router de autenticación - Registro, login y usuario actual.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.core.dependencies import get_current_user
from app.services.auth_service import AuthService
from app.schemas.user import UserCreate, UserLogin, UserResponse
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
    user = AuthService.register(
        db=db,
        email=user_data.email,
        username=user_data.username,
        password=user_data.password,
    )
    return user


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
    access_token = AuthService.login(
        db=db,
        email=credentials.email,
        password=credentials.password,
    )
    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Obtiene la información del usuario autenticado.

    Args:
        current_user: Usuario autenticado (inyectado por dependencia)

    Returns:
        Información del usuario
    """
    return current_user
