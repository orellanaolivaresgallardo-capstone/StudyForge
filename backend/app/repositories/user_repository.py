# app/repositories/user_repository.py
"""
Repository para operaciones de base de datos relacionadas con usuarios.
"""
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User


class UserRepository:
    """Repository para gestionar usuarios en la base de datos."""

    @staticmethod
    def create(db: Session, email: str, username: str, hashed_password: str) -> User:
        """
        Crea un nuevo usuario en la base de datos.

        Args:
            db: Sesión de base de datos
            email: Email del usuario
            username: Nombre de usuario
            hashed_password: Contraseña hasheada

        Returns:
            Usuario creado
        """
        user = User(
            email=email,
            username=username,
            hashed_password=hashed_password,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_by_id(db: Session, user_id: str) -> Optional[User]:
        """
        Obtiene un usuario por su ID.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario (UUID)

        Returns:
            Usuario si existe, None en caso contrario
        """
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        """
        Obtiene un usuario por su email.

        Args:
            db: Sesión de base de datos
            email: Email del usuario

        Returns:
            Usuario si existe, None en caso contrario
        """
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        """
        Obtiene un usuario por su nombre de usuario.

        Args:
            db: Sesión de base de datos
            username: Nombre de usuario

        Returns:
            Usuario si existe, None en caso contrario
        """
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def update(db: Session, user: User) -> User:
        """
        Actualiza un usuario en la base de datos.

        Args:
            db: Sesión de base de datos
            user: Usuario a actualizar

        Returns:
            Usuario actualizado
        """
        db.commit()
        db.refresh(user)
        return user
