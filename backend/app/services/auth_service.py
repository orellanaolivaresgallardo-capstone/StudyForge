# app/services/auth_service.py
"""
Service de autenticación de usuarios.
"""
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User


class AuthService:
    """Service para manejar autenticación y registro de usuarios."""

    @staticmethod
    def register(db: Session, email: str, username: str, password: str) -> User:
        """
        Registra un nuevo usuario en el sistema.

        Args:
            db: Sesión de base de datos
            email: Email del usuario
            username: Nombre de usuario
            password: Contraseña en texto plano

        Returns:
            Usuario creado

        Raises:
            HTTPException: Si el email o username ya existen
        """
        # Verificar si el email ya existe
        existing_user = UserRepository.get_by_email(db, email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado"
            )

        # Verificar si el username ya existe
        existing_user = UserRepository.get_by_username(db, username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está en uso"
            )

        # Hashear contraseña y crear usuario
        hashed_password = hash_password(password)
        user = UserRepository.create(db, email, username, hashed_password)

        return user

    @staticmethod
    def login(db: Session, email: str, password: str) -> str:
        """
        Autentica un usuario y genera un token JWT.

        Args:
            db: Sesión de base de datos
            email: Email del usuario
            password: Contraseña en texto plano

        Returns:
            Token JWT de acceso

        Raises:
            HTTPException: Si las credenciales son inválidas
        """
        # Buscar usuario por email
        user = UserRepository.get_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Verificar contraseña
        if not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Verificar que el usuario esté activo
        if not user.is_active:  # type: ignore[truthy-bool]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo"
            )

        # Generar token JWT
        access_token = create_access_token(data={"sub": str(user.id)})

        return access_token

    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
        """
        Obtiene un usuario por su ID.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario

        Returns:
            Usuario si existe, None en caso contrario
        """
        return UserRepository.get_by_id(db, user_id)
