# app/db.py
"""
Configuración de la base de datos y sesiones.
"""
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from typing import Generator
from app.config import settings

# Motor de base de datos
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verifica conexiones antes de usarlas
    echo=settings.DEBUG,  # Log de SQL en modo debug
)

# Sesión de base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Convención de nomenclatura para constraints
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

# Base para modelos
class Base(DeclarativeBase):
    """Clase base para todos los modelos SQLAlchemy."""
    metadata = MetaData(naming_convention=convention)


def get_db() -> Generator[Session, None, None]:
    """
    Dependencia de FastAPI para obtener sesión de base de datos.
    Se cierra automáticamente al finalizar la petición.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
