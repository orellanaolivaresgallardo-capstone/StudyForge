"""
Tests unitarios para AuthService
"""
import pytest
from uuid import uuid4
from unittest.mock import Mock, MagicMock, patch
from fastapi import HTTPException
from app.services.auth_service import AuthService
from app.models.user import User


# ========================================
# TESTS PARA register()
# ========================================

@patch('app.services.auth_service.UserRepository')
@patch('app.services.auth_service.hash_password')
@patch('app.services.auth_service.log_auth_event')
def test_register_successful(mock_log, mock_hash_password, mock_repo):
    """register debe crear un usuario exitosamente"""
    mock_db = MagicMock()
    email = "newuser@example.com"
    username = "newuser"
    password = "SecurePass123!"

    # Configurar mocks
    mock_repo.get_by_email.return_value = None
    mock_repo.get_by_username.return_value = None
    mock_hash_password.return_value = "hashed_password"

    mock_user = Mock(spec=User)
    mock_user.id = uuid4()
    mock_user.email = email
    mock_user.username = username
    mock_repo.create.return_value = mock_user

    # Ejecutar
    result = AuthService.register(mock_db, email, username, password)

    # Verificar
    assert result == mock_user
    mock_repo.get_by_email.assert_called_once_with(mock_db, email)
    mock_repo.get_by_username.assert_called_once_with(mock_db, username)
    mock_hash_password.assert_called_once_with(password)
    mock_repo.create.assert_called_once_with(mock_db, email, username, "hashed_password")
    mock_log.assert_called_once()


@patch('app.services.auth_service.UserRepository')
@patch('app.services.auth_service.log_auth_event')
def test_register_email_already_exists(mock_log, mock_repo):
    """register debe lanzar 400 si el email ya existe"""
    mock_db = MagicMock()

    # Email ya existe
    existing_user = Mock(spec=User)
    existing_user.email = "existing@example.com"
    mock_repo.get_by_email.return_value = existing_user

    with pytest.raises(HTTPException) as exc_info:
        AuthService.register(mock_db, "existing@example.com", "newuser", "pass123")

    assert exc_info.value.status_code == 400
    assert "ya está registrado" in exc_info.value.detail
    mock_log.assert_called_once_with(
        "register",
        email="existing@example.com",
        status="failed",
        message="Email already registered"
    )


@patch('app.services.auth_service.UserRepository')
@patch('app.services.auth_service.log_auth_event')
def test_register_username_already_exists(mock_log, mock_repo):
    """register debe lanzar 400 si el username ya existe"""
    mock_db = MagicMock()

    # Email no existe, pero username sí
    mock_repo.get_by_email.return_value = None

    existing_user = Mock(spec=User)
    existing_user.username = "existinguser"
    mock_repo.get_by_username.return_value = existing_user

    with pytest.raises(HTTPException) as exc_info:
        AuthService.register(mock_db, "new@example.com", "existinguser", "pass123")

    assert exc_info.value.status_code == 400
    assert "ya está en uso" in exc_info.value.detail
    mock_log.assert_called_once()


# ========================================
# TESTS PARA login()
# ========================================

@patch('app.services.auth_service.UserRepository')
@patch('app.services.auth_service.verify_password')
@patch('app.services.auth_service.create_access_token')
@patch('app.services.auth_service.log_auth_event')
def test_login_successful(mock_log, mock_create_token, mock_verify, mock_repo):
    """login debe retornar un token JWT cuando las credenciales son válidas"""
    mock_db = MagicMock()
    email = "user@example.com"
    password = "correct_password"

    # Usuario existe y está activo
    mock_user = Mock(spec=User)
    mock_user.id = uuid4()
    mock_user.email = email
    mock_user.hashed_password = "hashed_password"
    mock_user.is_active = True
    mock_repo.get_by_email.return_value = mock_user

    # Password es correcto
    mock_verify.return_value = True

    # Token generado
    mock_create_token.return_value = "fake_jwt_token"

    # Ejecutar
    result = AuthService.login(mock_db, email, password)

    # Verificar
    assert result == "fake_jwt_token"
    mock_repo.get_by_email.assert_called_once_with(mock_db, email)
    mock_verify.assert_called_once_with(password, "hashed_password")
    mock_create_token.assert_called_once_with(data={"sub": str(mock_user.id)})
    mock_log.assert_called_once_with(
        "login",
        email=email,
        user_id=str(mock_user.id),
        status="success"
    )


@patch('app.services.auth_service.UserRepository')
@patch('app.services.auth_service.log_auth_event')
def test_login_user_not_found(mock_log, mock_repo):
    """login debe lanzar 401 cuando el usuario no existe"""
    mock_db = MagicMock()
    email = "nonexistent@example.com"

    mock_repo.get_by_email.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        AuthService.login(mock_db, email, "password")

    assert exc_info.value.status_code == 401
    assert "Credenciales inválidas" in exc_info.value.detail
    assert exc_info.value.headers == {"WWW-Authenticate": "Bearer"}
    mock_log.assert_called_once_with(
        "login",
        email=email,
        status="failed",
        message="User not found"
    )


@patch('app.services.auth_service.UserRepository')
@patch('app.services.auth_service.verify_password')
@patch('app.services.auth_service.log_auth_event')
def test_login_invalid_password(mock_log, mock_verify, mock_repo):
    """login debe lanzar 401 cuando la contraseña es incorrecta"""
    mock_db = MagicMock()
    email = "user@example.com"
    password = "wrong_password"

    mock_user = Mock(spec=User)
    mock_user.id = uuid4()
    mock_user.email = email
    mock_user.hashed_password = "hashed_password"
    mock_repo.get_by_email.return_value = mock_user

    # Password incorrecto
    mock_verify.return_value = False

    with pytest.raises(HTTPException) as exc_info:
        AuthService.login(mock_db, email, password)

    assert exc_info.value.status_code == 401
    assert "Credenciales inválidas" in exc_info.value.detail
    mock_log.assert_called_once_with(
        "login",
        email=email,
        user_id=str(mock_user.id),
        status="failed",
        message="Invalid password"
    )


@patch('app.services.auth_service.UserRepository')
@patch('app.services.auth_service.verify_password')
@patch('app.services.auth_service.log_auth_event')
def test_login_inactive_user(mock_log, mock_verify, mock_repo):
    """login debe lanzar 403 cuando el usuario está inactivo"""
    mock_db = MagicMock()
    email = "inactive@example.com"

    mock_user = Mock(spec=User)
    mock_user.id = uuid4()
    mock_user.email = email
    mock_user.hashed_password = "hashed_password"
    mock_user.is_active = False  # Usuario inactivo
    mock_repo.get_by_email.return_value = mock_user

    mock_verify.return_value = True  # Password correcto

    with pytest.raises(HTTPException) as exc_info:
        AuthService.login(mock_db, email, "password")

    assert exc_info.value.status_code == 403
    assert "inactivo" in exc_info.value.detail
    mock_log.assert_called_once_with(
        "login",
        email=email,
        user_id=str(mock_user.id),
        status="failed",
        message="Inactive user"
    )


# ========================================
# TESTS PARA get_user_by_id()
# ========================================

@patch('app.services.auth_service.UserRepository')
def test_get_user_by_id_found(mock_repo):
    """get_user_by_id debe retornar el usuario cuando existe"""
    mock_db = MagicMock()
    user_id = str(uuid4())

    mock_user = Mock(spec=User)
    mock_user.id = user_id
    mock_repo.get_by_id.return_value = mock_user

    result = AuthService.get_user_by_id(mock_db, user_id)

    assert result == mock_user
    mock_repo.get_by_id.assert_called_once_with(mock_db, user_id)


@patch('app.services.auth_service.UserRepository')
def test_get_user_by_id_not_found(mock_repo):
    """get_user_by_id debe retornar None cuando no existe"""
    mock_db = MagicMock()
    user_id = str(uuid4())

    mock_repo.get_by_id.return_value = None

    result = AuthService.get_user_by_id(mock_db, user_id)

    assert result is None


# ========================================
# TESTS DE INTEGRACIÓN
# ========================================

@patch('app.services.auth_service.UserRepository')
@patch('app.services.auth_service.hash_password')
@patch('app.services.auth_service.verify_password')
@patch('app.services.auth_service.create_access_token')
@patch('app.services.auth_service.log_auth_event')
def test_register_then_login_flow(mock_log, mock_token, mock_verify, mock_hash, mock_repo):
    """Flujo completo: registrar usuario y luego hacer login"""
    mock_db = MagicMock()
    email = "test@example.com"
    username = "testuser"
    password = "SecurePass123!"

    # 1. Register
    mock_repo.get_by_email.return_value = None
    mock_repo.get_by_username.return_value = None
    mock_hash.return_value = "hashed_password"

    mock_user = Mock(spec=User)
    mock_user.id = uuid4()
    mock_user.email = email
    mock_user.username = username
    mock_user.hashed_password = "hashed_password"
    mock_user.is_active = True
    mock_repo.create.return_value = mock_user

    registered_user = AuthService.register(mock_db, email, username, password)
    assert registered_user.email == email

    # 2. Login
    mock_repo.get_by_email.return_value = mock_user
    mock_verify.return_value = True
    mock_token.return_value = "jwt_token"

    token = AuthService.login(mock_db, email, password)
    assert token == "jwt_token"

    # Verificar que se loguearon ambos eventos
    assert mock_log.call_count == 2


@patch('app.services.auth_service.UserRepository')
@patch('app.services.auth_service.hash_password')
@patch('app.services.auth_service.log_auth_event')
def test_register_with_weak_password_still_hashes(mock_log, mock_hash, mock_repo):
    """register debe hashear incluso contraseñas débiles (validación es del frontend)"""
    mock_db = MagicMock()

    mock_repo.get_by_email.return_value = None
    mock_repo.get_by_username.return_value = None
    mock_hash.return_value = "hashed_weak_password"

    mock_user = Mock(spec=User)
    mock_repo.create.return_value = mock_user

    # Contraseña débil (validación debería ser en frontend/schema)
    AuthService.register(mock_db, "user@example.com", "user", "123")

    # Aún así debe hashear
    mock_hash.assert_called_once_with("123")


@patch('app.services.auth_service.UserRepository')
@patch('app.services.auth_service.verify_password')
@patch('app.services.auth_service.log_auth_event')
def test_login_case_sensitive_email(mock_log, mock_verify, mock_repo):
    """login debe ser case-sensitive en el email según implementación"""
    mock_db = MagicMock()

    mock_repo.get_by_email.return_value = None

    # Intentar login con mayúsculas
    with pytest.raises(HTTPException):
        AuthService.login(mock_db, "USER@EXAMPLE.COM", "password")

    # Debe buscar exactamente como se pasó
    mock_repo.get_by_email.assert_called_with(mock_db, "USER@EXAMPLE.COM")
