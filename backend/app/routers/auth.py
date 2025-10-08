# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db import get_db
from app.repositories.models import User
from app.core.security import hash_password, verify_password, create_access_token
from app.core.deps import get_current_user
from app.schemas.users import UserCreate, UserOut
from app.schemas.auth_schemas import TokenOut  # ← nuevo

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED, summary="Crear usuario")
def signup(data: UserCreate, db: Session = Depends(get_db)):
    email_l = data.email.lower()
    exists = db.query(User).filter(func.lower(User.email) == email_l).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="email ya registrado")
    user = User(email=email_l, password_hash=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

class LoginIn(UserCreate):
    pass

@router.post("/login", response_model=TokenOut, summary="Iniciar sesión y obtener JWT")
def login(data: LoginIn, db: Session = Depends(get_db)):
    email_l = data.email.lower()
    user = db.query(User).filter(func.lower(User.email) == email_l).first()
    if not user or not verify_password(user.password_hash, data.password):
        # Header estándar para compatibilidad OAuth2/Bearer
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="credenciales inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(sub=user.id)
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut, summary="Datos del usuario autenticado")
def me(current: User = Depends(get_current_user)):
    return current
