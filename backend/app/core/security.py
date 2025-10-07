# app/core/security.py
import os
import datetime as dt
from typing import Any, Dict, Optional

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from jose import jwt, JWTError

# === Config desde entorno ===
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")
JWT_ALG = os.getenv("JWT_ALG", "HS256")
JWT_EXPIRES_MIN = int(os.getenv("JWT_EXPIRES_MIN", "60"))

# === Hasher Argon2 (parámetros por defecto seguros) ===
ph = PasswordHasher()  # puedes tunearlo luego (time_cost, memory_cost, parallelism)

# -------- Password hashing --------
def hash_password(plain: str) -> str:
    """Devuelve el hash Argon2 de 'plain'."""
    return ph.hash(plain)

def verify_password(hashed: str, plain: str) -> bool:
    """True si 'plain' corresponde al hash Argon2 'hashed'."""
    try:
        return ph.verify(hashed, plain)
    except VerifyMismatchError:
        return False
    except Exception:
        # Cualquier otro error (hash corrupto, formato inválido, etc.)
        return False

# -------- JWT --------
def create_access_token(sub: str | int, extra: Optional[Dict[str, Any]] = None) -> str:
    """Crea un JWT firmado (HS256) con expiración y subject 'sub'."""
    now = dt.datetime.utcnow()
    exp = now + dt.timedelta(minutes=JWT_EXPIRES_MIN)
    payload: Dict[str, Any] = {"sub": str(sub), "iat": now, "exp": exp}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodifica y valida el JWT. Devuelve el payload o None si inválido/expirado."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except JWTError:
        return None
