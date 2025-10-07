# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db import get_db
from app.repositories.models import User
from app.core.security import hash_password, verify_password, create_access_token
from app.core.deps import get_current_user
from app.schemas.users import UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(data: UserCreate, db: Session = Depends(get_db)):
    email_l = data.email.lower()
    # Unicidad case-insensitive (consistente con índice UNIQUE lower(email) en BD)
    exists = db.query(User).filter(func.lower(User.email) == email_l).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="email ya registrado")

    user = User(email=email_l, password_hash=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user  # Pydantic v2 con from_attributes=True en UserOut

class LoginIn(UserCreate):
    """Reutiliza email/password de UserCreate (mínimo necesario)."""
    pass

@router.post("/login")
def login(data: LoginIn, db: Session = Depends(get_db)):
    email_l = data.email.lower()
    user = db.query(User).filter(func.lower(User.email) == email_l).first()
    if not user or not verify_password(user.password_hash, data.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="credenciales inválidas")

    token = create_access_token(sub=user.id)
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)):
    return current
