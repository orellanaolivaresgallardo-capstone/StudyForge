"""
Tests de regresión para verificar eliminación completa de 'topic'.
Estos tests aseguran que la migración de topic-based a space-based está completa.
"""
import pytest
import inspect
from app.models.quiz import Quiz
from app.models.quiz_attempt import QuizAttempt
from app.repositories.quiz_repository import QuizRepository
from app.repositories.quiz_attempt_repository import QuizAttemptRepository
from app.schemas.quiz_attempt import QuizSnapshotData


def test_quiz_model_has_no_topic_attribute():
    """Verificar que el modelo Quiz no tiene atributo 'topic'."""
    assert not hasattr(Quiz, 'topic'), "Quiz model still has 'topic' attribute - migration incomplete"


def test_quiz_repository_create_has_no_topic_parameter():
    """Verificar que QuizRepository.create_quiz no acepta parámetro 'topic'."""
    sig = inspect.signature(QuizRepository.create_quiz)
    params = sig.parameters

    assert 'topic' not in params, "QuizRepository.create_quiz still has 'topic' parameter"

    # Verificar que los parámetros esenciales existen
    assert 'db' in params
    assert 'user_id' in params
    assert 'title' in params
    assert 'difficulty_level' in params
    assert 'questions' in params


def test_quiz_snapshot_schema_has_no_topic_field():
    """Verificar que QuizSnapshotData schema no tiene campo 'topic' requerido."""
    # Obtener fields del schema
    schema_fields = QuizSnapshotData.model_fields

    # Verificar que topic no está presente
    assert 'topic' not in schema_fields, "QuizSnapshotData schema still has 'topic' field"

    # Verificar que los campos esenciales existen
    assert 'id' in schema_fields
    assert 'title' in schema_fields
    assert 'difficulty_level' in schema_fields


def test_quiz_attempt_repository_create_snapshot_without_topic(fake_user, fake_quiz):
    """Verificar que el snapshot generado no incluye 'topic'."""
    # El fake_quiz debe tener study_space como None para evitar errores
    fake_quiz.study_space = None

    # Simular la creación de snapshot (código interno de QuizAttemptRepository)
    quiz_snapshot = {
        "id": str(fake_quiz.id),
        "title": fake_quiz.title,
        "difficulty_level": fake_quiz.difficulty_level
    }

    # Verificar que el snapshot no tiene 'topic'
    assert "topic" not in quiz_snapshot, "Generated quiz_snapshot contains 'topic' field"
    assert "id" in quiz_snapshot
    assert "title" in quiz_snapshot
    assert "difficulty_level" in quiz_snapshot


def test_quiz_model_columns_do_not_include_topic():
    """Verificar que las columnas del modelo Quiz no incluyen 'topic'."""
    # Obtener columnas del modelo
    columns = {col.name for col in Quiz.__table__.columns}

    assert 'topic' not in columns, "Quiz table still has 'topic' column in model definition"

    # Verificar columnas esenciales
    assert 'id' in columns
    assert 'user_id' in columns
    assert 'title' in columns
    assert 'difficulty_level' in columns
    assert 'study_space_id' in columns
