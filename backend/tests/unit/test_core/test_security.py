"""
Tests unitarios para módulo de seguridad
"""
import pytest
from datetime import timedelta, datetime, timezone
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token


def test_hash_password_returns_string():
    """Hash debe retornar un string"""
    hashed = hash_password("mypassword123")

    assert isinstance(hashed, str)
    assert len(hashed) > 50  # Argon2 hashes son largos


def test_hash_password_not_equal_to_input():
    """Hash no debe ser igual al password original"""
    password = "mypassword123"
    hashed = hash_password(password)

    assert hashed != password


def test_hash_password_different_for_same_input():
    """Dos hashes del mismo password deben ser diferentes (salt aleatorio)"""
    password = "mypassword123"
    hash1 = hash_password(password)
    hash2 = hash_password(password)

    assert hash1 != hash2


def test_verify_password_correct():
    """Verificar password correcto retorna True"""
    password = "mypassword123"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True


def test_verify_password_incorrect():
    """Verificar password incorrecto retorna False"""
    password = "mypassword123"
    hashed = hash_password(password)

    assert verify_password("wrongpassword", hashed) is False


def test_verify_password_with_special_characters():
    """Passwords con caracteres especiales"""
    password = "p@ssw0rd!#$%"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True
    assert verify_password("p@ssw0rd!#$", hashed) is False


def test_verify_password_empty_string():
    """Password vacío debe funcionar"""
    password = ""
    hashed = hash_password(password)

    assert verify_password("", hashed) is True
    assert verify_password("notempty", hashed) is False


# Tests para JWT functions

def test_create_access_token_with_custom_expiration():
    """Crear token con expiración personalizada"""
    data = {"user_id": "test-user-123"}
    expires_delta = timedelta(hours=2)

    token = create_access_token(data, expires_delta)

    assert isinstance(token, str)
    assert len(token) > 50  # JWT tokens son largos


def test_create_access_token_with_default_expiration():
    """Crear token con expiración por defecto"""
    data = {"user_id": "test-user-456"}

    token = create_access_token(data)

    assert isinstance(token, str)
    assert len(token) > 50


def test_create_access_token_encodes_data():
    """Token debe contener los datos codificados"""
    data = {"user_id": "test-user-789", "role": "admin"}

    token = create_access_token(data)
    decoded = decode_access_token(token)

    assert decoded is not None
    assert decoded["user_id"] == "test-user-789"
    assert decoded["role"] == "admin"
    assert "exp" in decoded  # Debe incluir expiración


def test_decode_access_token_valid():
    """Decodificar token válido retorna payload"""
    data = {"user_id": "test-user-decode", "email": "test@example.com"}
    token = create_access_token(data)

    decoded = decode_access_token(token)

    assert decoded is not None
    assert decoded["user_id"] == "test-user-decode"
    assert decoded["email"] == "test@example.com"


def test_decode_access_token_invalid():
    """Decodificar token inválido retorna None"""
    invalid_token = "this.is.not.a.valid.jwt.token"

    decoded = decode_access_token(invalid_token)

    assert decoded is None


def test_decode_access_token_malformed():
    """Token mal formado retorna None"""
    malformed_token = "malformed_token_without_dots"

    decoded = decode_access_token(malformed_token)

    assert decoded is None


def test_decode_access_token_empty():
    """Token vacío retorna None"""
    decoded = decode_access_token("")

    assert decoded is None


def test_create_and_decode_token_roundtrip():
    """Roundtrip: crear y decodificar token"""
    data = {
        "user_id": "roundtrip-user",
        "username": "testuser",
        "roles": ["user", "admin"]
    }

    token = create_access_token(data, expires_delta=timedelta(minutes=30))
    decoded = decode_access_token(token)

    assert decoded is not None
    assert decoded["user_id"] == "roundtrip-user"
    assert decoded["username"] == "testuser"
    assert decoded["roles"] == ["user", "admin"]

    # Verificar que la expiración está en el futuro
    exp_timestamp = decoded["exp"]
    assert exp_timestamp > datetime.now(timezone.utc).timestamp()
