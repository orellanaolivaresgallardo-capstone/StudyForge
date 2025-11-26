"""
Tests unitarios para StudySpaceService
"""
import pytest
from unittest.mock import Mock, patch
from fastapi import HTTPException
from app.services.study_space_service import StudySpaceService


def test_create_space_basic():
    """Crear espacio con parámetros básicos"""
    mock_db = Mock()
    mock_space = Mock()
    mock_space.id = "space-123"
    mock_space.name = "Mathematics"

    with patch('app.repositories.study_space_repository.StudySpaceRepository.create', return_value=mock_space):
        service = StudySpaceService()
        result = service.create_space(mock_db, "user-123", "Mathematics", "Desc", "#8B5CF6")

        assert result.name == "Mathematics"


def test_get_space_valid_owner():
    """Obtener espacio del usuario autenticado"""
    mock_db = Mock()
    mock_user = Mock()
    mock_user.id = "user-123"

    mock_space = Mock()
    mock_space.id = "space-123"
    mock_space.user_id = "user-123"

    with patch('app.repositories.study_space_repository.StudySpaceRepository.get_by_id', return_value=mock_space):
        service = StudySpaceService()
        result = service.get_space(mock_db, "space-123", mock_user)

        assert result == mock_space


def test_get_space_not_found():
    """Espacio no existe debe lanzar 404"""
    mock_db = Mock()
    mock_user = Mock()
    mock_user.id = "user-123"

    with patch('app.repositories.study_space_repository.StudySpaceRepository.get_by_id', return_value=None):
        service = StudySpaceService()

        with pytest.raises(HTTPException) as exc_info:
            service.get_space(mock_db, "space-123", mock_user)

        assert exc_info.value.status_code == 404


def test_get_space_wrong_owner():
    """Espacio de otro usuario debe lanzar 403"""
    mock_db = Mock()
    mock_user = Mock()
    mock_user.id = "user-123"

    mock_space = Mock()
    mock_space.id = "space-123"
    mock_space.user_id = "user-456"  # Otro usuario

    with patch('app.repositories.study_space_repository.StudySpaceRepository.get_by_id', return_value=mock_space):
        service = StudySpaceService()

        with pytest.raises(HTTPException) as exc_info:
            service.get_space(mock_db, "space-123", mock_user)

        assert exc_info.value.status_code == 403


def test_get_space_stats_basic_calculation():
    """Stats básicos se calculan correctamente"""
    mock_db = Mock()
    mock_user = Mock()
    mock_user.id = "user-123"

    mock_space = Mock()
    mock_space.id = "space-123"
    mock_space.user_id = "user-123"
    mock_space.documents = [Mock(), Mock()]  # 2 documentos
    mock_space.summaries = [Mock()]  # 1 resumen

    # Mock de query chain para quizzes
    mock_db.query.return_value.filter.return_value.all.return_value = []

    with patch('app.repositories.study_space_repository.StudySpaceRepository.get_by_id', return_value=mock_space):
        service = StudySpaceService()
        stats = service.get_space_stats(mock_db, "space-123", mock_user)

        assert stats['num_documents'] == 2
        assert stats['num_summaries'] == 1
        assert stats['num_quizzes'] == 0


def test_update_space_basic():
    """Actualizar espacio"""
    mock_db = Mock()
    mock_user = Mock()
    mock_user.id = "user-123"

    mock_space = Mock()
    mock_space.id = "space-123"
    mock_space.user_id = "user-123"
    mock_space.name = "Updated Name"

    with patch('app.repositories.study_space_repository.StudySpaceRepository.get_by_id', return_value=mock_space):
        with patch('app.repositories.study_space_repository.StudySpaceRepository.update', return_value=mock_space):
            service = StudySpaceService()
            result = service.update_space(mock_db, "space-123", mock_user, "Updated Name", None, None)

            assert result.name == "Updated Name"
