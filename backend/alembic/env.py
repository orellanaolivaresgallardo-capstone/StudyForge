import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool, text
from alembic import context
from dotenv import load_dotenv

# 1) Config base / logging
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 2) Importa metadata y registra modelos
from app.db import Base  # declarative_base()
import app.repositories.models  # asegura que las tablas estén registradas

target_metadata = Base.metadata

# 3) Cargar variables de entorno (primero .env.alembic, luego .env como fallback)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.alembic"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Preferir ALEMBIC_URL (owner). Fallback a DATABASE_URL (app).
db_url = os.getenv("ALEMBIC_URL") or os.getenv("DATABASE_URL")

# Blindaje: si hay %, duplícalo para que configparser no reviente
if db_url:
    db_url = db_url.replace("%", "%%")
    config.set_main_option("sqlalchemy.url", db_url)

# 4) Opciones comunes de comparación (autogenerate coherente con schema)
def include_object(obj, name, type_, reflected, compare_to):
    # No intentes crear/alterar la tabla de versión
    if type_ == "table" and name == "alembic_version":
        return False
    return True

COMMON_KW = dict(
    target_metadata=target_metadata,
    compare_type=True,
    compare_server_default=True,
    include_schemas=True,            # importantísimo al trabajar con schema personalizado
    version_table="alembic_version",
    version_table_schema="studyforge",
    include_object=include_object,
)

def run_migrations_offline():
    """Ejecutar migraciones en modo 'offline'."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, literal_binds=True, **COMMON_KW)
    with context.begin_transaction():
        # Asegura que las operaciones se hagan sobre el schema correcto
        context.execute("SET search_path TO studyforge, public")
        context.run_migrations()

def run_migrations_online():
    """Ejecutar migraciones en modo 'online'."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        # Fija el search_path en la conexión
        connection.execute(text("SET search_path TO studyforge, public"))
        context.configure(connection=connection, **COMMON_KW)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
