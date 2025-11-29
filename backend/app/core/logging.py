# app/core/logging.py
"""
Sistema de logging estructurado para StudyForge.

Proporciona logging centralizado con niveles configurables y formato estructurado.
"""
import logging
import sys
from typing import Optional
from datetime import datetime, timezone
from pathlib import Path
from logging.handlers import RotatingFileHandler
from app.config import settings


class StructuredFormatter(logging.Formatter):
    """Formatter personalizado para logs estructurados."""

    def format(self, record: logging.LogRecord) -> str:
        """Formatea el log con información estructurada."""
        # Timestamp
        timestamp = datetime.now(timezone.utc).isoformat()

        # Nivel de log
        level = record.levelname

        # Mensaje
        message = record.getMessage()

        # Información adicional
        extra_info = ""
        if hasattr(record, 'user_id'):
            extra_info += f" user_id={record.user_id}"
        if hasattr(record, 'email'):
            extra_info += f" email={record.email}"
        if hasattr(record, 'resource_type'):
            extra_info += f" resource_type={record.resource_type}"
        if hasattr(record, 'resource_id'):
            extra_info += f" resource_id={record.resource_id}"
        if hasattr(record, 'action'):
            extra_info += f" action={record.action}"
        if hasattr(record, 'status'):
            extra_info += f" status={record.status}"
        if hasattr(record, 'bytes'):
            extra_info += f" bytes={record.bytes}"

        # Excepción si existe
        exception = ""
        if record.exc_info:
            exception = f"\n{self.formatException(record.exc_info)}"

        return f"[{timestamp}] {level} {record.name} - {message}{extra_info}{exception}"


def setup_logging() -> logging.Logger:
    """
    Configura el sistema de logging de la aplicación.

    Returns:
        Logger: Logger raíz configurado
    """
    # Obtener logger raíz
    logger = logging.getLogger("studyforge")

    # Configurar nivel basado en settings
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logger.setLevel(log_level)

    # Evitar duplicación de handlers
    if logger.handlers:
        return logger

    # Formatter compartido
    formatter = StructuredFormatter()

    # ========== Handler para consola ==========
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # ========== Handler para archivo (con rotación) ==========
    if settings.LOG_TO_FILE:
        # Crear directorio de logs si no existe
        log_file = Path(settings.LOG_FILE_PATH)
        log_file.parent.mkdir(parents=True, exist_ok=True)

        # Crear handler con rotación automática
        file_handler = RotatingFileHandler(
            filename=str(log_file),
            maxBytes=settings.LOG_FILE_MAX_BYTES,  # 10 MB por defecto
            backupCount=settings.LOG_FILE_BACKUP_COUNT,  # 5 backups
            encoding='utf-8'
        )
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

        logger.info(
            f"File logging enabled: {settings.LOG_FILE_PATH} "
            f"(max {settings.LOG_FILE_MAX_BYTES / 1024 / 1024:.1f} MB, "
            f"{settings.LOG_FILE_BACKUP_COUNT} backups)"
        )

    # No propagar a logger raíz de Python
    logger.propagate = False

    # ========== Configurar SQL Logging ==========
    setup_sql_logging(formatter)

    return logger


def setup_sql_logging(formatter: StructuredFormatter) -> None:
    """
    Configura el logging de queries SQL de SQLAlchemy.

    Args:
        formatter: Formatter a usar para los logs SQL
    """
    # ========== SIEMPRE mostrar warnings y errores de SQLAlchemy ==========
    # Esto asegura que los errores de DB se muestren incluso si LOG_SQL_QUERIES=False
    sqlalchemy_error_loggers = [
        "sqlalchemy.engine.Engine",  # Errores de ejecución SQL
        "sqlalchemy.pool",           # Errores de pool de conexiones
        "sqlalchemy.dialects",       # Errores de dialecto (PostgreSQL, etc.)
        "sqlalchemy.orm",            # Errores de ORM (flush, commit, etc.)
    ]

    studyforge_logger = logging.getLogger("studyforge")

    for logger_name in sqlalchemy_error_loggers:
        error_logger = logging.getLogger(logger_name)
        error_logger.setLevel(logging.WARNING)  # WARNING y ERROR siempre visibles

        # Agregar handlers del logger principal si no existen
        if not error_logger.handlers:
            # SIEMPRE agregar handler de consola (para ver errores en vivo)
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(logging.WARNING)
            console_handler.setFormatter(formatter)
            error_logger.addHandler(console_handler)

            # También agregar handler de archivo si está habilitado
            for handler in studyforge_logger.handlers:
                if isinstance(handler, RotatingFileHandler):
                    error_logger.addHandler(handler)

            error_logger.propagate = False

    # ========== Logging de queries SQL (opcional) ==========
    if not settings.LOG_SQL_QUERIES:
        # No mostrar queries INFO/DEBUG, solo errores (ya configurados arriba)
        return

    # Logger de SQLAlchemy engine (queries ejecutadas)
    sql_logger = logging.getLogger("sqlalchemy.engine")
    sql_log_level = getattr(logging, settings.LOG_SQL_LEVEL.upper(), logging.INFO)
    sql_logger.setLevel(sql_log_level)

    # Evitar duplicación
    if sql_logger.handlers:
        return

    # Si queremos SQL en archivo separado
    if settings.LOG_SQL_TO_SEPARATE_FILE:
        # Crear directorio si no existe
        sql_log_file = Path(settings.LOG_SQL_FILE_PATH)
        sql_log_file.parent.mkdir(parents=True, exist_ok=True)

        # Handler específico para SQL
        sql_file_handler = RotatingFileHandler(
            filename=str(sql_log_file),
            maxBytes=settings.LOG_FILE_MAX_BYTES,
            backupCount=settings.LOG_FILE_BACKUP_COUNT,
            encoding='utf-8'
        )
        sql_file_handler.setLevel(sql_log_level)
        sql_file_handler.setFormatter(formatter)
        sql_logger.addHandler(sql_file_handler)

        # También a consola si estamos en debug
        if settings.DEBUG:
            sql_console_handler = logging.StreamHandler(sys.stdout)
            sql_console_handler.setLevel(sql_log_level)
            sql_console_handler.setFormatter(formatter)
            sql_logger.addHandler(sql_console_handler)

        # No propagar al logger raíz (ya tiene sus propios handlers)
        sql_logger.propagate = False

        logging.getLogger("studyforge").info(
            f"SQL logging enabled: {settings.LOG_SQL_FILE_PATH} (separate file)"
        )
    else:
        # Copiar los handlers del logger principal (studyforge) al logger SQL
        # Así las queries aparecerán en el mismo archivo que los demás logs
        studyforge_logger = logging.getLogger("studyforge")

        for handler in studyforge_logger.handlers:
            # Crear un nuevo handler con la misma configuración
            if isinstance(handler, RotatingFileHandler):
                # Usar el mismo archivo que el logger principal
                sql_logger.addHandler(handler)
            elif isinstance(handler, logging.StreamHandler):
                # Usar la misma consola
                sql_logger.addHandler(handler)

        # No propagar para evitar duplicados
        sql_logger.propagate = False

        logging.getLogger("studyforge").info(
            f"SQL logging enabled: level={settings.LOG_SQL_LEVEL} (same file as app logs)"
        )


def get_logger(name: str = "studyforge") -> logging.Logger:
    """
    Obtiene un logger con el nombre especificado.

    Args:
        name: Nombre del logger (por defecto "studyforge")

    Returns:
        Logger configurado
    """
    return logging.getLogger(name)


# Logger global para uso rápido
logger = setup_logging()


# Funciones de conveniencia para logging de eventos específicos
def log_auth_event(
    event_type: str,
    email: Optional[str] = None,
    user_id: Optional[str] = None,
    status: str = "success",
    message: Optional[str] = None
) -> None:
    """
    Registra eventos de autenticación.

    Args:
        event_type: Tipo de evento (login, register, logout, failed_login)
        email: Email del usuario
        user_id: ID del usuario
        status: Estado del evento (success, failed)
        message: Mensaje adicional
    """
    log_message = message or f"Auth event: {event_type}"

    if status == "success":
        logger.info(
            log_message,
            extra={
                "action": event_type,
                "email": email,
                "user_id": user_id,
                "status": status
            }
        )
    else:
        logger.warning(
            log_message,
            extra={
                "action": event_type,
                "email": email,
                "user_id": user_id,
                "status": status
            }
        )


def log_quota_event(
    event_type: str,
    user_id: str,
    bytes_delta: int = 0,
    storage_used: Optional[int] = None,
    storage_quota: Optional[int] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    message: Optional[str] = None
) -> None:
    """
    Registra eventos relacionados con cuotas de almacenamiento.

    Args:
        event_type: Tipo de evento (upload, delete, quota_exceeded, quota_warning)
        user_id: ID del usuario
        bytes_delta: Cambio en bytes (positivo para upload, negativo para delete)
        storage_used: Almacenamiento usado actualmente
        storage_quota: Cuota total del usuario
        resource_type: Tipo de recurso (document, summary)
        resource_id: ID del recurso
        message: Mensaje adicional
    """
    log_message = message or f"Quota event: {event_type}"

    extra = {
        "action": event_type,
        "user_id": user_id,
        "bytes": bytes_delta,
        "resource_type": resource_type,
        "resource_id": resource_id
    }

    # Agregar información de uso si está disponible
    if storage_used is not None and storage_quota is not None:
        usage_pct = (storage_used / storage_quota * 100) if storage_quota > 0 else 0
        log_message += f" (using {usage_pct:.1f}% of quota)"

    if event_type == "quota_exceeded":
        logger.warning(log_message, extra=extra)
    else:
        logger.info(log_message, extra=extra)


def log_ownership_validation(
    resource_type: str,
    resource_id: str,
    user_id: str,
    owner_id: str,
    status: str,
    message: Optional[str] = None
) -> None:
    """
    Registra intentos de validación de ownership.

    Args:
        resource_type: Tipo de recurso (document, summary, quiz, etc.)
        resource_id: ID del recurso
        user_id: ID del usuario que intenta acceder
        owner_id: ID del dueño del recurso
        status: Estado (allowed, denied)
        message: Mensaje adicional
    """
    log_message = message or f"Ownership validation: {status}"

    extra = {
        "action": "ownership_check",
        "resource_type": resource_type,
        "resource_id": resource_id,
        "user_id": user_id,
        "status": status
    }

    if status == "denied":
        logger.warning(
            f"{log_message} - User {user_id} attempted to access {resource_type} {resource_id} owned by {owner_id}",
            extra=extra
        )
    else:
        logger.debug(log_message, extra=extra)


def log_openai_request(
    request_type: str,
    user_id: str,
    model: str,
    tokens_used: Optional[int] = None,
    status: str = "success",
    error: Optional[str] = None
) -> None:
    """
    Registra llamadas a la API de OpenAI.

    Args:
        request_type: Tipo de request (summary, quiz)
        user_id: ID del usuario
        model: Modelo de OpenAI usado
        tokens_used: Tokens consumidos
        status: Estado de la request (success, failed)
        error: Mensaje de error si falló
    """
    log_message = f"OpenAI {request_type} request: {status}"
    if tokens_used:
        log_message += f" (tokens: {tokens_used})"

    extra = {
        "action": f"openai_{request_type}",
        "user_id": user_id,
        "status": status
    }

    if status == "success":
        logger.info(log_message, extra=extra)
    else:
        logger.error(f"{log_message} - Error: {error}", extra=extra)


def log_error(
    error: Exception,
    context: str,
    user_id: Optional[str] = None,
    extra_data: Optional[dict] = None
) -> None:
    """
    Registra errores con contexto adicional.

    Args:
        error: Excepción capturada
        context: Contexto donde ocurrió el error
        user_id: ID del usuario (si aplica)
        extra_data: Datos adicionales
    """
    extra = {"action": "error", "user_id": user_id}
    if extra_data:
        extra.update(extra_data)

    logger.error(
        f"Error in {context}: {str(error)}",
        exc_info=error,
        extra=extra
    )


def log_audit_event(
    event: str,
    user_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    action: Optional[str] = None,
    result: str = "success",
    ip_address: Optional[str] = None,
    extra: Optional[dict] = None
) -> None:
    """
    Registra eventos de auditoría de seguridad (ISO 27001 A.12.4).

    Args:
        event: Tipo de evento (login_attempt, access_resource, modify_resource, delete_resource)
        user_id: UUID del usuario que realiza la acción
        resource_type: Tipo de recurso (document, summary, quiz, etc.)
        resource_id: UUID del recurso
        action: Acción realizada (read, create, update, delete, login)
        result: Resultado de la acción (success, failure, forbidden)
        ip_address: Dirección IP de la request
        extra: Contexto adicional
    """
    log_message = f"AUDIT: {event}"

    audit_data = {
        "action": action or event,
        "event": event,
        "user_id": user_id,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "status": result,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    # Agregar IP si está disponible
    if ip_address:
        audit_data["ip_address"] = ip_address

    # Merge con datos extra si existen
    if extra:
        audit_data.update(extra)

    # Nivel de log basado en resultado
    if result == "failure":
        logger.warning(log_message, extra=audit_data)
    elif result == "forbidden":
        logger.warning(log_message, extra=audit_data)
    else:
        logger.info(log_message, extra=audit_data)
