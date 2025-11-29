"""
Tests para el router de quizzes
"""
import pytest
from uuid import uuid4
from unittest.mock import Mock, patch, AsyncMock
from fastapi import HTTPException

from app.routers.quizzes import (
    generate_quiz_from_file,
    generate_quiz_from_summary,
    generate_quiz_from_document,
    list_quizzes,
    get_quiz,
    delete_quiz,
    _enrich_quiz_response,
)


class TestEnrichQuizResponse:
    """Tests para la función de enriquecimiento"""

    def test_enrich_quiz_response_from_space(self, fake_user, fake_db, fake_quiz):
        """Debe enriquecer quiz con source_type='study_space'"""
        fake_quiz.study_space_id = uuid4()
        fake_quiz.source_type = "study_space"  # NEW: Explicit source_type
        fake_quiz.study_space = Mock()
        fake_quiz.study_space.name = "Test Space"

        with patch('app.routers.quizzes.QuizAttemptRepository') as MockRepo:
            MockRepo.count_attempts_by_quiz.return_value = 3

            result = _enrich_quiz_response(fake_quiz, fake_db, fake_user.id)

            assert result["source_type"] == "study_space"  # NEW: Correct value
            assert result["study_space_name"] == "Test Space"
            assert result["num_attempts"] == 3

    def test_enrich_quiz_response_from_summary(self, fake_user, fake_db, fake_quiz):
        """Debe enriquecer quiz con source_type='summary'"""
        fake_quiz.study_space_id = uuid4()  # NEW: Always required (NOT NULL)
        fake_quiz.source_type = "summary"  # NEW: Explicit source_type
        fake_quiz.study_space = Mock()
        fake_quiz.study_space.name = "Test Space"

        with patch('app.routers.quizzes.QuizAttemptRepository') as MockRepo:
            MockRepo.count_attempts_by_quiz.return_value = 5

            result = _enrich_quiz_response(fake_quiz, fake_db, fake_user.id)

            assert result["source_type"] == "summary"  # Correct value
            assert result["study_space_name"] == "Test Space"  # Study space always present

    def test_enrich_quiz_response_from_file(self, fake_user, fake_db, fake_quiz):
        """Debe enriquecer quiz con source_type='document' (from uploaded file)"""
        fake_quiz.study_space_id = uuid4()  # NEW: Always required (NOT NULL)
        fake_quiz.source_type = "document"  # NEW: Files now create 'document' source type
        fake_quiz.source_document_id = uuid4()  # NEW: Reference to document
        fake_quiz.source_summary_id = None
        fake_quiz.study_space = Mock()
        fake_quiz.study_space.name = "Test Space"

        with patch('app.routers.quizzes.QuizAttemptRepository') as MockRepo:
            MockRepo.count_attempts_by_quiz.return_value = 0

            result = _enrich_quiz_response(fake_quiz, fake_db, fake_user.id)

            assert result["source_type"] == "document"  # NEW: Correct value
            assert result["study_space_name"] == "Test Space"  # Study space always present


class TestGenerateQuizFromFile:
    """Tests para generar quiz desde archivo"""

    @pytest.mark.asyncio
    async def test_generate_quiz_from_file_success(self, fake_user, fake_db, fake_quiz):
        """Debe generar quiz desde archivo"""
        mock_file = Mock()
        mock_file.filename = "test.pdf"
        study_space_id = uuid4()  # NEW: Required parameter

        fake_quiz.study_space = Mock()
        fake_quiz.study_space.name = "Test Space"
        fake_quiz.source_type = "document"  # NEW: Explicit source_type

        with patch('app.services.quiz_service.QuizService.create_quiz_from_file', new_callable=AsyncMock) as mock_create, \
             patch('app.routers.quizzes.QuizAttemptRepository') as MockRepo:

            mock_create.return_value = fake_quiz
            MockRepo.count_attempts_by_quiz.return_value = 0

            result = await generate_quiz_from_file(
                file=mock_file,
                study_space_id=study_space_id,  # NEW: Required parameter
                max_questions=10,
                current_user=fake_user,
                db=fake_db
            )

            assert result.id == fake_quiz.id
            assert result.title == fake_quiz.title
            assert result.source_type == "document"  # NEW: Files create 'document' source type
            mock_create.assert_called_once()


class TestGenerateQuizFromSummary:
    """Tests para generar quiz desde resumen"""

    def test_generate_quiz_from_summary_success(self, fake_user, fake_db, fake_quiz):
        """Debe generar quiz desde resumen"""
        summary_id = uuid4()

        fake_quiz.source_type = "summary"  # NEW: Explicit source_type
        fake_quiz.source_summary_id = summary_id  # NEW: Source tracking field
        fake_quiz.study_space = Mock()  # NEW: Study space always present (NOT NULL)
        fake_quiz.study_space.name = "Test Space"

        with patch('app.services.quiz_service.QuizService.create_quiz_from_summary') as mock_create, \
             patch('app.routers.quizzes.QuizAttemptRepository') as MockRepo:

            mock_create.return_value = fake_quiz
            MockRepo.count_attempts_by_quiz.return_value = 0

            result = generate_quiz_from_summary(
                summary_id=summary_id,
                max_questions=15,
                current_user=fake_user,
                db=fake_db
            )

            assert result.id == fake_quiz.id
            assert result.source_type == "summary"  # Now should match
            mock_create.assert_called_once_with(
                db=fake_db,
                user=fake_user,
                summary_id=summary_id,
                max_questions=15
            )


class TestGenerateQuizFromDocument:
    """Tests para generar quiz desde documento"""

    def test_generate_quiz_from_document_success(self, fake_user, fake_db, fake_quiz):
        """Debe generar quiz desde documento"""
        document_id = uuid4()
        study_space_id = uuid4()  # NEW: Required parameter

        fake_quiz.study_space = Mock()
        fake_quiz.study_space.name = "Test Space"
        fake_quiz.source_type = "document"  # NEW: Explicit source_type

        with patch('app.services.quiz_service.QuizService.create_quiz_from_document') as mock_create, \
             patch('app.routers.quizzes.QuizAttemptRepository') as MockRepo:

            mock_create.return_value = fake_quiz
            MockRepo.count_attempts_by_quiz.return_value = 0

            result = generate_quiz_from_document(
                document_id=document_id,
                study_space_id=study_space_id,  # NEW: Required parameter
                max_questions=20,
                current_user=fake_user,
                db=fake_db
            )

            assert result.id == fake_quiz.id
            assert result.source_type == "document"  # NEW: Correct value ('document' not 'file')
            mock_create.assert_called_once_with(
                db=fake_db,
                user=fake_user,
                document_id=document_id,
                study_space_id=study_space_id,  # NEW: Required parameter
                max_questions=20
            )


class TestListQuizzes:
    """Tests para listar quizzes"""

    def test_list_quizzes_success(self, fake_user, fake_db, fake_quiz):
        """Debe listar quizzes del usuario"""
        fake_quiz.study_space = None
        fake_quiz.summary = None

        with patch('app.services.quiz_service.QuizService.get_quizzes') as mock_get, \
             patch('app.routers.quizzes.QuizAttemptRepository') as MockRepo:

            mock_get.return_value = ([fake_quiz], 1)
            MockRepo.count_attempts_by_quiz.return_value = 2

            result = list_quizzes(
                skip=0,
                limit=100,
                current_user=fake_user,
                db=fake_db
            )

            assert result.total == 1
            assert len(result.items) == 1
            assert result.items[0].id == fake_quiz.id
            mock_get.assert_called_once_with(
                db=fake_db,
                user_id=fake_user.id,
                skip=0,
                limit=100
            )

    def test_list_quizzes_empty(self, fake_user, fake_db):
        """Debe retornar lista vacía si no hay quizzes"""
        with patch('app.services.quiz_service.QuizService.get_quizzes') as mock_get:
            mock_get.return_value = ([], 0)

            result = list_quizzes(
                current_user=fake_user,
                db=fake_db
            )

            assert result.total == 0
            assert len(result.items) == 0

    def test_list_quizzes_pagination(self, fake_user, fake_db):
        """Debe respetar parámetros de paginación"""
        with patch('app.services.quiz_service.QuizService.get_quizzes') as mock_get:
            mock_get.return_value = ([], 50)

            list_quizzes(
                skip=10,
                limit=20,
                current_user=fake_user,
                db=fake_db
            )

            mock_get.assert_called_once_with(
                db=fake_db,
                user_id=fake_user.id,
                skip=10,
                limit=20
            )


class TestGetQuiz:
    """Tests para obtener un quiz específico"""

    def test_get_quiz_success(self, fake_user, fake_db, fake_quiz):
        """Debe obtener quiz exitosamente"""
        fake_quiz.study_space = None
        fake_quiz.summary = None

        with patch('app.services.quiz_service.QuizService.get_quiz') as mock_get, \
             patch('app.routers.quizzes.QuizAttemptRepository') as MockRepo:

            mock_get.return_value = fake_quiz
            MockRepo.count_attempts_by_quiz.return_value = 5

            result = get_quiz(
                quiz_id=fake_quiz.id,
                current_user=fake_user,
                db=fake_db
            )

            assert result.id == fake_quiz.id
            assert result.num_attempts == 5
            mock_get.assert_called_once_with(
                db=fake_db,
                quiz_id=fake_quiz.id,
                user=fake_user
            )

    def test_get_quiz_not_found(self, fake_user, fake_db):
        """Debe lanzar excepción si quiz no existe"""
        quiz_id = uuid4()

        with patch('app.services.quiz_service.QuizService.get_quiz') as mock_get:
            mock_get.side_effect = HTTPException(status_code=404, detail="Not found")

            with pytest.raises(HTTPException) as exc_info:
                get_quiz(
                    quiz_id=quiz_id,
                    current_user=fake_user,
                    db=fake_db
                )

            assert exc_info.value.status_code == 404


class TestDeleteQuiz:
    """Tests para eliminar quiz"""

    def test_delete_quiz_success(self, fake_user, fake_db, fake_quiz):
        """Debe eliminar quiz exitosamente"""
        with patch('app.services.quiz_service.QuizService.get_quiz') as mock_get, \
             patch('app.services.deletion_service.DeletionService') as MockDeletion:

            mock_get.return_value = fake_quiz
            MockDeletion.delete_quiz.return_value = True

            result = delete_quiz(
                quiz_id=fake_quiz.id,
                current_user=fake_user,
                db=fake_db
            )

            assert result is None
            mock_get.assert_called_once()
            MockDeletion.delete_quiz.assert_called_once_with(fake_db, fake_quiz.id)

    def test_delete_quiz_not_found_after_deletion(self, fake_user, fake_db, fake_quiz):
        """Debe lanzar 404 si DeletionService retorna False"""
        with patch('app.services.quiz_service.QuizService.get_quiz') as mock_get, \
             patch('app.services.deletion_service.DeletionService') as MockDeletion:

            mock_get.return_value = fake_quiz
            MockDeletion.delete_quiz.return_value = False

            with pytest.raises(HTTPException) as exc_info:
                delete_quiz(
                    quiz_id=fake_quiz.id,
                    current_user=fake_user,
                    db=fake_db
                )

            assert exc_info.value.status_code == 404

    def test_delete_quiz_not_owner(self, fake_user, fake_db):
        """Debe lanzar excepción si quiz no pertenece al usuario"""
        quiz_id = uuid4()

        with patch('app.services.quiz_service.QuizService.get_quiz') as mock_get:
            mock_get.side_effect = HTTPException(status_code=403, detail="Forbidden")

            with pytest.raises(HTTPException) as exc_info:
                delete_quiz(
                    quiz_id=quiz_id,
                    current_user=fake_user,
                    db=fake_db
                )

            assert exc_info.value.status_code == 403
