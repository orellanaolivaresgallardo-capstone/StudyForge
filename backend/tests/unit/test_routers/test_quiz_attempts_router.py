"""
Tests para el router de quiz attempts
"""
import pytest
from uuid import uuid4
from unittest.mock import Mock, patch
from fastapi import HTTPException, status
from datetime import datetime

from app.routers.quiz_attempts import (
    start_quiz_attempt,
    answer_question,
    complete_quiz_attempt,
    get_quiz_results,
)
from app.schemas.quiz_attempt import (
    QuizAttemptCreate,
    AnswerCreate,
)


class TestStartQuizAttempt:
    """Tests para iniciar un intento de quiz"""

    def test_start_quiz_attempt_success(self, fake_user, fake_quiz, fake_db):
        """Debe crear un intento de quiz exitosamente"""
        # Arrange
        attempt_data = QuizAttemptCreate(quiz_id=fake_quiz.id)
        fake_attempt = Mock()
        fake_attempt.id = uuid4()
        fake_attempt.quiz_id = fake_quiz.id
        fake_attempt.user_id = fake_user.id
        fake_attempt.started_at = datetime.now()
        fake_attempt.completed_at = None
        fake_attempt.score = None
        fake_attempt.correct_answers = ["A"]
        fake_attempt.user_answers = []

        randomized_questions = [
            {
                "question_text": "Test question?",
                "options": {"A": "Correct", "B": "Wrong1", "C": "Wrong2", "D": "Wrong3"},
            }
        ]

        with patch("app.routers.quiz_attempts.QuizRepository") as mock_quiz_repo, \
             patch("app.routers.quiz_attempts.QuizAttemptRepository") as mock_attempt_repo, \
             patch("app.routers.quiz_attempts.verify_quiz_ownership") as mock_verify:

            mock_quiz_repo.get_quiz_by_id.return_value = fake_quiz
            mock_verify.return_value = fake_quiz
            mock_attempt_repo.create_attempt.return_value = (fake_attempt, randomized_questions)

            # Act
            result = start_quiz_attempt(attempt_data, fake_user, fake_db)

            # Assert
            assert result.id == fake_attempt.id
            assert result.quiz_id == fake_quiz.id
            assert result.user_id == fake_user.id
            assert result.randomized_questions == randomized_questions
            mock_quiz_repo.get_quiz_by_id.assert_called_once_with(fake_db, fake_quiz.id)
            mock_verify.assert_called_once_with(fake_quiz, fake_user)
            mock_attempt_repo.create_attempt.assert_called_once()

    def test_start_quiz_attempt_quiz_not_found(self, fake_user, fake_db):
        """Debe fallar si el quiz no existe"""
        attempt_data = QuizAttemptCreate(quiz_id=uuid4())

        with patch("app.routers.quiz_attempts.QuizRepository") as mock_quiz_repo:
            mock_quiz_repo.get_quiz_by_id.return_value = None

            with pytest.raises(Exception):
                start_quiz_attempt(attempt_data, fake_user, fake_db)

    def test_start_quiz_attempt_not_owner(self, fake_user, fake_quiz, fake_db):
        """Debe fallar si el quiz no pertenece al usuario"""
        attempt_data = QuizAttemptCreate(quiz_id=fake_quiz.id)

        with patch("app.routers.quiz_attempts.QuizRepository") as mock_quiz_repo, \
             patch("app.routers.quiz_attempts.verify_quiz_ownership") as mock_verify:

            mock_quiz_repo.get_quiz_by_id.return_value = fake_quiz
            mock_verify.side_effect = HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No autorizado"
            )

            with pytest.raises(HTTPException) as exc_info:
                start_quiz_attempt(attempt_data, fake_user, fake_db)

            assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN


class TestAnswerQuestion:
    """Tests para responder preguntas"""

    def setup_method(self):
        """Setup común para tests de answer_question"""
        self.fake_attempt = Mock()
        self.fake_attempt.id = uuid4()
        self.fake_attempt.quiz_id = uuid4()
        self.fake_attempt.user_id = uuid4()
        self.fake_attempt.completed_at = None
        self.fake_attempt.correct_answers = ["A", "B", "C"]
        self.fake_attempt.user_answers = [None, None, None]

        self.fake_quiz = Mock()
        self.fake_quiz.id = self.fake_attempt.quiz_id
        self.fake_quiz.questions = [
            {
                "question": "Question 1?",
                "options": {"correct": "Option A", "semi-correct": "Option B", "incorrect1": "Option C", "incorrect2": "Option D"},
                "explanation": "Explanation 1"
            },
            {
                "question": "Question 2?",
                "options": {"correct": "Option A", "semi-correct": "Option B", "incorrect1": "Option C", "incorrect2": "Option D"},
                "explanation": "Explanation 2"
            },
            {
                "question": "Question 3?",
                "options": {"correct": "Option A", "semi-correct": "Option B", "incorrect1": "Option C", "incorrect2": "Option D"},
                "explanation": "Explanation 3"
            }
        ]

    def test_answer_question_correct(self, fake_user, fake_db):
        """Debe registrar respuesta correcta"""
        answer_data = AnswerCreate(question_index=0, selected_option="A")

        with patch("app.routers.quiz_attempts.QuizAttemptRepository") as mock_attempt_repo, \
             patch("app.routers.quiz_attempts.QuizRepository") as mock_quiz_repo, \
             patch("app.routers.quiz_attempts.verify_quiz_attempt_ownership") as mock_verify:

            mock_attempt_repo.get_attempt_by_id.return_value = self.fake_attempt
            mock_verify.return_value = self.fake_attempt
            mock_quiz_repo.get_quiz_by_id.return_value = self.fake_quiz
            mock_attempt_repo.record_answer.return_value = True
            mock_attempt_repo.calculate_score.return_value = 100.0

            result = answer_question(self.fake_attempt.id, answer_data, fake_user, fake_db)

            assert result.is_correct is True
            assert result.correct_option == "A"
            assert result.selected_option == "A"
            assert result.explanation == "Explanation 1"
            assert result.score_so_far == 100.0

    def test_answer_question_incorrect(self, fake_user, fake_db):
        """Debe registrar respuesta incorrecta"""
        answer_data = AnswerCreate(question_index=0, selected_option="C")

        with patch("app.routers.quiz_attempts.QuizAttemptRepository") as mock_attempt_repo, \
             patch("app.routers.quiz_attempts.QuizRepository") as mock_quiz_repo, \
             patch("app.routers.quiz_attempts.verify_quiz_attempt_ownership") as mock_verify:

            mock_attempt_repo.get_attempt_by_id.return_value = self.fake_attempt
            mock_verify.return_value = self.fake_attempt
            mock_quiz_repo.get_quiz_by_id.return_value = self.fake_quiz
            mock_attempt_repo.record_answer.return_value = False
            mock_attempt_repo.calculate_score.return_value = 0.0

            result = answer_question(self.fake_attempt.id, answer_data, fake_user, fake_db)

            assert result.is_correct is False
            assert result.correct_option == "A"
            assert result.selected_option == "C"

    def test_answer_question_already_completed(self, fake_user, fake_db):
        """Debe fallar si el intento ya fue completado"""
        self.fake_attempt.completed_at = datetime.now()
        answer_data = AnswerCreate(question_index=0, selected_option="A")

        with patch("app.routers.quiz_attempts.QuizAttemptRepository") as mock_attempt_repo, \
             patch("app.routers.quiz_attempts.verify_quiz_attempt_ownership") as mock_verify:

            mock_attempt_repo.get_attempt_by_id.return_value = self.fake_attempt
            mock_verify.return_value = self.fake_attempt

            with pytest.raises(HTTPException) as exc_info:
                answer_question(self.fake_attempt.id, answer_data, fake_user, fake_db)

            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
            assert "completado" in str(exc_info.value.detail)

    def test_answer_question_invalid_index(self, fake_user, fake_db):
        """Debe fallar con índice de pregunta inválido"""
        answer_data = AnswerCreate(question_index=10, selected_option="A")

        with patch("app.routers.quiz_attempts.QuizAttemptRepository") as mock_attempt_repo, \
             patch("app.routers.quiz_attempts.QuizRepository") as mock_quiz_repo, \
             patch("app.routers.quiz_attempts.verify_quiz_attempt_ownership") as mock_verify:

            mock_attempt_repo.get_attempt_by_id.return_value = self.fake_attempt
            mock_verify.return_value = self.fake_attempt
            mock_quiz_repo.get_quiz_by_id.return_value = self.fake_quiz

            with pytest.raises(HTTPException) as exc_info:
                answer_question(self.fake_attempt.id, answer_data, fake_user, fake_db)

            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
            assert "inválido" in str(exc_info.value.detail)

    def test_answer_question_already_answered(self, fake_user, fake_db):
        """Debe fallar si la pregunta ya fue respondida"""
        self.fake_attempt.user_answers = ["A", None, None]
        answer_data = AnswerCreate(question_index=0, selected_option="B")

        with patch("app.routers.quiz_attempts.QuizAttemptRepository") as mock_attempt_repo, \
             patch("app.routers.quiz_attempts.QuizRepository") as mock_quiz_repo, \
             patch("app.routers.quiz_attempts.verify_quiz_attempt_ownership") as mock_verify:

            mock_attempt_repo.get_attempt_by_id.return_value = self.fake_attempt
            mock_verify.return_value = self.fake_attempt
            mock_quiz_repo.get_quiz_by_id.return_value = self.fake_quiz

            with pytest.raises(HTTPException) as exc_info:
                answer_question(self.fake_attempt.id, answer_data, fake_user, fake_db)

            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
            assert "respondida" in str(exc_info.value.detail)

    def test_answer_question_record_error(self, fake_user, fake_db):
        """Debe manejar errores al registrar respuesta"""
        answer_data = AnswerCreate(question_index=0, selected_option="A")

        with patch("app.routers.quiz_attempts.QuizAttemptRepository") as mock_attempt_repo, \
             patch("app.routers.quiz_attempts.QuizRepository") as mock_quiz_repo, \
             patch("app.routers.quiz_attempts.verify_quiz_attempt_ownership") as mock_verify:

            mock_attempt_repo.get_attempt_by_id.return_value = self.fake_attempt
            mock_verify.return_value = self.fake_attempt
            mock_quiz_repo.get_quiz_by_id.return_value = self.fake_quiz
            mock_attempt_repo.record_answer.side_effect = ValueError("Error al registrar")

            with pytest.raises(HTTPException) as exc_info:
                answer_question(self.fake_attempt.id, answer_data, fake_user, fake_db)

            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


class TestCompleteQuizAttempt:
    """Tests para completar un intento de quiz"""

    def test_complete_quiz_attempt_success(self, fake_user, fake_db):
        """Debe completar un intento exitosamente"""
        fake_attempt = Mock()
        fake_attempt.id = uuid4()
        fake_attempt.quiz_id = uuid4()
        fake_attempt.user_id = fake_user.id
        fake_attempt.completed_at = None
        fake_attempt.user_answers = ["A", "B", "C"]
        fake_attempt.score = None

        completed_attempt = Mock()
        completed_attempt.id = fake_attempt.id
        completed_attempt.quiz_id = fake_attempt.quiz_id
        completed_attempt.user_id = fake_attempt.user_id
        completed_attempt.completed_at = datetime.now()
        completed_attempt.score = 85.5

        with patch("app.routers.quiz_attempts.QuizAttemptRepository") as mock_attempt_repo, \
             patch("app.routers.quiz_attempts.verify_quiz_attempt_ownership") as mock_verify:

            mock_attempt_repo.get_attempt_by_id.return_value = fake_attempt
            mock_verify.return_value = fake_attempt
            mock_attempt_repo.complete_attempt.return_value = completed_attempt

            result = complete_quiz_attempt(fake_attempt.id, fake_user, fake_db)

            assert result.id == completed_attempt.id
            assert result.score == 85.5
            assert result.completed_at is not None
            mock_attempt_repo.complete_attempt.assert_called_once_with(fake_db, fake_attempt)

    def test_complete_quiz_attempt_already_completed(self, fake_user, fake_db):
        """Debe fallar si el intento ya fue completado"""
        fake_attempt = Mock()
        fake_attempt.id = uuid4()
        fake_attempt.completed_at = datetime.now()

        with patch("app.routers.quiz_attempts.QuizAttemptRepository") as mock_attempt_repo, \
             patch("app.routers.quiz_attempts.verify_quiz_attempt_ownership") as mock_verify:

            mock_attempt_repo.get_attempt_by_id.return_value = fake_attempt
            mock_verify.return_value = fake_attempt

            with pytest.raises(HTTPException) as exc_info:
                complete_quiz_attempt(fake_attempt.id, fake_user, fake_db)

            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
            assert "completado" in str(exc_info.value.detail)

    def test_complete_quiz_attempt_no_answers(self, fake_user, fake_db):
        """Debe fallar si no se respondieron preguntas"""
        fake_attempt = Mock()
        fake_attempt.id = uuid4()
        fake_attempt.completed_at = None
        fake_attempt.user_answers = []

        with patch("app.routers.quiz_attempts.QuizAttemptRepository") as mock_attempt_repo, \
             patch("app.routers.quiz_attempts.verify_quiz_attempt_ownership") as mock_verify:

            mock_attempt_repo.get_attempt_by_id.return_value = fake_attempt
            mock_verify.return_value = fake_attempt

            with pytest.raises(HTTPException) as exc_info:
                complete_quiz_attempt(fake_attempt.id, fake_user, fake_db)

            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
            assert "preguntas" in str(exc_info.value.detail)

    def test_complete_quiz_attempt_null_answers(self, fake_user, fake_db):
        """Debe fallar si user_answers es None"""
        fake_attempt = Mock()
        fake_attempt.id = uuid4()
        fake_attempt.completed_at = None
        fake_attempt.user_answers = None

        with patch("app.routers.quiz_attempts.QuizAttemptRepository") as mock_attempt_repo, \
             patch("app.routers.quiz_attempts.verify_quiz_attempt_ownership") as mock_verify:

            mock_attempt_repo.get_attempt_by_id.return_value = fake_attempt
            mock_verify.return_value = fake_attempt

            with pytest.raises(HTTPException) as exc_info:
                complete_quiz_attempt(fake_attempt.id, fake_user, fake_db)

            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


class TestGetQuizResults:
    """Tests para obtener resultados de un quiz"""

    def test_get_quiz_results_success(self, fake_user, fake_db):
        """Debe obtener resultados exitosamente"""
        fake_attempt = Mock()
        fake_attempt.id = uuid4()
        fake_attempt.quiz_id = uuid4()
        fake_attempt.user_id = fake_user.id
        fake_attempt.completed_at = datetime.now()
        fake_attempt.score = 75.0
        fake_attempt.correct_answers = ["A", "B"]
        fake_attempt.user_answers = ["A", "C"]

        fake_quiz = Mock()
        fake_quiz.id = fake_attempt.quiz_id
        fake_quiz.questions = [
            {
                "question": "Question 1?",
                "options": {"correct": "Opt A", "semi-correct": "Opt B", "incorrect1": "Opt C", "incorrect2": "Opt D"},
                "explanation": "Explanation 1"
            },
            {
                "question": "Question 2?",
                "options": {"correct": "Opt A", "semi-correct": "Opt B", "incorrect1": "Opt C", "incorrect2": "Opt D"},
                "explanation": "Explanation 2"
            }
        ]

        with patch("app.routers.quiz_attempts.QuizAttemptRepository") as mock_attempt_repo, \
             patch("app.routers.quiz_attempts.QuizRepository") as mock_quiz_repo, \
             patch("app.routers.quiz_attempts.verify_quiz_attempt_ownership") as mock_verify:

            mock_attempt_repo.get_attempt_by_id.return_value = fake_attempt
            mock_verify.return_value = fake_attempt
            mock_quiz_repo.get_quiz_by_id.return_value = fake_quiz

            result = get_quiz_results(fake_attempt.id, fake_user, fake_db)

            assert result.attempt_id == fake_attempt.id
            assert result.quiz_id == fake_attempt.quiz_id
            assert result.score == 75.0
            assert result.total_questions == 2
            assert result.correct_answers == 1
            assert result.incorrect_answers == 1
            assert len(result.questions) == 2
            assert result.questions[0].is_correct is True
            assert result.questions[1].is_correct is False

    def test_get_quiz_results_not_completed(self, fake_user, fake_db):
        """Debe fallar si el intento no fue completado"""
        fake_attempt = Mock()
        fake_attempt.id = uuid4()
        fake_attempt.completed_at = None

        with patch("app.routers.quiz_attempts.QuizAttemptRepository") as mock_attempt_repo, \
             patch("app.routers.quiz_attempts.verify_quiz_attempt_ownership") as mock_verify:

            mock_attempt_repo.get_attempt_by_id.return_value = fake_attempt
            mock_verify.return_value = fake_attempt

            with pytest.raises(HTTPException) as exc_info:
                get_quiz_results(fake_attempt.id, fake_user, fake_db)

            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
            assert "completado" in str(exc_info.value.detail)

    def test_get_quiz_results_partial_answers(self, fake_user, fake_db):
        """Debe manejar resultados con respuestas parciales"""
        fake_attempt = Mock()
        fake_attempt.id = uuid4()
        fake_attempt.quiz_id = uuid4()
        fake_attempt.user_id = fake_user.id
        fake_attempt.completed_at = datetime.now()
        fake_attempt.score = 50.0
        fake_attempt.correct_answers = ["A", "B", "C"]
        fake_attempt.user_answers = ["A"]  # Solo respondió 1 de 3

        fake_quiz = Mock()
        fake_quiz.questions = [
            {"question": "Q1?", "options": {"correct": "A", "semi-correct": "B", "incorrect1": "C", "incorrect2": "D"}, "explanation": "E1"},
            {"question": "Q2?", "options": {"correct": "A", "semi-correct": "B", "incorrect1": "C", "incorrect2": "D"}, "explanation": "E2"},
            {"question": "Q3?", "options": {"correct": "A", "semi-correct": "B", "incorrect1": "C", "incorrect2": "D"}, "explanation": "E3"},
        ]

        with patch("app.routers.quiz_attempts.QuizAttemptRepository") as mock_attempt_repo, \
             patch("app.routers.quiz_attempts.QuizRepository") as mock_quiz_repo, \
             patch("app.routers.quiz_attempts.verify_quiz_attempt_ownership") as mock_verify:

            mock_attempt_repo.get_attempt_by_id.return_value = fake_attempt
            mock_verify.return_value = fake_attempt
            mock_quiz_repo.get_quiz_by_id.return_value = fake_quiz

            result = get_quiz_results(fake_attempt.id, fake_user, fake_db)

            assert result.total_questions == 3
            assert len(result.questions) == 1  # Solo la respondida

    def test_get_quiz_results_not_owner(self, fake_user, fake_db):
        """Debe fallar si el usuario no es dueño del intento"""
        fake_attempt = Mock()
        fake_attempt.id = uuid4()

        with patch("app.routers.quiz_attempts.QuizAttemptRepository") as mock_attempt_repo, \
             patch("app.routers.quiz_attempts.verify_quiz_attempt_ownership") as mock_verify:

            mock_attempt_repo.get_attempt_by_id.return_value = fake_attempt
            mock_verify.side_effect = HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No autorizado"
            )

            with pytest.raises(HTTPException) as exc_info:
                get_quiz_results(fake_attempt.id, fake_user, fake_db)

            assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
