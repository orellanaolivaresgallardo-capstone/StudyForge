"""
Tests unitarios para QuizService
"""
import pytest
from unittest.mock import Mock, patch
from app.services.quiz_service import QuizService


@patch('app.services.openai_service.settings')
def test_adaptive_difficulty_no_history(mock_settings):
    """Sin historial previo retorna dificultad 2 (default)"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_db = Mock()
    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    service = QuizService()
    difficulty = service.calculate_adaptive_difficulty(mock_db, "user-123", "mathematics")

    assert difficulty == 2


@patch('app.services.openai_service.settings')
def test_adaptive_difficulty_high_scores(mock_settings):
    """Scores altos (>=90%) retornan dificultad 5"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_db = Mock()

    # Mock de 5 intentos con scores altos
    attempts = [
        Mock(score=95.0),
        Mock(score=92.5),
        Mock(score=90.0),
        Mock(score=93.0),
        Mock(score=91.0),
    ]
    mock_db.execute.return_value.scalars.return_value.all.return_value = attempts

    service = QuizService()
    difficulty = service.calculate_adaptive_difficulty(mock_db, "user-123", "mathematics")

    assert difficulty == 5


@patch('app.services.openai_service.settings')
def test_adaptive_difficulty_medium_scores(mock_settings):
    """Scores medios (60-74%) retornan dificultad 3"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_db = Mock()

    attempts = [
        Mock(score=65.0),
        Mock(score=68.0),
        Mock(score=62.0),
        Mock(score=66.0),
        Mock(score=64.0),
    ]
    mock_db.execute.return_value.scalars.return_value.all.return_value = attempts

    service = QuizService()
    difficulty = service.calculate_adaptive_difficulty(mock_db, "user-123", "mathematics")

    # avg = 65%, debería ser dificultad 3
    assert difficulty == 3


@patch('app.services.openai_service.settings')
def test_adaptive_difficulty_low_scores(mock_settings):
    """Scores bajos (<40%) retornan dificultad 1"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_db = Mock()

    attempts = [
        Mock(score=30.0),
        Mock(score=35.0),
        Mock(score=32.0),
        Mock(score=28.0),
        Mock(score=35.0),
    ]
    mock_db.execute.return_value.scalars.return_value.all.return_value = attempts

    service = QuizService()
    difficulty = service.calculate_adaptive_difficulty(mock_db, "user-123", "mathematics")

    # avg = 32%, debería ser dificultad 1
    assert difficulty == 1


@patch('app.services.openai_service.settings')
def test_adaptive_difficulty_with_less_than_5_attempts(mock_settings):
    """Con menos de 5 intentos, calcula promedio correctamente"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_db = Mock()

    # Solo 3 intentos
    attempts = [
        Mock(score=80.0),
        Mock(score=82.0),
        Mock(score=78.0),
    ]
    mock_db.execute.return_value.scalars.return_value.all.return_value = attempts

    service = QuizService()
    difficulty = service.calculate_adaptive_difficulty(mock_db, "user-123", "mathematics")

    # avg = 80%, debería ser dificultad 4
    assert difficulty == 4
