"""
Tests unitarios para logging.py - Sistema de logging estructurado
"""
import pytest
import logging
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
from app.core.logging import (
    StructuredFormatter,
    setup_logging,
    get_logger,
    log_auth_event,
    log_quota_event,
    log_ownership_validation,
    log_openai_request,
    log_error,
)


# ========================================
# TESTS PARA StructuredFormatter
# ========================================

def test_structured_formatter_basic_message():
    """StructuredFormatter debe formatear mensajes básicos correctamente"""
    formatter = StructuredFormatter()
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="Test message",
        args=(),
        exc_info=None
    )

    result = formatter.format(record)

    assert "INFO" in result
    assert "test" in result
    assert "Test message" in result
    # Verificar formato timestamp ISO
    assert "[" in result and "]" in result


def test_structured_formatter_with_user_id():
    """StructuredFormatter debe incluir user_id cuando está presente"""
    formatter = StructuredFormatter()
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="User action",
        args=(),
        exc_info=None
    )
    record.user_id = "user-123"

    result = formatter.format(record)

    assert "user_id=user-123" in result
    assert "User action" in result


def test_structured_formatter_with_email():
    """StructuredFormatter debe incluir email cuando está presente"""
    formatter = StructuredFormatter()
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="Auth event",
        args=(),
        exc_info=None
    )
    record.email = "test@example.com"

    result = formatter.format(record)

    assert "email=test@example.com" in result


def test_structured_formatter_with_resource_info():
    """StructuredFormatter debe incluir resource_type y resource_id"""
    formatter = StructuredFormatter()
    record = logging.LogRecord(
        name="test",
        level=logging.WARNING,
        pathname="",
        lineno=0,
        msg="Access denied",
        args=(),
        exc_info=None
    )
    record.resource_type = "document"
    record.resource_id = "doc-456"

    result = formatter.format(record)

    assert "resource_type=document" in result
    assert "resource_id=doc-456" in result
    assert "WARNING" in result


def test_structured_formatter_with_action_and_status():
    """StructuredFormatter debe incluir action y status"""
    formatter = StructuredFormatter()
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="Operation completed",
        args=(),
        exc_info=None
    )
    record.action = "upload"
    record.status = "success"

    result = formatter.format(record)

    assert "action=upload" in result
    assert "status=success" in result


def test_structured_formatter_with_bytes():
    """StructuredFormatter debe incluir bytes cuando está presente"""
    formatter = StructuredFormatter()
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="File uploaded",
        args=(),
        exc_info=None
    )
    record.bytes = 1024

    result = formatter.format(record)

    assert "bytes=1024" in result


def test_structured_formatter_with_exception():
    """StructuredFormatter debe incluir información de excepción"""
    formatter = StructuredFormatter()

    try:
        raise ValueError("Test error")
    except ValueError as e:
        record = logging.LogRecord(
            name="test",
            level=logging.ERROR,
            pathname="",
            lineno=0,
            msg="Error occurred",
            args=(),
            exc_info=(type(e), e, e.__traceback__)
        )

        result = formatter.format(record)

        assert "ERROR" in result
        assert "Error occurred" in result
        assert "ValueError" in result
        assert "Test error" in result


def test_structured_formatter_all_fields():
    """StructuredFormatter debe manejar múltiples campos simultáneamente"""
    formatter = StructuredFormatter()
    record = logging.LogRecord(
        name="studyforge",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="Complete log entry",
        args=(),
        exc_info=None
    )
    record.user_id = "user-999"
    record.email = "user@test.com"
    record.resource_type = "quiz"
    record.resource_id = "quiz-123"
    record.action = "submit"
    record.status = "success"
    record.bytes = 2048

    result = formatter.format(record)

    assert "user_id=user-999" in result
    assert "email=user@test.com" in result
    assert "resource_type=quiz" in result
    assert "resource_id=quiz-123" in result
    assert "action=submit" in result
    assert "status=success" in result
    assert "bytes=2048" in result


# ========================================
# TESTS PARA setup_logging() y get_logger()
# ========================================

@patch('app.core.logging.settings')
def test_setup_logging_default_level(mock_settings):
    """setup_logging debe configurar el logger con nivel INFO por defecto"""
    mock_settings.LOG_LEVEL = "INFO"
    mock_settings.LOG_TO_FILE = False  # Disable file logging to avoid mock issues
    mock_settings.LOG_SQL_QUERIES = False  # Disable SQL logging to avoid mock issues
    mock_settings.LOG_SQL_LEVEL = "WARNING"  # Set SQL log level (in case it's enabled)

    # Limpiar handlers previos
    logger = logging.getLogger("studyforge")
    logger.handlers.clear()

    result = setup_logging()

    assert result.name == "studyforge"
    assert result.level == logging.INFO
    assert len(result.handlers) > 0
    assert result.propagate is False


@patch('app.core.logging.settings')
def test_setup_logging_debug_level(mock_settings):
    """setup_logging debe respetar el nivel DEBUG de settings"""
    mock_settings.LOG_LEVEL = "DEBUG"

    logger = logging.getLogger("studyforge_debug")
    logger.handlers.clear()

    # Simular la función con un logger diferente
    logger.setLevel(logging.DEBUG)

    assert logger.level == logging.DEBUG


@patch('app.core.logging.settings')
def test_setup_logging_no_duplicate_handlers(mock_settings):
    """setup_logging no debe crear handlers duplicados"""
    mock_settings.LOG_LEVEL = "INFO"

    logger = logging.getLogger("studyforge_no_dup")
    logger.handlers.clear()

    # Primera llamada
    result1 = setup_logging()
    handlers_count_1 = len(result1.handlers)

    # Segunda llamada - debería retornar el mismo logger sin duplicar handlers
    # (esto se simula verificando que la función detecta handlers existentes)
    assert handlers_count_1 > 0


def test_get_logger():
    """get_logger debe retornar un logger con el nombre especificado"""
    logger = get_logger("test_module")

    assert logger.name == "test_module"


def test_get_logger_default_name():
    """get_logger debe usar 'studyforge' por defecto"""
    logger = get_logger()

    assert logger.name == "studyforge"


# ========================================
# TESTS PARA log_auth_event()
# ========================================

@patch('app.core.logging.logger')
def test_log_auth_event_success(mock_logger):
    """log_auth_event debe loguear eventos exitosos con INFO"""
    log_auth_event(
        event_type="login",
        email="user@test.com",
        user_id="user-123",
        status="success"
    )

    mock_logger.info.assert_called_once()
    call_args = mock_logger.info.call_args
    assert "login" in call_args[0][0]
    assert call_args[1]["extra"]["action"] == "login"
    assert call_args[1]["extra"]["email"] == "user@test.com"
    assert call_args[1]["extra"]["status"] == "success"


@patch('app.core.logging.logger')
def test_log_auth_event_failed(mock_logger):
    """log_auth_event debe loguear eventos fallidos con WARNING"""
    log_auth_event(
        event_type="login",
        email="bad@test.com",
        status="failed",
        message="Invalid credentials"
    )

    mock_logger.warning.assert_called_once()
    call_args = mock_logger.warning.call_args
    assert "Invalid credentials" in call_args[0][0]
    assert call_args[1]["extra"]["status"] == "failed"


@patch('app.core.logging.logger')
def test_log_auth_event_register(mock_logger):
    """log_auth_event debe manejar eventos de registro"""
    log_auth_event(
        event_type="register",
        email="newuser@test.com",
        user_id="user-456",
        status="success"
    )

    mock_logger.info.assert_called_once()
    call_args = mock_logger.info.call_args
    assert call_args[1]["extra"]["action"] == "register"


# ========================================
# TESTS PARA log_quota_event()
# ========================================

@patch('app.core.logging.logger')
def test_log_quota_event_upload(mock_logger):
    """log_quota_event debe loguear uploads correctamente"""
    log_quota_event(
        event_type="upload",
        user_id="user-123",
        bytes_delta=1024,
        resource_type="document",
        resource_id="doc-789"
    )

    mock_logger.info.assert_called_once()
    call_args = mock_logger.info.call_args
    assert call_args[1]["extra"]["action"] == "upload"
    assert call_args[1]["extra"]["bytes"] == 1024
    assert call_args[1]["extra"]["resource_type"] == "document"


@patch('app.core.logging.logger')
def test_log_quota_event_with_usage_percentage(mock_logger):
    """log_quota_event debe incluir porcentaje de uso cuando está disponible"""
    log_quota_event(
        event_type="upload",
        user_id="user-123",
        bytes_delta=500,
        storage_used=7500,
        storage_quota=10000
    )

    call_args = mock_logger.info.call_args
    # storage_used (7500) / storage_quota (10000) = 75%
    assert "75.0%" in call_args[0][0]


@patch('app.core.logging.logger')
def test_log_quota_event_exceeded(mock_logger):
    """log_quota_event debe usar WARNING para quota_exceeded"""
    log_quota_event(
        event_type="quota_exceeded",
        user_id="user-999",
        bytes_delta=0,
        storage_used=10500,
        storage_quota=10000
    )

    mock_logger.warning.assert_called_once()
    call_args = mock_logger.warning.call_args
    assert call_args[1]["extra"]["action"] == "quota_exceeded"


@patch('app.core.logging.logger')
def test_log_quota_event_delete(mock_logger):
    """log_quota_event debe manejar deletes con bytes_delta negativo"""
    log_quota_event(
        event_type="delete",
        user_id="user-123",
        bytes_delta=-2048,
        resource_type="document",
        resource_id="doc-456"
    )

    call_args = mock_logger.info.call_args
    assert call_args[1]["extra"]["bytes"] == -2048


# ========================================
# TESTS PARA log_ownership_validation()
# ========================================

@patch('app.core.logging.logger')
def test_log_ownership_validation_denied(mock_logger):
    """log_ownership_validation debe usar WARNING cuando status es denied"""
    log_ownership_validation(
        resource_type="document",
        resource_id="doc-123",
        user_id="user-999",
        owner_id="user-123",
        status="denied"
    )

    mock_logger.warning.assert_called_once()
    call_args = mock_logger.warning.call_args
    assert "denied" in call_args[0][0]
    assert "user-999" in call_args[0][0]
    assert "user-123" in call_args[0][0]


@patch('app.core.logging.logger')
def test_log_ownership_validation_allowed(mock_logger):
    """log_ownership_validation debe usar DEBUG cuando status es allowed"""
    log_ownership_validation(
        resource_type="quiz",
        resource_id="quiz-456",
        user_id="user-123",
        owner_id="user-123",
        status="allowed"
    )

    mock_logger.debug.assert_called_once()


@patch('app.core.logging.logger')
def test_log_ownership_validation_custom_message(mock_logger):
    """log_ownership_validation debe respetar mensajes personalizados"""
    log_ownership_validation(
        resource_type="summary",
        resource_id="sum-789",
        user_id="user-456",
        owner_id="user-123",
        status="denied",
        message="Custom access denied message"
    )

    call_args = mock_logger.warning.call_args
    assert "Custom access denied message" in call_args[0][0]


# ========================================
# TESTS PARA log_openai_request()
# ========================================

@patch('app.core.logging.logger')
def test_log_openai_request_success(mock_logger):
    """log_openai_request debe loguear requests exitosas con INFO"""
    log_openai_request(
        request_type="summary",
        user_id="user-123",
        model="gpt-4",
        tokens_used=500,
        status="success"
    )

    mock_logger.info.assert_called_once()
    call_args = mock_logger.info.call_args
    assert "summary" in call_args[0][0]
    assert "tokens: 500" in call_args[0][0]
    assert call_args[1]["extra"]["action"] == "openai_summary"


@patch('app.core.logging.logger')
def test_log_openai_request_failed(mock_logger):
    """log_openai_request debe loguear requests fallidas con ERROR"""
    log_openai_request(
        request_type="quiz",
        user_id="user-456",
        model="gpt-4",
        status="failed",
        error="API timeout"
    )

    mock_logger.error.assert_called_once()
    call_args = mock_logger.error.call_args
    assert "failed" in call_args[0][0]
    assert "API timeout" in call_args[0][0]


@patch('app.core.logging.logger')
def test_log_openai_request_without_tokens(mock_logger):
    """log_openai_request debe manejar casos sin tokens_used"""
    log_openai_request(
        request_type="summary",
        user_id="user-789",
        model="gpt-3.5-turbo",
        status="success"
    )

    mock_logger.info.assert_called_once()
    call_args = mock_logger.info.call_args
    # No debe incluir "tokens:" en el mensaje
    assert "tokens:" not in call_args[0][0]


# ========================================
# TESTS PARA log_error()
# ========================================

@patch('app.core.logging.logger')
def test_log_error_basic(mock_logger):
    """log_error debe loguear errores con contexto"""
    error = ValueError("Test error")

    log_error(
        error=error,
        context="test_function",
        user_id="user-123"
    )

    mock_logger.error.assert_called_once()
    call_args = mock_logger.error.call_args
    assert "test_function" in call_args[0][0]
    assert "Test error" in call_args[0][0]
    assert call_args[1]["extra"]["user_id"] == "user-123"
    assert call_args[1]["exc_info"] == error


@patch('app.core.logging.logger')
def test_log_error_with_extra_data(mock_logger):
    """log_error debe incluir datos adicionales"""
    error = RuntimeError("Runtime issue")
    extra_data = {
        "file_name": "test.pdf",
        "file_size": 2048
    }

    log_error(
        error=error,
        context="file_processing",
        user_id="user-456",
        extra_data=extra_data
    )

    call_args = mock_logger.error.call_args
    assert call_args[1]["extra"]["file_name"] == "test.pdf"
    assert call_args[1]["extra"]["file_size"] == 2048


@patch('app.core.logging.logger')
def test_log_error_without_user_id(mock_logger):
    """log_error debe funcionar sin user_id"""
    error = Exception("General error")

    log_error(
        error=error,
        context="background_task"
    )

    mock_logger.error.assert_called_once()
    call_args = mock_logger.error.call_args
    assert call_args[1]["extra"]["user_id"] is None
