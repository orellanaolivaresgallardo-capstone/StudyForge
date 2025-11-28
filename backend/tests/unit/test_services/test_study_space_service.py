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

def test_add_summary_to_space_summary_not_found():
    """Method removed - summaries now created with study_space_id directly"""
    pass


def test_add_summary_to_space_wrong_owner():
    """Method removed - summaries now created with study_space_id directly"""
    pass


# ========================================
# TESTS PARA remove_summary_from_space()
# ========================================
# NOTE: remove_summary_from_space() was removed - summaries belong to single space

def test_remove_summary_from_space():
    """Method removed - summaries now belong to single study_space_id"""
    pass


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

    # Mock execute() for quizzes query
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_result

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

    # Mock execute() for quizzes and attempts
    mock_quiz_result = MagicMock()
    mock_quiz_result.scalars.return_value.all.return_value = mock_quizzes
    mock_attempt_result = MagicMock()
    mock_attempt_result.scalars.return_value.all.return_value = mock_attempts
    mock_db.execute.side_effect = [mock_quiz_result, mock_attempt_result]

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
    # Mock execute() for quizzes and attempts
    mock_quiz_result = MagicMock()
    mock_quiz_result.scalars.return_value.all.return_value = mock_quizzes
    mock_attempt_result = MagicMock()
    mock_attempt_result.scalars.return_value.all.return_value = []
    mock_db.execute.side_effect = [mock_quiz_result, mock_attempt_result]

    service = StudySpaceService()
    stats = service.get_space_stats(mock_db, space_id, mock_user)

    assert stats["num_quizzes"] == 1
    assert stats["total_attempts"] == 0
    assert stats["avg_score"] == 0
    assert stats["best_score"] == 0
