"""
Tests unitarios para User ORM model
"""
import pytest
from uuid import uuid4
from app.models.user import User


def test_user_repr():
    """__repr__ debe retornar representación legible del usuario"""
    user = User(
        id=uuid4(),
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password",
        storage_quota_bytes=1000000,
        storage_used_bytes=500000,
        max_documents_per_summary=2,
        max_file_size_bytes=5000000
    )

    # __repr__ debe contener username y email
    repr_str = repr(user)
    assert "testuser" in repr_str
    assert "test@example.com" in repr_str
    assert repr_str.startswith("<User ")


def test_user_storage_available_bytes():
    """storage_available_bytes debe calcular espacio disponible correctamente"""
    user = User(
        id=uuid4(),
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password",
        storage_quota_bytes=1000000,
        storage_used_bytes=400000,
        max_documents_per_summary=2,
        max_file_size_bytes=5000000
    )

    # quota - used = 1000000 - 400000 = 600000
    assert user.storage_available_bytes == 600000


def test_user_storage_available_bytes_negative():
    """storage_available_bytes debe retornar 0 si used > quota"""
    user = User(
        id=uuid4(),
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password",
        storage_quota_bytes=1000000,
        storage_used_bytes=1200000,  # Excede quota
        max_documents_per_summary=2,
        max_file_size_bytes=5000000
    )

    # max(0, 1000000 - 1200000) = 0
    assert user.storage_available_bytes == 0


def test_user_storage_usage_percentage_zero_quota():
    """storage_usage_percentage debe retornar 0 si quota es 0"""
    user = User(
        id=uuid4(),
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password",
        storage_quota_bytes=0,  # Quota cero
        storage_used_bytes=0,
        max_documents_per_summary=2,
        max_file_size_bytes=5000000
    )

    # Cuando quota es 0, debe retornar 0.0 para evitar división por cero
    assert user.storage_usage_percentage == 0.0


def test_user_storage_usage_percentage_normal():
    """storage_usage_percentage debe calcular porcentaje correctamente"""
    user = User(
        id=uuid4(),
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password",
        storage_quota_bytes=1000000,
        storage_used_bytes=250000,  # 25% usado
        max_documents_per_summary=2,
        max_file_size_bytes=5000000
    )

    # (250000 / 1000000) * 100 = 25.0
    assert user.storage_usage_percentage == 25.0


def test_user_storage_usage_percentage_full():
    """storage_usage_percentage debe retornar 100 cuando está lleno"""
    user = User(
        id=uuid4(),
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password",
        storage_quota_bytes=1000000,
        storage_used_bytes=1000000,  # 100% usado
        max_documents_per_summary=2,
        max_file_size_bytes=5000000
    )

    # (1000000 / 1000000) * 100 = 100.0
    assert user.storage_usage_percentage == 100.0
