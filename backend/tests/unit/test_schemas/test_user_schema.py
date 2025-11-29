"""
Tests unitarios para User Pydantic schemas
"""
import pytest
from app.schemas.user import UserDetailResponse


def test_user_response_storage_available_bytes():
    """storage_available_bytes debe calcular espacio disponible correctamente"""
    user = UserDetailResponse(
        id="550e8400-e29b-41d4-a716-446655440000",
        username="testuser",
        email="test@example.com",
        storage_quota_bytes=1000000,
        storage_used_bytes=400000,
        max_documents_per_summary=2,
        max_file_size_bytes=5000000,
        is_active=True,
        created_at="2025-01-01T00:00:00",
        updated_at="2025-01-01T00:00:00"
    )

    # Debería retornar quota - used = 1000000 - 400000 = 600000
    assert user.storage_available_bytes == 600000


def test_user_response_storage_available_bytes_negative():
    """storage_available_bytes debe retornar 0 si used > quota"""
    user = UserDetailResponse(
        id="550e8400-e29b-41d4-a716-446655440000",
        username="testuser",
        email="test@example.com",
        storage_quota_bytes=1000000,
        storage_used_bytes=1200000,  # Excede quota
        max_documents_per_summary=2,
        max_file_size_bytes=5000000,
        is_active=True,
        created_at="2025-01-01T00:00:00",
        updated_at="2025-01-01T00:00:00"
    )

    # max(0, 1000000 - 1200000) = max(0, -200000) = 0
    assert user.storage_available_bytes == 0


def test_user_response_storage_usage_percentage_zero_quota():
    """storage_usage_percentage debe retornar 0 si quota es 0"""
    user = UserDetailResponse(
        id="550e8400-e29b-41d4-a716-446655440000",
        username="testuser",
        email="test@example.com",
        storage_quota_bytes=0,  # Quota cero
        storage_used_bytes=0,
        max_documents_per_summary=2,
        max_file_size_bytes=5000000,
        is_active=True,
        created_at="2025-01-01T00:00:00",
        updated_at="2025-01-01T00:00:00"
    )

    # Cuando quota es 0, debe retornar 0.0 para evitar división por cero
    assert user.storage_usage_percentage == 0.0


def test_user_response_storage_usage_percentage_normal():
    """storage_usage_percentage debe calcular porcentaje correctamente"""
    user = UserDetailResponse(
        id="550e8400-e29b-41d4-a716-446655440000",
        username="testuser",
        email="test@example.com",
        storage_quota_bytes=1000000,
        storage_used_bytes=250000,  # 25% usado
        max_documents_per_summary=2,
        max_file_size_bytes=5000000,
        is_active=True,
        created_at="2025-01-01T00:00:00",
        updated_at="2025-01-01T00:00:00"
    )

    # (250000 / 1000000) * 100 = 25.0
    assert user.storage_usage_percentage == 25.0


def test_user_response_storage_usage_percentage_full():
    """storage_usage_percentage debe retornar 100 cuando está lleno"""
    user = UserDetailResponse(
        id="550e8400-e29b-41d4-a716-446655440000",
        username="testuser",
        email="test@example.com",
        storage_quota_bytes=1000000,
        storage_used_bytes=1000000,  # 100% usado
        max_documents_per_summary=2,
        max_file_size_bytes=5000000,
        is_active=True,
        created_at="2025-01-01T00:00:00",
        updated_at="2025-01-01T00:00:00"
    )

    # (1000000 / 1000000) * 100 = 100.0
    assert user.storage_usage_percentage == 100.0
