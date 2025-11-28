"""
Tests unitarios para QuizAttemptRepository
"""
import pytest
from unittest.mock import Mock
from app.repositories.quiz_attempt_repository import QuizAttemptRepository


# Tests para _randomize_options

def test_randomize_options_structure():
    """Verifica estructura de salida correcta"""
    questions = [
        {
            "question": "What is 2+2?",
            "options": {
                "correct": "4",
                "semi-correct": "3",
                "incorrect1": "5",
                "incorrect2": "6"
            },
            "explanation": "Basic math"
        }
    ]

    correct_answers, randomized_questions = QuizAttemptRepository._randomize_options(questions)

    assert len(correct_answers) == 1
    assert correct_answers[0] in ['A', 'B', 'C', 'D']
    assert len(randomized_questions) == 1
    assert len(randomized_questions[0]['options']) == 4
    assert 'A' in randomized_questions[0]['options']
    assert 'B' in randomized_questions[0]['options']
    assert 'C' in randomized_questions[0]['options']
    assert 'D' in randomized_questions[0]['options']


def test_randomize_options_correct_answer_mapping():
    """Verifica que la respuesta correcta se mapea a la letra correcta"""
    questions = [
        {
            "question": "Test?",
            "options": {
                "correct": "Correct Answer",
                "semi-correct": "Semi",
                "incorrect1": "Wrong1",
                "incorrect2": "Wrong2"
            },
            "explanation": "Test"
        }
    ]

    correct_answers, randomized_questions = QuizAttemptRepository._randomize_options(questions)

    # La letra de correct_answers debe apuntar a "Correct Answer"
    correct_letter = correct_answers[0]
    assert randomized_questions[0]['options'][correct_letter] == "Correct Answer"


def test_randomize_options_multiple_questions():
    """Verifica aleatoriedad con múltiples preguntas"""
    questions = [
        {
            "question": f"Q{i}?",
            "options": {
                "correct": f"C{i}",
                "semi-correct": f"S{i}",
                "incorrect1": f"I1{i}",
                "incorrect2": f"I2{i}"
            },
            "explanation": f"E{i}"
        }
        for i in range(5)
    ]

    correct_answers, randomized_questions = QuizAttemptRepository._randomize_options(questions)

    assert len(correct_answers) == 5
    assert len(randomized_questions) == 5

    # Verificar que las respuestas correctas están mapeadas correctamente
    for i in range(5):
        correct_letter = correct_answers[i]
        assert randomized_questions[i]['options'][correct_letter] == f"C{i}"


def test_randomize_options_preserves_explanation():
    """Verifica que explanation se preserve en questions aleatorizadas"""
    questions = [
        {
            "question": "Test?",
            "options": {
                "correct": "A",
                "semi-correct": "B",
                "incorrect1": "C",
                "incorrect2": "D"
            },
            "explanation": "Important explanation"
        }
    ]

    _, randomized_questions = QuizAttemptRepository._randomize_options(questions)

    assert randomized_questions[0]['explanation'] == "Important explanation"
    assert randomized_questions[0]['question'] == "Test?"


# Tests para calculate_score

def test_calculate_score_all_correct():
    """100% de respuestas correctas = 100.0"""
    attempt = Mock()
    attempt.correct_answers = ['A', 'B', 'C', 'D']
    attempt.user_answers = ['A', 'B', 'C', 'D']

    score = QuizAttemptRepository.calculate_score(attempt)

    assert score == 100.0


def test_calculate_score_all_incorrect():
    """0% de respuestas correctas = 0.0"""
    attempt = Mock()
    attempt.correct_answers = ['A', 'B', 'C', 'D']
    attempt.user_answers = ['B', 'C', 'D', 'A']

    score = QuizAttemptRepository.calculate_score(attempt)

    assert score == 0.0


def test_calculate_score_half_correct():
    """50% de respuestas correctas = 50.0"""
    attempt = Mock()
    attempt.correct_answers = ['A', 'B', 'C', 'D']
    attempt.user_answers = ['A', 'B', 'X', 'X']

    score = QuizAttemptRepository.calculate_score(attempt)

    assert score == 50.0


def test_calculate_score_no_answers():
    """Sin respuestas retorna 0.0"""
    attempt = Mock()
    attempt.correct_answers = ['A', 'B', 'C']
    attempt.user_answers = []

    score = QuizAttemptRepository.calculate_score(attempt)

    assert score == 0.0


def test_calculate_score_with_none_answers():
    """Respuestas None cuentan como incorrectas"""
    attempt = Mock()
    attempt.correct_answers = ['A', 'B', 'C', 'D']
    attempt.user_answers = ['A', None, 'C', None]

    score = QuizAttemptRepository.calculate_score(attempt)

    assert score == 50.0  # 2 de 4 correctas


# Tests para create_attempt

def test_create_attempt_success(fake_db, fake_quiz, fake_user):
    """Debe crear intento con opciones aleatorizadas"""
    fake_quiz.questions = [
        {
            "question": "Q1?",
            "options": {"correct": "C1", "semi-correct": "S1", "incorrect1": "I1", "incorrect2": "I2"},
            "explanation": "E1"
        }
    ]
    fake_quiz.study_space = None

    attempt, randomized_questions = QuizAttemptRepository.create_attempt(fake_db, fake_quiz, fake_user.id)

    assert attempt.quiz_id == fake_quiz.id
    assert attempt.user_id == fake_user.id
    assert len(randomized_questions) == 1
    assert len(attempt.correct_answers) == 1
    assert attempt.user_answers == []
    fake_db.add.assert_called_once()
    fake_db.commit.assert_called_once()


def test_create_attempt_with_study_space(fake_db, fake_quiz, fake_user, fake_study_space):
    """Debe crear intento con snapshot de espacio de estudio"""
    fake_quiz.questions = [{"question": "Q?", "options": {"correct": "C", "semi-correct": "S", "incorrect1": "I1", "incorrect2": "I2"}, "explanation": "E"}]
    fake_quiz.study_space = fake_study_space

    attempt, _ = QuizAttemptRepository.create_attempt(fake_db, fake_quiz, fake_user.id)

    assert attempt.study_space_snapshot is not None
    assert attempt.study_space_snapshot["id"] == str(fake_study_space.id)
    assert attempt.study_space_snapshot["name"] == fake_study_space.name


# Tests para get_attempt_by_id

def test_get_attempt_by_id_success(fake_db):
    """Debe obtener intento por ID"""
    from uuid import uuid4
    attempt_id = uuid4()
    fake_attempt = Mock()

    fake_db.execute.return_value.scalar_one_or_none.return_value = fake_attempt

    result = QuizAttemptRepository.get_attempt_by_id(fake_db, attempt_id)

    assert result == fake_attempt


def test_get_attempt_by_id_not_found(fake_db):
    """Debe retornar None si no existe"""
    from uuid import uuid4
    attempt_id = uuid4()

    fake_db.execute.return_value.scalar_one_or_none.return_value = None

    result = QuizAttemptRepository.get_attempt_by_id(fake_db, attempt_id)

    assert result is None


# Tests para get_attempts_by_user

def test_get_attempts_by_user_success(fake_db, fake_user):
    """Debe obtener intentos del usuario"""
    fake_attempts = [Mock(), Mock()]

    fake_db.execute.return_value.scalars.return_value.all.return_value = fake_attempts

    result = QuizAttemptRepository.get_attempts_by_user(fake_db, fake_user.id, skip=0, limit=100)

    assert len(result) == 2


def test_get_attempts_by_user_empty(fake_db, fake_user):
    """Debe retornar lista vacía si no hay intentos"""
    fake_db.execute.return_value.scalars.return_value.all.return_value = []

    result = QuizAttemptRepository.get_attempts_by_user(fake_db, fake_user.id)

    assert result == []


# Tests para get_attempts_by_quiz

def test_get_attempts_by_quiz_success(fake_db, fake_quiz, fake_user):
    """Debe obtener intentos de un quiz"""
    fake_attempts = [Mock()]

    fake_db.execute.return_value.scalars.return_value.all.return_value = fake_attempts

    result = QuizAttemptRepository.get_attempts_by_quiz(fake_db, fake_quiz.id, fake_user.id)

    assert len(result) == 1


# Tests para count_attempts_by_quiz

def test_count_attempts_by_quiz_success(fake_db, fake_quiz, fake_user):
    """Debe contar intentos completados"""
    fake_db.execute.return_value.scalar.return_value = 5

    result = QuizAttemptRepository.count_attempts_by_quiz(fake_db, fake_quiz.id, fake_user.id)

    assert result == 5


def test_count_attempts_by_quiz_zero(fake_db, fake_quiz, fake_user):
    """Debe retornar 0 si no hay intentos"""
    fake_db.execute.return_value.scalar.return_value = None

    result = QuizAttemptRepository.count_attempts_by_quiz(fake_db, fake_quiz.id, fake_user.id)

    assert result == 0


# Tests para record_answer

def test_record_answer_correct(fake_db):
    """Debe registrar respuesta correcta"""
    attempt = Mock()
    attempt.correct_answers = ['A', 'B', 'C']
    attempt.user_answers = []

    is_correct = QuizAttemptRepository.record_answer(fake_db, attempt, 0, 'A')

    assert is_correct is True
    assert attempt.user_answers == ['A']
    fake_db.commit.assert_called_once()


def test_record_answer_incorrect(fake_db):
    """Debe registrar respuesta incorrecta"""
    attempt = Mock()
    attempt.correct_answers = ['A', 'B', 'C']
    attempt.user_answers = []

    is_correct = QuizAttemptRepository.record_answer(fake_db, attempt, 0, 'B')

    assert is_correct is False
    assert attempt.user_answers == ['B']


def test_record_answer_invalid_index(fake_db):
    """Debe lanzar ValueError con índice inválido"""
    attempt = Mock()
    attempt.correct_answers = ['A', 'B']
    attempt.user_answers = []

    with pytest.raises(ValueError):
        QuizAttemptRepository.record_answer(fake_db, attempt, 5, 'A')


def test_record_answer_fills_gaps(fake_db):
    """Debe rellenar con None si hay gaps"""
    attempt = Mock()
    attempt.correct_answers = ['A', 'B', 'C', 'D']
    attempt.user_answers = ['A']

    QuizAttemptRepository.record_answer(fake_db, attempt, 3, 'D')

    assert attempt.user_answers == ['A', None, None, 'D']


# Tests para complete_attempt

def test_complete_attempt_success(fake_db):
    """Debe completar intento y calcular score"""
    from datetime import datetime
    attempt = Mock()
    attempt.correct_answers = ['A', 'B', 'C']
    attempt.user_answers = ['A', 'B', 'X']

    result = QuizAttemptRepository.complete_attempt(fake_db, attempt)

    assert result.score == pytest.approx(66.67, abs=0.01)
    assert result.completed_at is not None
    fake_db.commit.assert_called_once()


# Tests para get_recent_attempts_by_space

def test_get_recent_attempts_by_space_success(fake_db, fake_user, fake_study_space):
    """Debe obtener intentos recientes por espacio"""
    fake_attempts = [Mock(), Mock()]

    fake_db.execute.return_value.scalars.return_value.all.return_value = fake_attempts

    result = QuizAttemptRepository.get_recent_attempts_by_space(fake_db, fake_user.id, fake_study_space.id, limit=5)

    assert len(result) == 2
