"""
Tests unitarios para auth router
"""
import pytest
from unittest.mock import Mock, patch
from uuid import uuid4
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.user import UserCreate, UserLogin


@pytest.fixture
def client():
    """Cliente de prueba"""
    return TestClient(app)


@pytest.fixture
def fake_user():
    """Usuario fake para tests"""
    user = Mock()
    user.id = uuid4()
    user.email = "test@example.com"
    user.username = "testuser"
    user.is_active = True
    user.created_at = datetime.now(timezone.utc)
    user.updated_at = datetime.now(timezone.utc)
    user.storage_quota_bytes = 5368709120
    user.storage_used_bytes = 0
    user.max_documents_per_summary = 5
    user.max_file_size_bytes = 104857600
    return user


# Tests para /auth/register

@patch('app.routers.auth.AuthService.register')
def test_register_success(mock_register, client, fake_user):
    """Debe registrar usuario exitosamente"""
    mock_register.return_value = fake_user

    user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "SecurePass123!"
    }

    response = client.post("/auth/register", json=user_data)

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"

    # Verificar que se llamó al servicio con los datos correctos
    mock_register.assert_called_once()
    call_kwargs = mock_register.call_args.kwargs
    assert call_kwargs["email"] == "test@example.com"
    assert call_kwargs["username"] == "testuser"
    assert call_kwargs["password"] == "SecurePass123!"


@patch('app.routers.auth.AuthService.register')
def test_register_duplicate_email(mock_register, client):
    """Debe fallar si el email ya existe"""
    from fastapi import HTTPException

    # Simular que el servicio lanza una excepción
    mock_register.side_effect = HTTPException(
        status_code=400,
        detail="Email already registered"
    )

    user_data = {
        "email": "existing@example.com",
        "username": "newuser",
        "password": "SecurePass123!"
    }

    response = client.post("/auth/register", json=user_data)

    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


@patch('app.routers.auth.AuthService.register')
def test_register_invalid_data(mock_register, client):
    """Debe fallar con datos inválidos"""
    # Email inválido
    user_data = {
        "email": "not-an-email",
        "username": "testuser",
        "password": "SecurePass123!"
    }

    response = client.post("/auth/register", json=user_data)

    # Pydantic valida antes de llegar al router
    assert response.status_code == 422


@patch('app.routers.auth.AuthService.register')
def test_register_missing_fields(mock_register, client):
    """Debe fallar si faltan campos requeridos"""
    user_data = {
        "email": "test@example.com"
        # Falta username y password
    }

    response = client.post("/auth/register", json=user_data)

    assert response.status_code == 422


# Tests para /auth/login

@patch('app.routers.auth.AuthService.login')
def test_login_success(mock_login, client):
    """Debe hacer login exitosamente y retornar token"""
    mock_login.return_value = "fake_jwt_token_here"

    credentials = {
        "email": "test@example.com",
        "password": "SecurePass123!"
    }

    response = client.post("/auth/login", json=credentials)

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["access_token"] == "fake_jwt_token_here"

    # Verificar que se llamó al servicio
    mock_login.assert_called_once()
    call_kwargs = mock_login.call_args.kwargs
    assert call_kwargs["email"] == "test@example.com"
    assert call_kwargs["password"] == "SecurePass123!"


@patch('app.routers.auth.AuthService.login')
def test_login_invalid_credentials(mock_login, client):
    """Debe fallar con credenciales inválidas"""
    from fastapi import HTTPException

    mock_login.side_effect = HTTPException(
        status_code=401,
        detail="Invalid credentials"
    )

    credentials = {
        "email": "test@example.com",
        "password": "WrongPassword"
    }

    response = client.post("/auth/login", json=credentials)

    assert response.status_code == 401
    assert "credentials" in response.json()["detail"].lower()


@patch('app.routers.auth.AuthService.login')
def test_login_nonexistent_user(mock_login, client):
    """Debe fallar si el usuario no existe"""
    from fastapi import HTTPException

    mock_login.side_effect = HTTPException(
        status_code=401,
        detail="User not found"
    )

    credentials = {
        "email": "nonexistent@example.com",
        "password": "AnyPassword123!"
    }

    response = client.post("/auth/login", json=credentials)

    assert response.status_code == 401


@patch('app.routers.auth.AuthService.login')
def test_login_missing_fields(mock_login, client):
    """Debe fallar si faltan campos"""
    credentials = {
        "email": "test@example.com"
        # Falta password
    }

    response = client.post("/auth/login", json=credentials)

    assert response.status_code == 422


@patch('app.routers.auth.AuthService.login')
def test_login_invalid_email_format(mock_login, client):
    """Debe fallar con formato de email inválido"""
    credentials = {
        "email": "not-an-email",
        "password": "AnyPassword123!"
    }

    response = client.post("/auth/login", json=credentials)

    # Pydantic valida el formato
    assert response.status_code == 422
