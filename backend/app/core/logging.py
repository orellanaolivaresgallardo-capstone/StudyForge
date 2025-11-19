# app/core/logging.py
"""
Sistema de logging estructurado para StudyForge.

Proporciona logging centralizado con niveles configurables y formato estructurado.
"""
import logging
import sys
from typing import Optional
from datetime import datetime
from app.config import settings


class StructuredFormatter(logging.Formatter):
    """Formatter personalizado para logs estructurados."""

    def format(self, record: logging.LogRecord) -> str:
        """Formatea el log con información estructurada."""
        # Timestamp
        timestamp = datetime.utcnow().isoformat()

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

    # Crear handler para consola
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)

    # Aplicar formatter
    formatter = StructuredFormatter()
    console_handler.setFormatter(formatter)

    # Agregar handler al logger
    logger.addHandler(console_handler)

    # No propagar a logger raíz de Python
    logger.propagate = False

    return logger


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
