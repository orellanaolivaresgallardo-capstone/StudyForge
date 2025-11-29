# app/config.py
"""
Configuración central de la aplicación.
Gestiona variables de entorno y configuraciones globales.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Configuración de la aplicación usando Pydantic Settings."""

    # Base de datos
    DATABASE_URL: str = "postgresql+psycopg://studyforge_app:studyforge@localhost:5432/studyforge?options=-csearch_path=studyforge,public"

    # JWT y seguridad
    SECRET_KEY: str = "CHANGE_THIS_IN_PRODUCTION_USE_SECURE_RANDOM_KEY"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 horas

    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"  # Modelo más económico para desarrollo

    # Upload de archivos
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: list[str] = ["pdf", "pptx", "docx", "txt"]

    # Cuestionarios
    MIN_QUESTIONS_PER_QUIZ: int = 5
    MAX_QUESTIONS_PER_QUIZ: int = 30
    DEFAULT_QUIZ_QUESTIONS: int = 10

    # Entorno
    ENV: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "DEBUG"  # DEBUG, INFO, WARNING, ERROR, CRITICAL

    # Logging a archivos
    LOG_TO_FILE: bool = True  # Habilitar guardado de logs en archivo
    LOG_FILE_PATH: str = "logs/studyforge.log"  # Ruta del archivo de log
    LOG_FILE_MAX_BYTES: int = 10485760  # 10 MB por archivo
    LOG_FILE_BACKUP_COUNT: int = 5  # Mantener 5 archivos históricos

    # SQL Logging
    LOG_SQL_QUERIES: bool = True  # Habilitar logging de queries SQL
    LOG_SQL_LEVEL: str = "DEBUG"  # Nivel de logging SQL (DEBUG, INFO)
    LOG_SQL_TO_SEPARATE_FILE: bool = False  # Guardar SQL en archivo separado
    LOG_SQL_FILE_PATH: str = "logs/sql.log"  # Ruta del archivo de SQL (si está separado)

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100  # Requests por ventana
    RATE_LIMIT_WINDOW: int = 60  # Ventana en segundos

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )


# Instancia global de configuración
settings = Settings()
