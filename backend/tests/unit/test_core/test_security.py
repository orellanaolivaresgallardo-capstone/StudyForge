"""
Tests unitarios para módulo de seguridad
"""
import pytest
from app.core.security import hash_password, verify_password


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
