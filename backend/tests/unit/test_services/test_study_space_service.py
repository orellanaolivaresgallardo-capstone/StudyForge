"""
Tests unitarios para StudySpaceService
"""
import pytest
from uuid import uuid4
from unittest.mock import Mock, MagicMock, patch
from fastapi import HTTPException
from app.services.study_space_service import StudySpaceService
from app.models.study_space import StudySpace
from app.models.user import User
from app.models.summary import Summary
from app.models.document import Document
from app.models.quiz import Quiz
from app.models.quiz_attempt import QuizAttempt


# ========================================
# TESTS PARA create_space()
# ========================================

@patch('app.services.study_space_service.StudySpaceRepository')
def test_create_space_basic(mock_space_repo):
    """Crear espacio con parámetros básicos"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_space = Mock(spec=StudySpace)
    mock_space.id = uuid4()
    mock_space.name = "Mathematics"
    mock_space_repo.create.return_value = mock_space

    service = StudySpaceService()
    result = service.create_space(
        db=mock_db,
        user_id=user_id,
        name="Mathematics",
        description="Math Description",
        color="#8B5CF6"
    )

    assert result == mock_space
    mock_space_repo.create.assert_called_once_with(
        mock_db, user_id, "Mathematics", "Math Description", "#8B5CF6"
    )


@patch('app.services.study_space_service.StudySpaceRepository')
def test_create_space_default_color(mock_space_repo):
    """create_space debe usar color por defecto si no se especifica"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_space = Mock(spec=StudySpace)
    mock_space_repo.create.return_value = mock_space

    service = StudySpaceService()
    service.create_space(mock_db, user_id, "Space")

    # Verify default color was used
    call_args = mock_space_repo.create.call_args
    assert call_args[0][4] == "#8B5CF6"  # Default purple color


# ========================================
# TESTS PARA get_spaces()
# ========================================

@patch('app.services.study_space_service.StudySpaceRepository')
def test_get_spaces(mock_space_repo):
    """get_spaces debe retornar lista de espacios con paginación"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_spaces = [
        Mock(spec=StudySpace, id=uuid4(), name="Space 1"),
        Mock(spec=StudySpace, id=uuid4(), name="Space 2"),
    ]

    mock_space_repo.get_by_user.return_value = mock_spaces
    mock_space_repo.count_by_user.return_value = 5

    service = StudySpaceService()
    spaces, total = service.get_spaces(mock_db, user_id, skip=0, limit=2)

    assert len(spaces) == 2
    assert total == 5
    mock_space_repo.get_by_user.assert_called_once_with(mock_db, user_id, 0, 2)
    mock_space_repo.count_by_user.assert_called_once_with(mock_db, user_id)


# ========================================
# TESTS PARA get_space()
# ========================================

@patch('app.services.study_space_service.StudySpaceRepository')
def test_get_space_valid_owner(mock_space_repo):
    """Obtener espacio del usuario autenticado"""
    mock_db = MagicMock()
    space_id = uuid4()
    user_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_space = Mock(spec=StudySpace)
    mock_space.id = space_id
    mock_space.user_id = user_id
    mock_space_repo.get_by_id.return_value = mock_space

    service = StudySpaceService()
    result = service.get_space(mock_db, space_id, mock_user)

    assert result == mock_space
    mock_space_repo.get_by_id.assert_called_once_with(mock_db, space_id)


@patch('app.services.study_space_service.StudySpaceRepository')
def test_get_space_not_found(mock_space_repo):
    """Espacio no existe debe lanzar 404"""
    mock_db = MagicMock()
    space_id = uuid4()
    mock_user = Mock(spec=User)

    mock_space_repo.get_by_id.return_value = None

    service = StudySpaceService()

    with pytest.raises(HTTPException) as exc_info:
        service.get_space(mock_db, space_id, mock_user)

    assert exc_info.value.status_code == 404
    assert "not found" in exc_info.value.detail


@patch('app.services.study_space_service.StudySpaceRepository')
def test_get_space_wrong_owner(mock_space_repo):
    """Espacio de otro usuario debe lanzar 403"""
    mock_db = MagicMock()
    space_id = uuid4()
    user_id = uuid4()
    different_user_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_space = Mock(spec=StudySpace)
    mock_space.user_id = different_user_id  # Different owner
    mock_space_repo.get_by_id.return_value = mock_space

    service = StudySpaceService()

    with pytest.raises(HTTPException) as exc_info:
        service.get_space(mock_db, space_id, mock_user)

    assert exc_info.value.status_code == 403
    assert "Not authorized" in exc_info.value.detail


# ========================================
# TESTS PARA update_space()
# ========================================

@patch('app.services.study_space_service.StudySpaceRepository')
def test_update_space_basic(mock_space_repo):
    """Actualizar espacio correctamente"""
    mock_db = MagicMock()
    space_id = uuid4()
    user_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_space = Mock(spec=StudySpace)
    mock_space.id = space_id
    mock_space.user_id = user_id
    mock_space_repo.get_by_id.return_value = mock_space

    mock_updated_space = Mock(spec=StudySpace)
    mock_updated_space.name = "Updated Name"
    mock_space_repo.update.return_value = mock_updated_space

    service = StudySpaceService()
    result = service.update_space(
        db=mock_db,
        space_id=space_id,
        user=mock_user,
        name="Updated Name",
        description="New Description",
        color="#00FF00"
    )

    assert result == mock_updated_space
    mock_space_repo.update.assert_called_once_with(
        mock_db, mock_space, "Updated Name", "New Description", "#00FF00"
    )


# ========================================
# TESTS PARA delete_space()
# ========================================

@patch('app.services.study_space_service.StudySpaceRepository')
def test_delete_space(mock_space_repo):
    """delete_space debe eliminar espacio correctamente"""
    mock_db = MagicMock()
    space_id = uuid4()
    user_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_space = Mock(spec=StudySpace)
    mock_space.id = space_id
    mock_space.user_id = user_id
    mock_space_repo.get_by_id.return_value = mock_space

    service = StudySpaceService()
    service.delete_space(mock_db, space_id, mock_user)

    mock_space_repo.delete.assert_called_once_with(mock_db, mock_space)


# ========================================
# TESTS PARA add_summary_to_space()
# ========================================

@patch('app.services.study_space_service.StudySpaceRepository')
@patch('app.services.study_space_service.SummaryRepository')
def test_add_summary_to_space_success(mock_summary_repo, mock_space_repo):
    """add_summary_to_space debe agregar resumen correctamente"""
    mock_db = MagicMock()
    space_id = uuid4()
    summary_id = uuid4()
    user_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_space = Mock(spec=StudySpace)
    mock_space.user_id = user_id
    mock_space_repo.get_by_id.return_value = mock_space

    mock_summary = Mock(spec=Summary)
    mock_summary.user_id = user_id
    mock_summary_repo.get_by_id.return_value = mock_summary

    service = StudySpaceService()
    service.add_summary_to_space(mock_db, space_id, summary_id, mock_user)

    mock_space_repo.add_summary.assert_called_once_with(mock_db, space_id, summary_id)


@patch('app.services.study_space_service.StudySpaceRepository')
@patch('app.services.study_space_service.SummaryRepository')
def test_add_summary_to_space_summary_not_found(mock_summary_repo, mock_space_repo):
    """add_summary_to_space debe lanzar 404 si resumen no existe"""
    mock_db = MagicMock()
    space_id = uuid4()
    summary_id = uuid4()
    user_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_space = Mock(spec=StudySpace)
    mock_space.user_id = user_id
    mock_space_repo.get_by_id.return_value = mock_space

    mock_summary_repo.get_by_id.return_value = None

    service = StudySpaceService()

    with pytest.raises(HTTPException) as exc_info:
        service.add_summary_to_space(mock_db, space_id, summary_id, mock_user)

    assert exc_info.value.status_code == 404
    assert "Summary not found" in exc_info.value.detail


@patch('app.services.study_space_service.StudySpaceRepository')
@patch('app.services.study_space_service.SummaryRepository')
def test_add_summary_to_space_wrong_owner(mock_summary_repo, mock_space_repo):
    """add_summary_to_space debe lanzar 404 si resumen no pertenece al usuario"""
    mock_db = MagicMock()
    space_id = uuid4()
    summary_id = uuid4()
    user_id = uuid4()
    different_user_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_space = Mock(spec=StudySpace)
    mock_space.user_id = user_id
    mock_space_repo.get_by_id.return_value = mock_space

    mock_summary = Mock(spec=Summary)
    mock_summary.user_id = different_user_id  # Different owner
    mock_summary_repo.get_by_id.return_value = mock_summary

    service = StudySpaceService()

    with pytest.raises(HTTPException) as exc_info:
        service.add_summary_to_space(mock_db, space_id, summary_id, mock_user)

    assert exc_info.value.status_code == 404


# ========================================
# TESTS PARA remove_summary_from_space()
# ========================================

@patch('app.services.study_space_service.StudySpaceRepository')
def test_remove_summary_from_space(mock_space_repo):
    """remove_summary_from_space debe remover resumen correctamente"""
    mock_db = MagicMock()
    space_id = uuid4()
    summary_id = uuid4()
    user_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_space = Mock(spec=StudySpace)
    mock_space.user_id = user_id
    mock_space_repo.get_by_id.return_value = mock_space

    service = StudySpaceService()
    service.remove_summary_from_space(mock_db, space_id, summary_id, mock_user)

    mock_space_repo.remove_summary.assert_called_once_with(mock_db, space_id, summary_id)


# ========================================
# TESTS PARA add_document_to_space()
# ========================================

@patch('app.services.study_space_service.StudySpaceRepository')
@patch('app.services.study_space_service.DocumentRepository')
def test_add_document_to_space_success(mock_doc_repo, mock_space_repo):
    """add_document_to_space debe agregar documento correctamente"""
    mock_db = MagicMock()
    space_id = uuid4()
    document_id = uuid4()
    user_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_space = Mock(spec=StudySpace)
    mock_space.user_id = user_id
    mock_space_repo.get_by_id.return_value = mock_space

    mock_document = Mock(spec=Document)
    mock_document.user_id = user_id
    mock_doc_repo.get_by_id.return_value = mock_document

    service = StudySpaceService()
    service.add_document_to_space(mock_db, space_id, document_id, mock_user)

    mock_space_repo.add_document.assert_called_once_with(mock_db, space_id, document_id)


@patch('app.services.study_space_service.StudySpaceRepository')
@patch('app.services.study_space_service.DocumentRepository')
def test_add_document_to_space_document_not_found(mock_doc_repo, mock_space_repo):
    """add_document_to_space debe lanzar 404 si documento no existe"""
    mock_db = MagicMock()
    space_id = uuid4()
    document_id = uuid4()
    user_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_space = Mock(spec=StudySpace)
    mock_space.user_id = user_id
    mock_space_repo.get_by_id.return_value = mock_space

    mock_doc_repo.get_by_id.return_value = None

    service = StudySpaceService()

    with pytest.raises(HTTPException) as exc_info:
        service.add_document_to_space(mock_db, space_id, document_id, mock_user)

    assert exc_info.value.status_code == 404
    assert "Document not found" in exc_info.value.detail


# ========================================
# TESTS PARA remove_document_from_space()
# ========================================

@patch('app.services.study_space_service.StudySpaceRepository')
def test_remove_document_from_space(mock_space_repo):
    """remove_document_from_space debe remover documento correctamente"""
    mock_db = MagicMock()
    space_id = uuid4()
    document_id = uuid4()
    user_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_space = Mock(spec=StudySpace)
    mock_space.user_id = user_id
    mock_space_repo.get_by_id.return_value = mock_space

    service = StudySpaceService()
    service.remove_document_from_space(mock_db, space_id, document_id, mock_user)

    mock_space_repo.remove_document.assert_called_once_with(mock_db, space_id, document_id)


# ========================================
# TESTS PARA get_space_stats()
# ========================================

@patch('app.services.study_space_service.StudySpaceRepository')
def test_get_space_stats_basic_calculation(mock_space_repo):
    """Stats básicos se calculan correctamente"""
    mock_db = MagicMock()
    space_id = uuid4()
    user_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    # Mock space with resources
    mock_space = Mock(spec=StudySpace)
    mock_space.id = space_id
    mock_space.name = "Test Space"
    mock_space.user_id = user_id
    mock_space.documents = [Mock(), Mock()]  # 2 documents
    mock_space.summaries = [Mock()]  # 1 summary
    mock_space_repo.get_by_id.return_value = mock_space

    # Mock de query chain para quizzes - no quizzes
    mock_db.query.return_value.filter.return_value.all.return_value = []

    service = StudySpaceService()
    stats = service.get_space_stats(mock_db, space_id, mock_user)

    assert stats['num_documents'] == 2
    assert stats['num_summaries'] == 1
    assert stats['num_quizzes'] == 0
    assert stats['total_attempts'] == 0


@patch('app.services.study_space_service.StudySpaceRepository')
def test_get_space_stats_with_quiz_attempts(mock_space_repo):
    """get_space_stats debe calcular estadísticas de quizzes correctamente"""
    mock_db = MagicMock()
    space_id = uuid4()
    user_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    # Mock space
    mock_space = Mock(spec=StudySpace)
    mock_space.id = space_id
    mock_space.name = "Test Space"
    mock_space.user_id = user_id
    mock_space.documents = []
    mock_space.summaries = []
    mock_space_repo.get_by_id.return_value = mock_space

    # Mock quizzes
    quiz1_id = uuid4()
    quiz2_id = uuid4()
    mock_quizzes = [
        Mock(spec=Quiz, id=quiz1_id),
        Mock(spec=Quiz, id=quiz2_id),
    ]

    # Mock quiz attempts with scores
    mock_attempts = [
        Mock(spec=QuizAttempt, score=85.0),
        Mock(spec=QuizAttempt, score=90.0),
        Mock(spec=QuizAttempt, score=75.0),
    ]

    mock_db.query.return_value.filter.return_value.all.side_effect = [
        mock_quizzes,  # First call for quizzes
        mock_attempts  # Second call for attempts
    ]

    service = StudySpaceService()
    stats = service.get_space_stats(mock_db, space_id, mock_user)

    assert stats["num_quizzes"] == 2
    assert stats["total_attempts"] == 3
    assert stats["avg_score"] == 83.33  # (85 + 90 + 75) / 3
    assert stats["best_score"] == 90.0


@patch('app.services.study_space_service.StudySpaceRepository')
def test_get_space_stats_no_quizzes(mock_space_repo):
    """get_space_stats debe manejar espacios sin quizzes"""
    mock_db = MagicMock()
    space_id = uuid4()
    user_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_space = Mock(spec=StudySpace)
    mock_space.id = space_id
    mock_space.name = "Empty Space"
    mock_space.user_id = user_id
    mock_space.documents = []
    mock_space.summaries = []
    mock_space_repo.get_by_id.return_value = mock_space

    # No quizzes
    mock_db.query.return_value.filter.return_value.all.return_value = []

    service = StudySpaceService()
    stats = service.get_space_stats(mock_db, space_id, mock_user)

    assert stats["num_documents"] == 0
    assert stats["num_summaries"] == 0
    assert stats["num_quizzes"] == 0
    assert stats["total_attempts"] == 0
    assert stats["avg_score"] == 0
    assert stats["best_score"] == 0


@patch('app.services.study_space_service.StudySpaceRepository')
def test_get_space_stats_quizzes_no_attempts(mock_space_repo):
    """get_space_stats debe manejar quizzes sin intentos"""
    mock_db = MagicMock()
    space_id = uuid4()
    user_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_space = Mock(spec=StudySpace)
    mock_space.id = space_id
    mock_space.name = "Space with Quizzes"
    mock_space.user_id = user_id
    mock_space.documents = []
    mock_space.summaries = []
    mock_space_repo.get_by_id.return_value = mock_space

    # Quizzes exist
    mock_quizzes = [Mock(spec=Quiz, id=uuid4())]
    mock_db.query.return_value.filter.return_value.all.side_effect = [
        mock_quizzes,  # First call for quizzes
        []  # Second call for attempts (empty)
    ]

    service = StudySpaceService()
    stats = service.get_space_stats(mock_db, space_id, mock_user)

    assert stats["num_quizzes"] == 1
    assert stats["total_attempts"] == 0
    assert stats["avg_score"] == 0
    assert stats["best_score"] == 0
