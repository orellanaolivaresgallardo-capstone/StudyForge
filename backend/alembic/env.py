import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool, text
from alembic import context
from dotenv import load_dotenv

# 1) Logging de Alembic
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 2) Importa tu Base/metadata desde el backend
#    (ajusta el import a como lo tengas)
from app.db import Base  # Base = declarative_base() usado por tus modelos
import app.repositories.models  # <- importa modelos para que estén registradas las tablas

target_metadata = Base.metadata

# 3) Lee la DATABASE_URL desde tu .env / entorno
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
DATABASE_URL = os.getenv("DATABASE_URL_MIGRATIONS") or os.getenv("DATABASE_URL")
if DATABASE_URL:
    config.set_main_option("sqlalchemy.url", DATABASE_URL)

# 4) Opciones comunes de comparación (útil para autogenerate)
COMMON_KW = dict(
    target_metadata=target_metadata,
    compare_type=True,
    compare_server_default=True,
    include_schemas=True,  # importante si usas esquema "studyforge"
    version_table_schema="studyforge",  # alembic_version vive en el esquema correcto
)

def include_object(obj, name, type_, reflected, compare_to):
    if type_ == "table" and name == "alembic_version":
        return False
    return True

COMMON_KW = dict(
    target_metadata=target_metadata,
    compare_type=True,
    compare_server_default=True,
    include_schemas=True,
    version_table="alembic_version",
    version_table_schema="studyforge",
    include_object=include_object,  # 👈 añade esta línea
)


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, literal_binds=True, **COMMON_KW)
    with context.begin_transaction():
        context.execute("SET search_path TO studyforge, public")
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        connection.execute(text("SET search_path TO studyforge, public"))
        context.configure(connection=connection, **COMMON_KW)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()