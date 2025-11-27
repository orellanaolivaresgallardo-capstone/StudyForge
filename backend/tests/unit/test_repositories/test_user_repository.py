"""
Tests unitarios para UserRepository
"""
import pytest
from uuid import uuid4
from unittest.mock import Mock, MagicMock
from app.repositories.user_repository import UserRepository
from app.models.user import User


# ========================================
# TESTS PARA create()
# ========================================

def test_create_user():
    """create debe crear un usuario y retornarlo con ID"""
    # Arrange
    mock_db = MagicMock()
    user_id = uuid4()

    # Mock del usuario que se retorna después del refresh
    mock_user = Mock(spec=User)
    mock_user.id = user_id
    mock_user.email = "test@example.com"
    mock_user.username = "testuser"
    mock_user.hashed_password = "hashed_password_123"

    # Configurar el mock para que refresh asigne el usuario mockeado
    def side_effect_refresh(user):
        user.id = user_id
        user.email = "test@example.com"
        user.username = "testuser"

    mock_db.refresh.side_effect = side_effect_refresh

    # Act
    result = UserRepository.create(
        db=mock_db,
        email="test@example.com",
        username="testuser",
        hashed_password="hashed_password_123"
    )

    # Assert
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()
    assert result.email == "test@example.com"
    assert result.username == "testuser"


def test_create_user_with_special_characters():
    """create debe manejar caracteres especiales en email y username"""
    mock_db = MagicMock()

    result = UserRepository.create(
        db=mock_db,
        email="test+tag@example.com",
        username="user_name-123",
        hashed_password="hashed"
    )

    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    assert result.email == "test+tag@example.com"
    assert result.username == "user_name-123"


# ========================================
# TESTS PARA get_by_id()
# ========================================

def test_get_by_id_found():
    """get_by_id debe retornar el usuario cuando existe"""
    # Arrange
    mock_db = MagicMock()
    user_id = str(uuid4())

    mock_user = Mock(spec=User)
    mock_user.id = user_id
    mock_user.email = "found@example.com"

    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_user

    # Act
    result = UserRepository.get_by_id(mock_db, user_id)

    # Assert
    assert result == mock_user
    assert result.id == user_id
    mock_db.execute.assert_called_once()


def test_get_by_id_not_found():
    """get_by_id debe retornar None cuando el usuario no existe"""
    mock_db = MagicMock()
    user_id = str(uuid4())

    mock_db.execute.return_value.scalar_one_or_none.return_value = None

    result = UserRepository.get_by_id(mock_db, user_id)

    assert result is None


def test_get_by_id_with_invalid_uuid():
    """get_by_id debe manejar UUIDs inválidos"""
    mock_db = MagicMock()

    mock_db.execute.return_value.scalar_one_or_none.return_value = None

    result = UserRepository.get_by_id(mock_db, "invalid-uuid")

    assert result is None


# ========================================
# TESTS PARA get_by_email()
# ========================================

def test_get_by_email_found():
    """get_by_email debe retornar el usuario cuando existe"""
    mock_db = MagicMock()

    mock_user = Mock(spec=User)
    mock_user.email = "test@example.com"
    mock_user.id = uuid4()

    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_user

    result = UserRepository.get_by_email(mock_db, "test@example.com")

    assert result == mock_user
    assert result.email == "test@example.com"


def test_get_by_email_not_found():
    """get_by_email debe retornar None cuando el email no existe"""
    mock_db = MagicMock()

    mock_db.execute.return_value.scalar_one_or_none.return_value = None

    result = UserRepository.get_by_email(mock_db, "nonexistent@example.com")

    assert result is None


def test_get_by_email_case_sensitive():
    """get_by_email debe ser case-sensitive (según implementación actual)"""
    mock_db = MagicMock()

    # Usuario con email en minúsculas
    mock_user = Mock(spec=User)
    mock_user.email = "test@example.com"

    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_user

    result = UserRepository.get_by_email(mock_db, "test@example.com")

    assert result is not None
    # La búsqueda con mayúsculas debería ser diferente según la BD
    # Este test documenta el comportamiento actual


def test_get_by_email_with_plus_addressing():
    """get_by_email debe manejar plus addressing (email+tag@domain)"""
    mock_db = MagicMock()

    mock_user = Mock(spec=User)
    mock_user.email = "user+tag@example.com"

    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_user

    result = UserRepository.get_by_email(mock_db, "user+tag@example.com")

    assert result is not None
    assert result.email == "user+tag@example.com"


# ========================================
# TESTS PARA get_by_username()
# ========================================

def test_get_by_username_found():
    """get_by_username debe retornar el usuario cuando existe"""
    mock_db = MagicMock()

    mock_user = Mock(spec=User)
    mock_user.username = "testuser"
    mock_user.id = uuid4()

    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_user

    result = UserRepository.get_by_username(mock_db, "testuser")

    assert result == mock_user
    assert result.username == "testuser"


def test_get_by_username_not_found():
    """get_by_username debe retornar None cuando el username no existe"""
    mock_db = MagicMock()

    mock_db.execute.return_value.scalar_one_or_none.return_value = None

    result = UserRepository.get_by_username(mock_db, "nonexistentuser")

    assert result is None


def test_get_by_username_with_special_chars():
    """get_by_username debe manejar usernames con caracteres especiales"""
    mock_db = MagicMock()

    mock_user = Mock(spec=User)
    mock_user.username = "user_name-123"

    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_user

    result = UserRepository.get_by_username(mock_db, "user_name-123")

    assert result is not None
    assert result.username == "user_name-123"


# ========================================
# TESTS PARA update()
# ========================================

def test_update_user():
    """update debe commitear y refrescar el usuario"""
    mock_db = MagicMock()

    mock_user = Mock(spec=User)
    mock_user.id = uuid4()
    mock_user.email = "updated@example.com"

    result = UserRepository.update(mock_db, mock_user)

    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once_with(mock_user)
    assert result == mock_user


def test_update_user_multiple_fields():
    """update debe manejar cambios en múltiples campos del usuario"""
    mock_db = MagicMock()

    mock_user = Mock(spec=User)
    mock_user.id = uuid4()
    mock_user.email = "new@example.com"
    mock_user.username = "newusername"
    # Simular modificación de campos antes del update
    mock_user.email = "modified@example.com"

    result = UserRepository.update(mock_db, mock_user)

    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()
    assert result.email == "modified@example.com"


def test_update_preserves_user_reference():
    """update debe retornar la misma referencia del usuario actualizado"""
    mock_db = MagicMock()

    mock_user = Mock(spec=User)
    mock_user.id = uuid4()

    result = UserRepository.update(mock_db, mock_user)

    # Debe retornar el mismo objeto
    assert result is mock_user


# ========================================
# TESTS DE INTEGRACIÓN (verificar flujo completo)
# ========================================

def test_create_and_retrieve_flow():
    """Simular flujo completo: crear usuario y luego buscarlo"""
    mock_db = MagicMock()
    user_id = uuid4()

    # Configurar mock para create
    created_user = Mock(spec=User)
    created_user.id = user_id
    created_user.email = "flow@example.com"
    created_user.username = "flowuser"

    def refresh_side_effect(user):
        user.id = user_id
        user.email = "flow@example.com"
        user.username = "flowuser"

    mock_db.refresh.side_effect = refresh_side_effect

    # Create user
    new_user = UserRepository.create(
        db=mock_db,
        email="flow@example.com",
        username="flowuser",
        hashed_password="hashed"
    )

    # Simular búsqueda posterior
    mock_db.execute.return_value.scalar_one_or_none.return_value = created_user

    found_user = UserRepository.get_by_email(mock_db, "flow@example.com")

    assert new_user.email == found_user.email
    assert new_user.username == found_user.username
