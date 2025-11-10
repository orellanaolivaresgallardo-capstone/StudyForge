# app/db.py
import os
from typing import Dict

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()  # lee backend/.env si existe


def _normalize_database_url(raw_url: str) -> str:
    """Normaliza URLs de Render (postgres://) a SQLAlchemy (postgresql+psycopg://)."""
    if raw_url.startswith("postgres://"):
        return raw_url.replace("postgres://", "postgresql+psycopg://", 1)
    if raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+"):
        return raw_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return raw_url


raw_database_url = os.getenv("DATABASE_URL")
if not raw_database_url:
    raise RuntimeError("DATABASE_URL no está definido en las variables de entorno")

DATABASE_URL = _normalize_database_url(raw_database_url)

try:
    database_url = make_url(DATABASE_URL)
except ArgumentError as exc:  # pragma: no cover - error temprano
    raise RuntimeError("DATABASE_URL no es válido para SQLAlchemy") from exc

connect_args: Dict[str, str] = {}
schema = os.getenv("DATABASE_SCHEMA")
if schema and "options" not in database_url.query:
    connect_args["options"] = f"-csearch_path={schema},public"

engine = create_engine(database_url, echo=False, future=True, connect_args=connect_args)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

class Base(DeclarativeBase):
    pass

# Dependency para inyectar Session en endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
