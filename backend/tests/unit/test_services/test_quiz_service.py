"""
Tests unitarios para QuizService
"""
import pytest
from uuid import uuid4
from unittest.mock import Mock, patch, MagicMock
from fastapi import HTTPException
from app.services.quiz_service import QuizService
from app.models.quiz import Quiz


class TestAdaptiveDifficulty:
    """Tests para calculate_adaptive_difficulty()"""

    @patch('app.services.openai_service.settings')
    def test_no_history_returns_default(self, mock_settings, fake_db, fake_user, fake_study_space):
        """Sin historial previo retorna dificultad 2 (default)"""
        mock_settings.OPENAI_API_KEY = "sk-test-key"
        mock_settings.OPENAI_MODEL = "gpt-4"

        with patch('app.services.quiz_service.QuizAttemptRepository') as mock_repo:
            mock_repo.get_recent_attempts_by_space.return_value = []

            service = QuizService()
            difficulty = service.calculate_adaptive_difficulty(fake_db, fake_user.id, fake_study_space.id)

            assert difficulty == 2

    @patch('app.services.openai_service.settings')
    def test_high_scores_returns_max_difficulty(self, mock_settings, fake_db, fake_user, fake_study_space):
        """Scores altos (>=90%) retornan dificultad 5"""
        mock_settings.OPENAI_API_KEY = "sk-test-key"
        mock_settings.OPENAI_MODEL = "gpt-4"

        attempts = [Mock(score=95.0), Mock(score=92.5), Mock(score=90.0), Mock(score=93.0), Mock(score=91.0)]

        with patch('app.services.quiz_service.QuizAttemptRepository') as mock_repo:
            mock_repo.get_recent_attempts_by_space.return_value = attempts

            service = QuizService()
            difficulty = service.calculate_adaptive_difficulty(fake_db, fake_user.id, fake_study_space.id)

            assert difficulty == 5

    @patch('app.services.openai_service.settings')
    def test_low_scores_returns_min_difficulty(self, mock_settings, fake_db, fake_user, fake_study_space):
        """Scores bajos (<40%) retornan dificultad 1"""
        mock_settings.OPENAI_API_KEY = "sk-test-key"
        mock_settings.OPENAI_MODEL = "gpt-4"

        attempts = [Mock(score=30.0), Mock(score=35.0), Mock(score=32.0), Mock(score=28.0), Mock(score=35.0)]

        with patch('app.services.quiz_service.QuizAttemptRepository') as mock_repo:
            mock_repo.get_recent_attempts_by_space.return_value = attempts

            service = QuizService()
            difficulty = service.calculate_adaptive_difficulty(fake_db, fake_user.id, fake_study_space.id)

            assert difficulty == 1


class TestCreateQuizFromDocument:
    """Tests para create_quiz_from_document()"""

    @patch('app.services.openai_service.settings')
    def test_creates_quiz_successfully(self, mock_settings, fake_db, fake_user, fake_document, fake_study_space):
        """Crea quiz desde documento correctamente"""
        mock_settings.OPENAI_API_KEY = "sk-test-key"
        mock_settings.OPENAI_MODEL = "gpt-4"

        fake_document.extracted_text = "Test content. " * 100
        fake_document.study_spaces = [fake_study_space]

        mock_quiz = Mock(spec=Quiz)
        mock_quiz.id = uuid4()

        with patch('app.repositories.document_repository.DocumentRepository.get_by_id') as mock_get_doc, \
             patch('app.repositories.quiz_repository.QuizRepository.create_quiz') as mock_create_quiz, \
             patch('app.repositories.quiz_attempt_repository.QuizAttemptRepository.get_recent_attempts_by_space') as mock_get_attempts:

            mock_get_doc.return_value = fake_document
            mock_get_attempts.return_value = []
            mock_create_quiz.return_value = mock_quiz

            service = QuizService()

            # Mock openai_service.generate_quiz
            with patch.object(service.openai_service, 'generate_quiz') as mock_generate:
                mock_generate.return_value = [{"question": f"Q{i}?", "options": {}, "explanation": "..."} for i in range(10)]

                result = service.create_quiz_from_document(fake_db, fake_user, fake_document.id)

                assert result == mock_quiz
                mock_generate.assert_called_once()

    @patch('app.services.openai_service.settings')
    def test_fails_with_empty_text(self, mock_settings, fake_db, fake_user, fake_document):
        """Falla si el documento no tiene texto extraído"""
        mock_settings.OPENAI_API_KEY = "sk-test-key"
        fake_document.extracted_text = ""

        with patch('app.repositories.document_repository.DocumentRepository.get_by_id') as mock_get_doc:
            mock_get_doc.return_value = fake_document

            service = QuizService()

            with pytest.raises(HTTPException) as exc_info:
                service.create_quiz_from_document(fake_db, fake_user, fake_document.id)

            assert exc_info.value.status_code == 400


class TestCreateQuizFromSummary:
    """Tests para create_quiz_from_summary()"""

    @patch('app.services.openai_service.settings')
    def test_creates_quiz_successfully(self, mock_settings, fake_db, fake_user, fake_summary, fake_study_space):
        """Crea quiz desde resumen correctamente"""
        mock_settings.OPENAI_API_KEY = "sk-test-key"

        fake_summary.content = {"summary": "Test summary. " * 50}
        fake_summary.study_space_id = fake_study_space.id
        fake_summary.study_space = fake_study_space

        mock_quiz = Mock(spec=Quiz)

        with patch('app.services.quiz_service.SummaryRepository') as mock_summary_repo, \
             patch('app.services.quiz_service.QuizRepository') as mock_quiz_repo, \
             patch('app.services.quiz_service.QuizAttemptRepository') as mock_attempt_repo:

            mock_summary_repo.get_by_id.return_value = fake_summary
            mock_attempt_repo.get_recent_attempts_by_space.return_value = []
            mock_quiz_repo.create_quiz.return_value = mock_quiz

            service = QuizService()

            with patch.object(service.openai_service, 'generate_quiz') as mock_generate:
                mock_generate.return_value = [{"question": f"Q{i}?", "options": {}} for i in range(10)]

                result = service.create_quiz_from_summary(fake_db, fake_user, fake_summary.id)

                assert result == mock_quiz


class TestCreateQuizFromSpace:
    """Tests para create_quiz_from_space()"""

    @patch('app.services.openai_service.settings')
    def test_creates_quiz_successfully(self, mock_settings, fake_db, fake_user, fake_study_space):
        """Crea quiz desde espacio con múltiples resúmenes"""
        mock_settings.OPENAI_API_KEY = "sk-test-key"

        summary1 = Mock()
        summary1.content = {"summary": "Summary 1. " * 30}
        summary1.title = "Summary 1"
        summary1.id = uuid4()

        summary2 = Mock()
        summary2.content = {"summary": "Summary 2. " * 30}
        summary2.title = "Summary 2"
        summary2.id = uuid4()

        fake_study_space.summaries = [summary1, summary2]

        mock_quiz = Mock(spec=Quiz)

        with patch('app.repositories.study_space_repository.StudySpaceRepository.get_by_id') as mock_get_space, \
             patch('app.repositories.quiz_repository.QuizRepository.create_quiz') as mock_create_quiz, \
             patch('app.repositories.quiz_attempt_repository.QuizAttemptRepository.get_recent_attempts_by_space') as mock_get_attempts:

            mock_get_space.return_value = fake_study_space
            mock_get_attempts.return_value = []
            mock_create_quiz.return_value = mock_quiz

            service = QuizService()

            with patch.object(service.openai_service, 'generate_quiz') as mock_generate:
                mock_generate.return_value = [{"question": f"Q{i}?", "options": {}} for i in range(10)]

                result = service.create_quiz_from_space(fake_db, fake_user, fake_study_space.id)

                assert result == mock_quiz

    @patch('app.services.openai_service.settings')
    def test_fails_with_no_summaries(self, mock_settings, fake_db, fake_user, fake_study_space):
        """Falla si el espacio no tiene resúmenes"""
        mock_settings.OPENAI_API_KEY = "sk-test-key"
        fake_study_space.summaries = []

        with patch('app.repositories.study_space_repository.StudySpaceRepository.get_by_id') as mock_get_space:
            mock_get_space.return_value = fake_study_space

            service = QuizService()

            with pytest.raises(HTTPException) as exc_info:
                service.create_quiz_from_space(fake_db, fake_user, fake_study_space.id)

            assert exc_info.value.status_code == 400
