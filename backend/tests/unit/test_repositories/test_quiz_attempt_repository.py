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
