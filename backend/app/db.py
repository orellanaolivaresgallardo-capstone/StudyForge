# app/db.py
"""
Configuración de la base de datos y sesiones.
"""
from sqlalchemy import create_engine, MetaData, JSON, TypeDecorator
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from typing import Generator, Any
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


class JSONBType(TypeDecorator):
    """
    Tipo JSON que se adapta automáticamente al dialecto de DB.

    - PostgreSQL: Usa JSONB (indexable, más eficiente)
    - SQLite/Otros: Usa JSON (compatible)

    Esto permite que los tests de integración usen SQLite mientras
    que producción usa PostgreSQL sin cambiar código.
    """
    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        """Selecciona el tipo correcto según el dialecto."""
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(JSONB())
        else:
            return dialect.type_descriptor(JSON())

def get_json_type() -> Any:
    """
    Retorna la clase JSONBType para usar en columnas.

    Ejemplo:
        content: Mapped[dict] = mapped_column(get_json_type(), nullable=False)
    """
    return JSONBType


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
