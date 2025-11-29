"""
Tests unitarios para DeletionService
"""
import pytest
from uuid import uuid4
from unittest.mock import Mock, patch
from app.services.deletion_service import DeletionService
from app.models.summary import Summary


class TestDeleteDocumentWithDenormalization:
    """Tests para delete_document_with_denormalization()"""

    def test_delete_document_updates_summaries_state(self, fake_db, fake_document):
        """Actualiza document_state en summaries antes de eliminar"""
        summary1 = Mock(spec=Summary)
        summary1.document_id = fake_document.id
        summary1.document_state = "active_in_space"

        summary2 = Mock(spec=Summary)
        summary2.document_id = fake_document.id
        summary2.document_state = "active_in_space"

        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = [summary1, summary2]
        fake_db.execute.return_value = mock_result

        with patch('app.services.deletion_service.DocumentRepository') as mock_doc_repo:
            mock_doc_repo.get_by_id.return_value = fake_document
            mock_doc_repo.delete.return_value = True

            result = DeletionService.delete_document_with_denormalization(fake_db, fake_document.id)

            assert result is True
            assert summary1.document_state == "permanently_deleted"
            assert summary2.document_state == "permanently_deleted"

    def test_delete_document_not_found(self, fake_db):
        """Retorna False si el documento no existe"""
        document_id = uuid4()

        with patch('app.services.deletion_service.DocumentRepository') as mock_doc_repo:
            mock_doc_repo.get_by_id.return_value = None

            result = DeletionService.delete_document_with_denormalization(fake_db, document_id)

            assert result is False


class TestDeleteSummary:
    """Tests para delete_summary()"""

    def test_delete_summary_success(self, fake_db, fake_summary):
        """Elimina resumen correctamente"""
        with patch('app.services.deletion_service.SummaryRepository') as mock_summary_repo:
            DeletionService.delete_summary(fake_db, fake_summary)
            mock_summary_repo.delete.assert_called_once_with(fake_db, fake_summary)


class TestDeleteQuiz:
    """Tests para delete_quiz()"""

    def test_delete_quiz_success(self, fake_db, fake_quiz):
        """Elimina quiz correctamente"""
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = fake_quiz
        fake_db.execute.return_value = mock_result

        result = DeletionService.delete_quiz(fake_db, fake_quiz.id)

        assert result is True

    def test_delete_quiz_not_found(self, fake_db):
        """Retorna False si el quiz no existe"""
        quiz_id = uuid4()
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = None
        fake_db.execute.return_value = mock_result

        result = DeletionService.delete_quiz(fake_db, quiz_id)

        assert result is False


class TestDeleteStudySpace:
    """Tests para delete_study_space_with_cascade()"""

    def test_delete_study_space_success(self, fake_db, fake_study_space, fake_user):
        """Elimina espacio de estudio correctamente"""
        with patch('app.services.deletion_service.StudySpaceRepository') as mock_space_repo:
            mock_space_repo.get_by_id.return_value = fake_study_space

            result = DeletionService.delete_study_space_with_cascade(
                fake_db, fake_study_space.id, fake_user.id
            )

            assert result is True

    def test_delete_study_space_not_found(self, fake_db, fake_user):
        """Retorna False si el espacio no existe"""
        space_id = uuid4()

        with patch('app.services.deletion_service.StudySpaceRepository') as mock_space_repo:
            mock_space_repo.get_by_id.return_value = None

            result = DeletionService.delete_study_space_with_cascade(
                fake_db, space_id, fake_user.id
            )

            assert result is False
