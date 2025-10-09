# app/core/security.py
from datetime import datetime, timedelta, timezone
import os
from typing import Optional

import jwt  # PyJWT
from argon2 import PasswordHasher
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db import get_db
from app.repositories.models import User

# =========================
# Configuración
# =========================
JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALG: str = os.getenv("JWT_ALG", "HS256")
JWT_EXPIRE_MIN: int = int(os.getenv("JWT_EXPIRE_MIN", "60"))

# Hasher Argon2
_hasher = PasswordHasher()

# Portador (Authorization: Bearer <token>)
_bearer = HTTPBearer(auto_error=False)


# =========================
# Utilidades de password
# =========================
def hash_password(plain: str) -> str:
    """Devuelve hash Argon2 del password plano."""
    return _hasher.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Verifica password plano contra hash Argon2."""
    try:
        _hasher.verify(hashed, plain)
        return True
    except Exception:
        return False


# =========================
# Utilidades de JWT
# =========================
def create_access_token(user_id: int, expires_minutes: Optional[int] = None) -> str:
    """Crea un JWT HS256 con sub=user_id y expiración."""
    minutes = expires_minutes if expires_minutes is not None else JWT_EXPIRE_MIN
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=minutes)).timestamp()),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)
    return token


def decode_access_token(token: str) -> dict:
    """Decodifica y valida un JWT. Lanza si no es válido."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="token inválido")


# =========================
# Dependencia get_current_user
# =========================
def _extract_token(credentials: Optional[HTTPAuthorizationCredentials]) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        # Mensaje alineado con lo que vimos en /documents cuando faltaba token
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="token faltante")
    return credentials.credentials


def _get_user_or_401(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="usuario no encontrado")
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    """
    Lee 'Authorization: Bearer <token>', valida JWT y devuelve el User ORM.
    Lanza 401 si falta token, si es inválido o si el usuario no existe.
    """
    token = _extract_token(credentials)
    payload = decode_access_token(token)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="token inválido (sin sub)")

    try:
        user_id = int(sub)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="token inválido (sub no numérico)")

    return _get_user_or_401(db, user_id)
