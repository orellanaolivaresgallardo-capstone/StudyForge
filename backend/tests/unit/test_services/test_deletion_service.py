"""
Tests unitarios para DeletionService
"""
import pytest
from uuid import uuid4
from unittest.mock import Mock, MagicMock, patch
from app.services.deletion_service import DeletionService
from app.models.document import Document
from app.models.summary import Summary
from app.models.quiz import Quiz
from app.models.quiz_attempt import QuizAttempt
from app.models.study_space import StudySpace


# ========================================
# TESTS PARA delete_document_with_denormalization()
# ========================================

@patch('app.services.deletion_service.DocumentRepository')
def test_delete_document_with_denormalization_success(mock_doc_repo):
    """delete_document_with_denormalization debe denormalizar y eliminar"""
    mock_db = MagicMock()
    doc_id = uuid4()

    # Mock summary asociado al documento
    mock_summary = Mock(spec=Summary)
    mock_summary.id = uuid4()
    mock_summary.deleted_documents_info = []

    # Mock document con resúmenes asociados
    mock_document = Mock(spec=Document)
    mock_document.id = doc_id
    mock_document.title = "Test Document"
    mock_document.file_name = "test.pdf"
    mock_document.summaries = [mock_summary]

    mock_doc_repo.get_by_id.return_value = mock_document
    mock_doc_repo.delete.return_value = True

    # Execute
    result = DeletionService.delete_document_with_denormalization(mock_db, doc_id)

    # Verify
    assert result is True
    mock_doc_repo.get_by_id.assert_called_once_with(mock_db, doc_id)

    # Verify denormalization occurred - document_state updated to "removed"
    assert mock_summary.document_state == "removed"

    mock_db.commit.assert_called_once()
    mock_doc_repo.delete.assert_called_once_with(mock_db, doc_id)


@patch('app.services.deletion_service.DocumentRepository')
def test_delete_document_with_denormalization_not_found(mock_doc_repo):
    """delete_document_with_denormalization debe retornar False si no existe"""
    mock_db = MagicMock()
    doc_id = uuid4()

    mock_doc_repo.get_by_id.return_value = None

    result = DeletionService.delete_document_with_denormalization(mock_db, doc_id)

    assert result is False
    mock_doc_repo.delete.assert_not_called()


@patch('app.services.deletion_service.DocumentRepository')
def test_delete_document_with_denormalization_multiple_summaries(mock_doc_repo):
    """delete_document_with_denormalization debe denormalizar en múltiples resúmenes"""
    mock_db = MagicMock()
    doc_id = uuid4()

    # Múltiples resúmenes asociados
    mock_summary1 = Mock(spec=Summary)
    mock_summary1.deleted_documents_info = []

    mock_summary2 = Mock(spec=Summary)
    mock_summary2.deleted_documents_info = [{"id": "old-doc", "title": "Old"}]

    mock_document = Mock(spec=Document)
    mock_document.id = doc_id
    mock_document.title = "Shared Document"
    mock_document.file_name = "shared.pdf"
    mock_document.summaries = [mock_summary1, mock_summary2]

    mock_doc_repo.get_by_id.return_value = mock_document
    mock_doc_repo.delete.return_value = True

    result = DeletionService.delete_document_with_denormalization(mock_db, doc_id)

    assert result is True
    # Both summaries should have document_state updated
    assert mock_summary1.document_state == "removed"
    assert mock_summary2.document_state == "removed"


@patch('app.services.deletion_service.DocumentRepository')
def test_delete_document_with_denormalization_no_summaries(mock_doc_repo):
    """delete_document_with_denormalization debe funcionar sin resúmenes asociados"""
    mock_db = MagicMock()
    doc_id = uuid4()

    mock_document = Mock(spec=Document)
    mock_document.id = doc_id
    mock_document.summaries = []  # Sin resúmenes

    mock_doc_repo.get_by_id.return_value = mock_document
    mock_doc_repo.delete.return_value = True

    result = DeletionService.delete_document_with_denormalization(mock_db, doc_id)

    assert result is True
    mock_db.commit.assert_called_once()
    mock_doc_repo.delete.assert_called_once()


# ========================================
# TESTS PARA delete_summary()
# ========================================

@patch('app.services.deletion_service.SummaryRepository')
def test_delete_summary(mock_summary_repo):
    """delete_summary debe eliminar el resumen"""
    mock_db = MagicMock()
    mock_summary = Mock(spec=Summary)
    mock_summary.id = uuid4()

    DeletionService.delete_summary(mock_db, mock_summary)

    mock_summary_repo.delete.assert_called_once_with(mock_db, mock_summary)


# ========================================
# TESTS PARA delete_quiz()
# ========================================

def test_delete_quiz_success():
    """delete_quiz debe eliminar quiz exitosamente"""
    mock_db = MagicMock()
    quiz_id = uuid4()

    mock_quiz = Mock(spec=Quiz)
    mock_quiz.id = quiz_id

    # Mock SQLAlchemy 2.0 select() pattern
    from sqlalchemy import select
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_quiz
    mock_db.execute.return_value = mock_result

    result = DeletionService.delete_quiz(mock_db, quiz_id)

    assert result is True
    mock_db.delete.assert_called_once_with(mock_quiz)
    mock_db.commit.assert_called_once()


def test_delete_quiz_not_found():
    """delete_quiz debe retornar False si no existe"""
    mock_db = MagicMock()
    quiz_id = uuid4()

    # Mock SQLAlchemy 2.0 select() pattern
    from sqlalchemy import select
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result

    result = DeletionService.delete_quiz(mock_db, quiz_id)

    assert result is False
    mock_db.delete.assert_not_called()
    mock_db.commit.assert_not_called()


# ========================================
# TESTS PARA delete_study_space_with_cascade()
# ========================================

@patch('app.services.deletion_service.StudySpaceRepository')
@patch('app.services.deletion_service.QuizRepository')
def test_delete_study_space_with_cascade_success(mock_quiz_repo, mock_space_repo):
    """delete_study_space_with_cascade debe eliminar espacio y quizzes"""
    mock_db = MagicMock()
    space_id = uuid4()
    user_id = uuid4()

    # Mock study space
    mock_space = Mock(spec=StudySpace)
    mock_space.id = space_id
    mock_space.user_id = user_id
    mock_space_repo.get_by_id.return_value = mock_space

    # Mock quizzes del espacio
    quiz1_id = uuid4()
    quiz2_id = uuid4()
    mock_quiz1 = Mock(spec=Quiz, id=quiz1_id)
    mock_quiz2 = Mock(spec=Quiz, id=quiz2_id)
    mock_quiz_repo.get_quizzes_by_space.return_value = [mock_quiz1, mock_quiz2]

    # Execute
    result = DeletionService.delete_study_space_with_cascade(
        mock_db, space_id, user_id
    )

    # Verify
    assert result is True
    mock_space_repo.get_by_id.assert_called_once_with(mock_db, space_id)
    mock_quiz_repo.get_quizzes_by_space.assert_called_once_with(
        mock_db, space_id, user_id, skip=0, limit=10000
    )

    # Verify quiz_attempts were deleted via execute()
    assert mock_db.execute.called
    mock_db.commit.assert_called()

    # Verify space was deleted
    mock_space_repo.delete.assert_called_once_with(mock_db, mock_space)


@patch('app.services.deletion_service.StudySpaceRepository')
@patch('app.services.deletion_service.QuizRepository')
def test_delete_study_space_with_cascade_not_found(mock_quiz_repo, mock_space_repo):
    """delete_study_space_with_cascade debe retornar False si no existe"""
    mock_db = MagicMock()
    space_id = uuid4()
    user_id = uuid4()

    mock_space_repo.get_by_id.return_value = None

    result = DeletionService.delete_study_space_with_cascade(
        mock_db, space_id, user_id
    )

    assert result is False
    mock_quiz_repo.get_quizzes_by_space.assert_not_called()
    mock_space_repo.delete.assert_not_called()


@patch('app.services.deletion_service.StudySpaceRepository')
@patch('app.services.deletion_service.QuizRepository')
def test_delete_study_space_with_cascade_wrong_user(mock_quiz_repo, mock_space_repo):
    """delete_study_space_with_cascade debe retornar False con user_id incorrecto"""
    mock_db = MagicMock()
    space_id = uuid4()
    user_id = uuid4()
    different_user_id = uuid4()

    mock_space = Mock(spec=StudySpace)
    mock_space.user_id = different_user_id  # Different user
    mock_space_repo.get_by_id.return_value = mock_space

    result = DeletionService.delete_study_space_with_cascade(
        mock_db, space_id, user_id
    )

    assert result is False
    mock_space_repo.delete.assert_not_called()


@patch('app.services.deletion_service.StudySpaceRepository')
@patch('app.services.deletion_service.QuizRepository')
def test_delete_study_space_with_cascade_no_quizzes(mock_quiz_repo, mock_space_repo):
    """delete_study_space_with_cascade debe funcionar sin quizzes"""
    mock_db = MagicMock()
    space_id = uuid4()
    user_id = uuid4()

    mock_space = Mock(spec=StudySpace)
    mock_space.id = space_id
    mock_space.user_id = user_id
    mock_space_repo.get_by_id.return_value = mock_space

    # No quizzes
    mock_quiz_repo.get_quizzes_by_space.return_value = []

    result = DeletionService.delete_study_space_with_cascade(
        mock_db, space_id, user_id
    )

    assert result is True
    # No quiz_attempts to delete (no quizzes, so delete() not called)
    mock_space_repo.delete.assert_called_once_with(mock_db, mock_space)


@patch('app.services.deletion_service.StudySpaceRepository')
@patch('app.services.deletion_service.QuizRepository')
def test_delete_study_space_with_cascade_many_quizzes(mock_quiz_repo, mock_space_repo):
    """delete_study_space_with_cascade debe manejar múltiples quizzes"""
    mock_db = MagicMock()
    space_id = uuid4()
    user_id = uuid4()

    mock_space = Mock(spec=StudySpace)
    mock_space.user_id = user_id
    mock_space_repo.get_by_id.return_value = mock_space

    # Múltiples quizzes
    quizzes = [Mock(spec=Quiz, id=uuid4()) for _ in range(10)]
    mock_quiz_repo.get_quizzes_by_space.return_value = quizzes

    result = DeletionService.delete_study_space_with_cascade(
        mock_db, space_id, user_id
    )

    assert result is True
    # Verify all quiz IDs were collected for deletion
    quiz_ids = [q.id for q in quizzes]
    assert len(quiz_ids) == 10
