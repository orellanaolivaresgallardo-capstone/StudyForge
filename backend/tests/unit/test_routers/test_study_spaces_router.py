"""
Tests para el router de study_spaces
"""
import pytest
from uuid import uuid4
from unittest.mock import Mock, patch
from fastapi import HTTPException

from app.routers.study_spaces import (
    create_study_space,
    list_study_spaces,
    get_study_space,
    update_study_space,
    delete_study_space,
    add_summary_to_space,
    remove_summary_from_space,
    add_document_to_space,
    remove_document_from_space,
    get_space_stats,
    create_quiz_from_space,
    get_space_quizzes,
)
from app.schemas.study_space import (
    StudySpaceCreate,
    StudySpaceUpdate,
    AddResourceRequest,
    DeleteSpaceRequest,
)
from app.schemas.quiz import QuizCreateFromSpace


class TestCreateStudySpace:
    """Tests para crear espacios de estudio"""

    def test_create_study_space_success(self, fake_user, fake_db, fake_study_space):
        """Debe crear espacio exitosamente"""
        request = StudySpaceCreate(
            name="Test Space",
            description="Description",
            color="#8B5CF6"
        )

        with patch('app.services.study_space_service.StudySpaceService.create_space') as mock_create:
            mock_create.return_value = fake_study_space

            result = create_study_space(request, fake_user, fake_db)

            assert result == fake_study_space
            mock_create.assert_called_once_with(
                fake_db, fake_user.id, "Test Space", "Description", "#8B5CF6"
            )


class TestListStudySpaces:
    """Tests para listar espacios"""

    def test_list_study_spaces_without_stats(self, fake_user, fake_db, fake_study_space):
        """Debe listar espacios sin estadísticas"""
        with patch('app.services.study_space_service.StudySpaceService.get_spaces') as mock_get:
            mock_get.return_value = ([fake_study_space], 1)

            result = list_study_spaces(
                skip=0,
                limit=100,
                include_stats=False,
                current_user=fake_user,
                db=fake_db
            )

            assert result.total == 1
            assert len(result.items) == 1
            mock_get.assert_called_once_with(fake_db, fake_user.id, 0, 100)

    def test_list_study_spaces_with_stats(self, fake_user, fake_db, fake_study_space):
        """Debe listar espacios con estadísticas"""
        spaces_data = [{
            'space': fake_study_space,
            'num_documents': 5,
            'num_summaries': 3,
            'num_quizzes': 2,
            'avg_score': 85.5
        }]

        with patch('app.services.study_space_service.StudySpaceService.get_spaces_with_stats') as mock_get:
            mock_get.return_value = (spaces_data, 1)

            result = list_study_spaces(
                skip=0,
                limit=100,
                include_stats=True,
                current_user=fake_user,
                db=fake_db
            )

            assert result.total == 1
            assert len(result.items) == 1
            assert result.items[0].num_documents == 5
            assert result.items[0].num_summaries == 3


class TestGetStudySpace:
    """Tests para obtener espacio específico"""

    def test_get_study_space_success(self, fake_user, fake_db, fake_study_space):
        """Debe obtener espacio con detalles"""
        fake_study_space.summaries = []
        fake_study_space.documents = []

        with patch('app.services.study_space_service.StudySpaceService.get_space') as mock_get:
            mock_get.return_value = fake_study_space

            result = get_study_space(fake_study_space.id, fake_user, fake_db)

            assert result.id == fake_study_space.id
            assert result.name == fake_study_space.name
            mock_get.assert_called_once_with(fake_db, fake_study_space.id, fake_user)


class TestUpdateStudySpace:
    """Tests para actualizar espacio"""

    def test_update_study_space_success(self, fake_user, fake_db, fake_study_space):
        """Debe actualizar espacio exitosamente"""
        request = StudySpaceUpdate(
            name="Updated Name",
            description="Updated Description",
            color="#FF5733"
        )

        with patch('app.services.study_space_service.StudySpaceService.update_space') as mock_update:
            mock_update.return_value = fake_study_space

            result = update_study_space(fake_study_space.id, request, fake_user, fake_db)

            assert result == fake_study_space
            mock_update.assert_called_once_with(
                fake_db, fake_study_space.id, fake_user, "Updated Name", "Updated Description", "#FF5733"
            )


class TestDeleteStudySpace:
    """Tests para eliminar espacio"""

    def test_delete_study_space_success(self, fake_user, fake_db, fake_study_space):
        """Debe eliminar espacio con password correcta"""
        fake_user.hashed_password = "hashed_password"
        request = DeleteSpaceRequest(password="correct_password")

        with patch('app.core.security.verify_password') as mock_verify, \
             patch('app.services.deletion_service.DeletionService') as MockDeletion:

            mock_verify.return_value = True
            MockDeletion.delete_study_space_with_cascade.return_value = True

            result = delete_study_space(fake_study_space.id, request, fake_user, fake_db)

            assert result is None
            MockDeletion.delete_study_space_with_cascade.assert_called_once_with(
                fake_db, fake_study_space.id, fake_user.id
            )

    def test_delete_study_space_wrong_password(self, fake_user, fake_db, fake_study_space):
        """Debe fallar con password incorrecta"""
        fake_user.hashed_password = "hashed_password"
        request = DeleteSpaceRequest(password="wrong_password")

        with patch('app.core.security.verify_password') as mock_verify:
            mock_verify.return_value = False

            with pytest.raises(HTTPException) as exc_info:
                delete_study_space(fake_study_space.id, request, fake_user, fake_db)

            assert exc_info.value.status_code == 401
            assert "contraseña incorrecta" in exc_info.value.detail.lower()

    def test_delete_study_space_not_found(self, fake_user, fake_db, fake_study_space):
        """Debe fallar si espacio no existe"""
        request = DeleteSpaceRequest(password="correct_password")

        with patch('app.core.security.verify_password') as mock_verify, \
             patch('app.services.deletion_service.DeletionService') as MockDeletion:

            mock_verify.return_value = True
            MockDeletion.delete_study_space_with_cascade.return_value = False

            with pytest.raises(HTTPException) as exc_info:
                delete_study_space(fake_study_space.id, request, fake_user, fake_db)

            assert exc_info.value.status_code == 404


class TestAddSummaryToSpace:
    """Tests para agregar resumen a espacio - OBSOLETO"""

    def test_add_summary_to_space_success(self, fake_user, fake_db, fake_study_space, fake_summary):
        """OBSOLETE: Summaries now created with study_space_id directly"""
        pass


class TestRemoveSummaryFromSpace:
    """Tests para remover resumen de espacio - OBSOLETO"""

    def test_remove_summary_from_space_success(self, fake_user, fake_db, fake_study_space, fake_summary):
        """OBSOLETE: Summaries belong to single study_space_id"""
        pass


class TestAddDocumentToSpace:
    """Tests para agregar documento a espacio"""

    def test_add_document_to_space_success(self, fake_user, fake_db, fake_study_space, fake_document):
        """Debe agregar documento a espacio"""
        request = AddResourceRequest(resource_id=fake_document.id)

        with patch('app.services.study_space_service.StudySpaceService.add_document_to_space') as mock_add:
            mock_add.return_value = None

            result = add_document_to_space(fake_study_space.id, request, fake_user, fake_db)

            assert result is None
            mock_add.assert_called_once_with(fake_db, fake_study_space.id, fake_document.id, fake_user)


class TestRemoveDocumentFromSpace:
    """Tests para remover documento de espacio"""

    def test_remove_document_from_space_success(self, fake_user, fake_db, fake_study_space, fake_document):
        """Debe remover documento de espacio"""
        with patch('app.services.study_space_service.StudySpaceService.remove_document_from_space') as mock_remove:
            mock_remove.return_value = None

            result = remove_document_from_space(fake_study_space.id, fake_document.id, fake_user, fake_db)

            assert result is None
            mock_remove.assert_called_once_with(fake_db, fake_study_space.id, fake_document.id, fake_user)


class TestGetSpaceStats:
    """Tests para obtener estadísticas de espacio"""

    def test_get_space_stats_success(self, fake_user, fake_db, fake_study_space):
        """Debe obtener estadísticas del espacio"""
        stats = {
            "num_documents": 5,
            "num_summaries": 3,
            "num_quizzes": 2,
            "avg_score": 85.5
        }

        with patch('app.services.study_space_service.StudySpaceService.get_space_stats') as mock_get:
            mock_get.return_value = stats

            result = get_space_stats(fake_study_space.id, fake_user, fake_db)

            assert result["num_documents"] == 5
            assert result["num_summaries"] == 3
            mock_get.assert_called_once_with(fake_db, fake_study_space.id, fake_user)


class TestCreateQuizFromSpace:
    """Tests para crear quiz desde espacio"""

    def test_create_quiz_from_space_success(self, fake_user, fake_db, fake_study_space, fake_quiz):
        """Debe crear quiz desde espacio"""
        request = QuizCreateFromSpace(max_questions=10)

        # Setup quiz con nueva estructura
        fake_quiz.study_space_id = fake_study_space.id
        fake_quiz.source_type = "study_space"  # NEW: Explicit source_type
        fake_quiz.source_document_id = None
        fake_quiz.source_summary_id = None
        fake_quiz.source_names = {"space": fake_study_space.name}
        fake_quiz.source_metadata = {"summary_count": 0}
        fake_quiz.study_space = fake_study_space

        with patch('app.services.quiz_service.QuizService') as MockQuizService, \
             patch('app.repositories.quiz_attempt_repository.QuizAttemptRepository') as MockAttemptRepo:

            mock_service = Mock()
            MockQuizService.return_value = mock_service
            mock_service.create_quiz_from_space.return_value = fake_quiz
            MockAttemptRepo.count_attempts_by_quiz.return_value = 0

            result = create_quiz_from_space(fake_study_space.id, request, fake_user, fake_db)

            assert result.id == fake_quiz.id
            assert result.source_type == "study_space"  # NEW: Check source_type
            assert result.study_space_name == fake_study_space.name
            assert result.num_questions == len(fake_quiz.questions)
            assert result.num_attempts == 0
            mock_service.create_quiz_from_space.assert_called_once()


class TestGetSpaceQuizzes:
    """Tests para obtener quizzes de espacio"""

    def test_get_space_quizzes_success(self, fake_user, fake_db, fake_study_space, fake_quiz):
        """Debe obtener quizzes del espacio"""
        fake_quiz.study_space_id = fake_study_space.id
        fake_quiz.summary_id = None
        fake_quiz.summary = None

        with patch('app.services.study_space_service.StudySpaceService.get_space') as mock_get_space, \
             patch('app.repositories.quiz_repository.QuizRepository') as MockQuizRepo, \
             patch('app.repositories.quiz_attempt_repository.QuizAttemptRepository') as MockAttemptRepo:

            mock_get_space.return_value = fake_study_space
            MockQuizRepo.get_quizzes_by_space.return_value = [fake_quiz]
            MockQuizRepo.count_quizzes_by_space.return_value = 1
            MockAttemptRepo.count_attempts_by_quiz.return_value = 3

            result = get_space_quizzes(fake_study_space.id, 0, 100, fake_user, fake_db)

            assert result.total == 1
            assert len(result.items) == 1
            assert result.items[0].study_space_name == fake_study_space.name

    def test_get_space_quizzes_empty(self, fake_user, fake_db, fake_study_space):
        """Debe retornar lista vacía si no hay quizzes"""
        with patch('app.services.study_space_service.StudySpaceService.get_space') as mock_get_space, \
             patch('app.repositories.quiz_repository.QuizRepository') as MockQuizRepo:

            mock_get_space.return_value = fake_study_space
            MockQuizRepo.get_quizzes_by_space.return_value = []
            MockQuizRepo.count_quizzes_by_space.return_value = 0

            result = get_space_quizzes(fake_study_space.id, 0, 100, fake_user, fake_db)

            assert result.total == 0
            assert len(result.items) == 0
