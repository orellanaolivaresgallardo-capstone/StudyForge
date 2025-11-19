# alembic/env.py
"""
Configuración de Alembic para migraciones de base de datos.
"""
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool, text
from alembic import context
from dotenv import load_dotenv

# Config base y logging
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Importar Base y todos los modelos
from app.db import Base
from app.models import User, Summary, Quiz, Question, QuizAttempt, Answer

# Metadata para autogenerate
target_metadata = Base.metadata

# Constantes de schema
SCHEMA = "studyforge"
VERSION_TABLE = "alembic_version"

# Cargar variables de entorno
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(project_root, ".env.alembic"))
load_dotenv(os.path.join(project_root, ".env"))

# Preferir ALEMBIC_URL (owner), fallback a DATABASE_URL (app)
db_url = os.getenv("ALEMBIC_URL") or os.getenv("DATABASE_URL")

# Blindaje: duplicar % para evitar errores de configparser
if db_url:
    db_url = db_url.replace("%", "%%")
    config.set_main_option("sqlalchemy.url", db_url)


def include_object(obj, name, type_, reflected, compare_to):
    """No incluir la tabla de versión en las migraciones."""
    if type_ == "table" and name == VERSION_TABLE:
        return False
    return True


COMMON_KW = dict(
    target_metadata=target_metadata,
    compare_type=True,
    compare_server_default=True,
    include_schemas=True,
    version_table=VERSION_TABLE,
    version_table_schema=SCHEMA,
    include_object=include_object,
)


def run_migrations_offline():
    """Ejecutar migraciones en modo 'offline'."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, literal_binds=True, **COMMON_KW)
    with context.begin_transaction():
        context.execute(f"SET search_path TO {SCHEMA}, public")
        context.run_migrations()


def run_migrations_online():
    """Ejecutar migraciones en modo 'online'."""
    section = config.get_section(config.config_ini_section) or {}
    connectable = engine_from_config(
        section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        connection.execute(text(f"SET search_path TO {SCHEMA}, public"))
        connection.commit()
        context.configure(connection=connection, **COMMON_KW)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
