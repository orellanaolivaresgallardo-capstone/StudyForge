"""
Tests unitarios para dependencies.py - Autenticación y validación de ownership
"""
import pytest
from uuid import uuid4
from unittest.mock import Mock, MagicMock
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from app.core.dependencies import (
    get_current_user,
    verify_document_ownership,
    verify_summary_ownership,
    verify_quiz_ownership,
    verify_quiz_attempt_ownership,
    verify_space_ownership,
)
from app.models import User, Document, Summary, Quiz, QuizAttempt, StudySpace


# ========================================
# TESTS PARA get_current_user()
# ========================================

def test_get_current_user_valid_token(monkeypatch):
    """get_current_user debe retornar el usuario cuando el token es válido"""
    user_id = str(uuid4())

    # Mock del usuario
    mock_user = Mock(spec=User)
    mock_user.id = user_id
    mock_user.email = "test@example.com"
    mock_user.is_active = True

    # Mock de la base de datos (SQLAlchemy 2.0 API)
    mock_db = MagicMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_user

    # Mock de decode_access_token
    def mock_decode(token):
        return {"sub": user_id}

    monkeypatch.setattr("app.core.dependencies.decode_access_token", mock_decode)

    # Crear credenciales
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid_token")

    # Ejecutar
    result = get_current_user(credentials, mock_db)

    # Verificar
    assert result == mock_user
    assert result.id == user_id


def test_get_current_user_invalid_token(monkeypatch):
    """get_current_user debe lanzar 401 cuando el token es inválido"""
    mock_db = MagicMock()

    # Mock de decode_access_token retorna None (token inválido)
    def mock_decode(token):
        return None

    monkeypatch.setattr("app.core.dependencies.decode_access_token", mock_decode)

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid_token")

    # Ejecutar y verificar
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials, mock_db)

    assert exc_info.value.status_code == 401
    assert "inválido o expirado" in exc_info.value.detail


def test_get_current_user_malformed_token(monkeypatch):
    """get_current_user debe lanzar 401 cuando el token no tiene 'sub'"""
    mock_db = MagicMock()

    # Mock de decode_access_token retorna payload sin 'sub'
    def mock_decode(token):
        return {"some_field": "value"}

    monkeypatch.setattr("app.core.dependencies.decode_access_token", mock_decode)

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="malformed_token")

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials, mock_db)

    assert exc_info.value.status_code == 401
    assert "malformado" in exc_info.value.detail


def test_get_current_user_invalid_uuid(monkeypatch):
    """get_current_user debe lanzar 401 cuando user_id no es un UUID válido"""
    mock_db = MagicMock()

    # Mock de decode_access_token retorna user_id inválido (no es UUID)
    def mock_decode(token):
        return {"sub": "not-a-valid-uuid-123"}  # String que no es UUID

    monkeypatch.setattr("app.core.dependencies.decode_access_token", mock_decode)

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid_uuid_token")

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials, mock_db)

    assert exc_info.value.status_code == 401
    assert "ID inválido" in exc_info.value.detail


def test_get_current_user_not_found(monkeypatch):
    """get_current_user debe lanzar 401 cuando el usuario no existe en DB"""
    user_id = str(uuid4())

    # Mock de la base de datos - usuario no encontrado (SQLAlchemy 2.0 API)
    mock_db = MagicMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = None

    # Mock de decode_access_token
    def mock_decode(token):
        return {"sub": user_id}

    monkeypatch.setattr("app.core.dependencies.decode_access_token", mock_decode)

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid_token")

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials, mock_db)

    assert exc_info.value.status_code == 401
    assert "no encontrado" in exc_info.value.detail


def test_get_current_user_inactive_user(monkeypatch):
    """get_current_user debe lanzar 403 cuando el usuario está inactivo"""
    user_id = str(uuid4())

    # Mock del usuario inactivo
    mock_user = Mock(spec=User)
    mock_user.id = user_id
    mock_user.is_active = False

    # Mock de la base de datos (SQLAlchemy 2.0 API)
    mock_db = MagicMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_user

    # Mock de decode_access_token
    def mock_decode(token):
        return {"sub": user_id}

    monkeypatch.setattr("app.core.dependencies.decode_access_token", mock_decode)

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid_token")

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials, mock_db)

    assert exc_info.value.status_code == 403
    assert "inactivo" in exc_info.value.detail


# ========================================
# TESTS PARA verify_document_ownership()
# ========================================

def test_verify_document_ownership_valid():
    """verify_document_ownership debe retornar el documento si pertenece al usuario"""
    user_id = uuid4()
    doc_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_document = Mock(spec=Document)
    mock_document.id = doc_id
    mock_document.user_id = user_id

    result = verify_document_ownership(mock_document, mock_user)

    assert result == mock_document


def test_verify_document_ownership_not_found():
    """verify_document_ownership debe lanzar 404 cuando el documento es None"""
    mock_user = Mock(spec=User)
    mock_user.id = uuid4()

    with pytest.raises(HTTPException) as exc_info:
        verify_document_ownership(None, mock_user)

    assert exc_info.value.status_code == 404
    assert "no encontrado" in exc_info.value.detail


def test_verify_document_ownership_forbidden(monkeypatch):
    """verify_document_ownership debe lanzar 403 cuando el documento no pertenece al usuario"""
    user_id = uuid4()
    owner_id = uuid4()  # Diferente al user_id
    doc_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_document = Mock(spec=Document)
    mock_document.id = doc_id
    mock_document.user_id = owner_id

    # Mock del logging
    mock_log = Mock()
    monkeypatch.setattr("app.core.dependencies.log_ownership_validation", mock_log)

    with pytest.raises(HTTPException) as exc_info:
        verify_document_ownership(mock_document, mock_user)

    assert exc_info.value.status_code == 403
    assert "No tienes permiso" in exc_info.value.detail

    # Verificar que se llamó al log
    mock_log.assert_called_once()
    call_args = mock_log.call_args[1]
    assert call_args["resource_type"] == "document"
    assert call_args["status"] == "denied"


# ========================================
# TESTS PARA verify_summary_ownership()
# ========================================

def test_verify_summary_ownership_valid():
    """verify_summary_ownership debe retornar el resumen si pertenece al usuario"""
    user_id = uuid4()
    summary_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_summary = Mock(spec=Summary)
    mock_summary.id = summary_id
    mock_summary.user_id = user_id

    result = verify_summary_ownership(mock_summary, mock_user)

    assert result == mock_summary


def test_verify_summary_ownership_not_found():
    """verify_summary_ownership debe lanzar 404 cuando el resumen es None"""
    mock_user = Mock(spec=User)
    mock_user.id = uuid4()

    with pytest.raises(HTTPException) as exc_info:
        verify_summary_ownership(None, mock_user)

    assert exc_info.value.status_code == 404
    assert "no encontrado" in exc_info.value.detail


def test_verify_summary_ownership_forbidden(monkeypatch):
    """verify_summary_ownership debe lanzar 403 cuando el resumen no pertenece al usuario"""
    user_id = uuid4()
    owner_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_summary = Mock(spec=Summary)
    mock_summary.id = uuid4()
    mock_summary.user_id = owner_id

    # Mock del logging
    mock_log = Mock()
    monkeypatch.setattr("app.core.dependencies.log_ownership_validation", mock_log)

    with pytest.raises(HTTPException) as exc_info:
        verify_summary_ownership(mock_summary, mock_user)

    assert exc_info.value.status_code == 403
    assert "resumen" in exc_info.value.detail
    mock_log.assert_called_once()


# ========================================
# TESTS PARA verify_quiz_ownership()
# ========================================

def test_verify_quiz_ownership_valid():
    """verify_quiz_ownership debe retornar el quiz si pertenece al usuario"""
    user_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_quiz = Mock(spec=Quiz)
    mock_quiz.id = uuid4()
    mock_quiz.user_id = user_id

    result = verify_quiz_ownership(mock_quiz, mock_user)

    assert result == mock_quiz


def test_verify_quiz_ownership_not_found():
    """verify_quiz_ownership debe lanzar 404 cuando el quiz es None"""
    mock_user = Mock(spec=User)
    mock_user.id = uuid4()

    with pytest.raises(HTTPException) as exc_info:
        verify_quiz_ownership(None, mock_user)

    assert exc_info.value.status_code == 404
    assert "Quiz no encontrado" in exc_info.value.detail


def test_verify_quiz_ownership_forbidden(monkeypatch):
    """verify_quiz_ownership debe lanzar 403 cuando el quiz no pertenece al usuario"""
    user_id = uuid4()
    owner_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_quiz = Mock(spec=Quiz)
    mock_quiz.id = uuid4()
    mock_quiz.user_id = owner_id

    mock_log = Mock()
    monkeypatch.setattr("app.core.dependencies.log_ownership_validation", mock_log)

    with pytest.raises(HTTPException) as exc_info:
        verify_quiz_ownership(mock_quiz, mock_user)

    assert exc_info.value.status_code == 403
    assert "quiz" in exc_info.value.detail
    mock_log.assert_called_once()


# ========================================
# TESTS PARA verify_quiz_attempt_ownership()
# ========================================

def test_verify_quiz_attempt_ownership_valid():
    """verify_quiz_attempt_ownership debe retornar el intento si pertenece al usuario"""
    user_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_attempt = Mock(spec=QuizAttempt)
    mock_attempt.id = uuid4()
    mock_attempt.user_id = user_id

    result = verify_quiz_attempt_ownership(mock_attempt, mock_user)

    assert result == mock_attempt


def test_verify_quiz_attempt_ownership_not_found():
    """verify_quiz_attempt_ownership debe lanzar 404 cuando el intento es None"""
    mock_user = Mock(spec=User)
    mock_user.id = uuid4()

    with pytest.raises(HTTPException) as exc_info:
        verify_quiz_attempt_ownership(None, mock_user)

    assert exc_info.value.status_code == 404
    assert "Intento de quiz no encontrado" in exc_info.value.detail


def test_verify_quiz_attempt_ownership_forbidden(monkeypatch):
    """verify_quiz_attempt_ownership debe lanzar 403 cuando el intento no pertenece al usuario"""
    user_id = uuid4()
    owner_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_attempt = Mock(spec=QuizAttempt)
    mock_attempt.id = uuid4()
    mock_attempt.user_id = owner_id

    mock_log = Mock()
    monkeypatch.setattr("app.core.dependencies.log_ownership_validation", mock_log)

    with pytest.raises(HTTPException) as exc_info:
        verify_quiz_attempt_ownership(mock_attempt, mock_user)

    assert exc_info.value.status_code == 403
    assert "intento de quiz" in exc_info.value.detail
    mock_log.assert_called_once()


# ========================================
# TESTS PARA verify_space_ownership()
# ========================================

def test_verify_space_ownership_valid():
    """verify_space_ownership debe retornar el espacio si pertenece al usuario"""
    user_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_space = Mock(spec=StudySpace)
    mock_space.id = uuid4()
    mock_space.user_id = user_id

    result = verify_space_ownership(mock_space, mock_user)

    assert result == mock_space


def test_verify_space_ownership_not_found():
    """verify_space_ownership debe lanzar 404 cuando el espacio es None"""
    mock_user = Mock(spec=User)
    mock_user.id = uuid4()

    with pytest.raises(HTTPException) as exc_info:
        verify_space_ownership(None, mock_user)

    assert exc_info.value.status_code == 404
    assert "Espacio de estudio no encontrado" in exc_info.value.detail


def test_verify_space_ownership_forbidden(monkeypatch):
    """verify_space_ownership debe lanzar 403 cuando el espacio no pertenece al usuario"""
    user_id = uuid4()
    owner_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_space = Mock(spec=StudySpace)
    mock_space.id = uuid4()
    mock_space.user_id = owner_id

    mock_log = Mock()
    monkeypatch.setattr("app.core.dependencies.log_ownership_validation", mock_log)

    with pytest.raises(HTTPException) as exc_info:
        verify_space_ownership(mock_space, mock_user)

    assert exc_info.value.status_code == 403
    assert "espacio de estudio" in exc_info.value.detail
    mock_log.assert_called_once()
