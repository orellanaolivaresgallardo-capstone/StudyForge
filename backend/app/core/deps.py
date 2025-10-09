# app/core/deps.py
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db import get_db
from app.repositories.models import User
from app.core.security import decode_access_token  # en security se llama así

# Alias para compatibilidad con imports existentes (documentos, etc.)
def decode_token(token: str) -> dict:
    return decode_access_token(token)

_bearer = HTTPBearer(auto_error=False)


def _extract_token(credentials: Optional[HTTPAuthorizationCredentials]) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
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
    payload = decode_token(token)  # usa el alias hacia decode_access_token
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="token inválido (sin sub)")

    try:
        user_id = int(sub)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="token inválido (sub no numérico)")

    return _get_user_or_401(db, user_id)
