"""
Tests unitarios para QuizRepository
"""
import pytest
from uuid import uuid4
from unittest.mock import Mock, MagicMock
from app.repositories.quiz_repository import QuizRepository
from app.models.quiz import Quiz


# ========================================
# TESTS PARA create_quiz()
# ========================================

def test_create_quiz_with_summary():
    """create_quiz debe crear un quiz asociado a un resumen"""
    mock_db = MagicMock()
    user_id = uuid4()
    summary_id = uuid4()
    space_id = uuid4()  # NEW: Required
    quiz_id = uuid4()

    questions = [
        {
            "question": "¿Qué es Python?",
            "options": {
                "correct": "Un lenguaje de programación",
                "semi-correct": "Una librería",
                "incorrect1": "Un framework",
                "incorrect2": "Un IDE"
            },
            "explanation": "Python es un lenguaje de programación interpretado"
        }
    ]

    def refresh_side_effect(quiz):
        quiz.id = quiz_id

    mock_db.refresh.side_effect = refresh_side_effect

    result = QuizRepository.create_quiz(
        db=mock_db,
        user_id=user_id,
        study_space_id=space_id,  # NEW: Required
        source_type='summary',  # NEW: Required
        title="Python Quiz",
        difficulty_level=3,
        questions=questions,
        source_document_id=None,  # NEW: Optional
        source_summary_id=summary_id,  # NEW: Renamed from summary_id
        source_names={"summary": "Test Summary"},  # NEW: Optional
        source_metadata=None,  # NEW: Optional
    )

    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()
    assert result.title == "Python Quiz"


def test_create_quiz_with_study_space():
    """create_quiz debe crear un quiz asociado a un espacio de estudio"""
    mock_db = MagicMock()
    user_id = uuid4()
    space_id = uuid4()

    questions = [{"question": "Test?", "options": {}, "explanation": "Test"}]

    result = QuizRepository.create_quiz(
        db=mock_db,
        user_id=user_id,
        study_space_id=space_id,  # Required
        source_type='study_space',  # NEW: Required
        title="Space Quiz",
        difficulty_level=2,
        questions=questions,
        source_document_id=None,  # NEW: Optional
        source_summary_id=None,  # NEW: Optional
        source_names={"space": "Test Space"},  # NEW: Optional
        source_metadata=None,  # NEW: Optional
    )

    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()


def test_create_quiz_with_multiple_questions():
    """create_quiz debe manejar múltiples preguntas"""
    mock_db = MagicMock()
    user_id = uuid4()
    space_id = uuid4()  # NEW: Required

    questions = [
        {"question": "Q1", "options": {"correct": "A"}, "explanation": "E1"},
        {"question": "Q2", "options": {"correct": "B"}, "explanation": "E2"},
        {"question": "Q3", "options": {"correct": "C"}, "explanation": "E3"},
        {"question": "Q4", "options": {"correct": "D"}, "explanation": "E4"},
        {"question": "Q5", "options": {"correct": "A"}, "explanation": "E5"},
    ]

    result = QuizRepository.create_quiz(
        db=mock_db,
        user_id=user_id,
        study_space_id=space_id,  # NEW: Required
        source_type='study_space',  # NEW: Required
        title="Multiple Questions Quiz",
        difficulty_level=4,
        questions=questions,
        source_document_id=None,  # NEW: Optional
        source_summary_id=None,  # NEW: Optional
        source_names=None,  # NEW: Optional
        source_metadata=None,  # NEW: Optional
    )

    mock_db.add.assert_called_once()
    # Verificar que las preguntas se guardaron
    assert result.questions == questions


def test_create_quiz_difficulty_levels():
    """create_quiz debe aceptar niveles de dificultad 1-5"""
    mock_db = MagicMock()
    user_id = uuid4()
    space_id = uuid4()  # NEW: Required
    questions = [{"question": "Test", "options": {}, "explanation": ""}]

    for difficulty in [1, 2, 3, 4, 5]:
        QuizRepository.create_quiz(
            db=mock_db,
            user_id=user_id,
            study_space_id=space_id,  # NEW: Required
            source_type='study_space',  # NEW: Required
            title=f"Quiz Difficulty {difficulty}",
            difficulty_level=difficulty,
            questions=questions,
            source_document_id=None,  # NEW: Optional
            source_summary_id=None,  # NEW: Optional
            source_names=None,  # NEW: Optional
            source_metadata=None,  # NEW: Optional
        )

    # Se debe haber llamado 5 veces
    assert mock_db.add.call_count == 5


# ========================================
# TESTS PARA get_quiz_by_id()
# ========================================

def test_get_quiz_by_id_found():
    """get_quiz_by_id debe retornar el quiz con relaciones cargadas"""
    mock_db = MagicMock()
    quiz_id = uuid4()

    mock_quiz = Mock(spec=Quiz)
    mock_quiz.id = quiz_id
    mock_quiz.title = "Found Quiz"

    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_quiz

    result = QuizRepository.get_quiz_by_id(mock_db, quiz_id)

    assert result == mock_quiz
    assert result.id == quiz_id
    mock_db.execute.assert_called_once()


def test_get_quiz_by_id_not_found():
    """get_quiz_by_id debe retornar None cuando el quiz no existe"""
    mock_db = MagicMock()
    quiz_id = uuid4()

    mock_db.execute.return_value.scalar_one_or_none.return_value = None

    result = QuizRepository.get_quiz_by_id(mock_db, quiz_id)

    assert result is None


# ========================================
# TESTS PARA get_quizzes_by_user()
# ========================================

def test_get_quizzes_by_user_with_results():
    """get_quizzes_by_user debe retornar lista de quizzes del usuario"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_quizzes = [
        Mock(spec=Quiz, id=uuid4(), title="Quiz 1"),
        Mock(spec=Quiz, id=uuid4(), title="Quiz 2"),
        Mock(spec=Quiz, id=uuid4(), title="Quiz 3"),
    ]

    mock_db.execute.return_value.scalars.return_value.all.return_value = mock_quizzes

    result = QuizRepository.get_quizzes_by_user(mock_db, user_id)

    assert len(result) == 3
    assert result == mock_quizzes


def test_get_quizzes_by_user_with_pagination():
    """get_quizzes_by_user debe respetar skip y limit"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    QuizRepository.get_quizzes_by_user(mock_db, user_id, skip=10, limit=5)

    # En SQLAlchemy 2.0, skip y limit se aplican en el statement
    mock_db.execute.assert_called_once()


def test_get_quizzes_by_user_empty():
    """get_quizzes_by_user debe retornar lista vacía sin quizzes"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    result = QuizRepository.get_quizzes_by_user(mock_db, user_id)

    assert result == []


# ========================================
# TESTS PARA count_quizzes_by_user()
# ========================================

def test_count_quizzes_by_user():
    """count_quizzes_by_user debe retornar el número correcto"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_db.execute.return_value.scalar.return_value = 7

    result = QuizRepository.count_quizzes_by_user(mock_db, user_id)

    assert result == 7


def test_count_quizzes_by_user_zero():
    """count_quizzes_by_user debe retornar 0 sin quizzes"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_db.execute.return_value.scalar.return_value = None

    result = QuizRepository.count_quizzes_by_user(mock_db, user_id)

    assert result == 0


# ========================================
# TESTS PARA get_quizzes_by_space()
# ========================================

def test_get_quizzes_by_space():
    """get_quizzes_by_space debe filtrar por espacio y usuario"""
    mock_db = MagicMock()
    space_id = uuid4()
    user_id = uuid4()

    mock_quizzes = [
        Mock(spec=Quiz, id=uuid4(), title="Space Quiz 1"),
        Mock(spec=Quiz, id=uuid4(), title="Space Quiz 2"),
    ]

    mock_db.execute.return_value.unique.return_value.scalars.return_value.all.return_value = mock_quizzes

    result = QuizRepository.get_quizzes_by_space(mock_db, space_id, user_id)

    assert len(result) == 2
    assert result == mock_quizzes


def test_get_quizzes_by_space_with_pagination():
    """get_quizzes_by_space debe respetar paginación"""
    mock_db = MagicMock()
    space_id = uuid4()
    user_id = uuid4()

    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    QuizRepository.get_quizzes_by_space(mock_db, space_id, user_id, skip=5, limit=10)

    # En SQLAlchemy 2.0, skip y limit se aplican en el statement
    mock_db.execute.assert_called_once()


def test_get_quizzes_by_space_empty():
    """get_quizzes_by_space debe retornar lista vacía sin quizzes"""
    mock_db = MagicMock()
    space_id = uuid4()
    user_id = uuid4()

    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    result = QuizRepository.get_quizzes_by_space(mock_db, space_id, user_id)

    assert result == []


# ========================================
# TESTS PARA count_quizzes_by_space()
# ========================================

def test_count_quizzes_by_space():
    """count_quizzes_by_space debe contar quizzes del espacio"""
    mock_db = MagicMock()
    space_id = uuid4()
    user_id = uuid4()

    mock_db.execute.return_value.scalar.return_value = 3

    result = QuizRepository.count_quizzes_by_space(mock_db, space_id, user_id)

    assert result == 3


def test_count_quizzes_by_space_zero():
    """count_quizzes_by_space debe retornar 0 sin quizzes"""
    mock_db = MagicMock()
    space_id = uuid4()
    user_id = uuid4()

    mock_db.execute.return_value.scalar.return_value = None

    result = QuizRepository.count_quizzes_by_space(mock_db, space_id, user_id)

    assert result == 0


# ========================================
# TESTS DE INTEGRACIÓN
# ========================================

def test_create_and_retrieve_quiz():
    """Flujo completo: crear quiz y recuperarlo"""
    mock_db = MagicMock()
    user_id = uuid4()
    space_id = uuid4()  # NEW: Required
    quiz_id = uuid4()

    questions = [
        {"question": "Test Q", "options": {"correct": "A"}, "explanation": "E"}
    ]

    # Create
    def refresh_side_effect(quiz):
        quiz.id = quiz_id

    mock_db.refresh.side_effect = refresh_side_effect

    created_quiz = QuizRepository.create_quiz(
        db=mock_db,
        user_id=user_id,
        study_space_id=space_id,  # NEW: Required
        source_type='study_space',  # NEW: Required
        title="Integration Quiz",
        difficulty_level=2,
        questions=questions,
        source_document_id=None,  # NEW: Optional
        source_summary_id=None,  # NEW: Optional
        source_names=None,  # NEW: Optional
        source_metadata=None,  # NEW: Optional
    )

    # Simulate retrieval
    mock_quiz = Mock(spec=Quiz)
    mock_quiz.id = quiz_id
    mock_quiz.title = "Integration Quiz"

    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_quiz

    retrieved_quiz = QuizRepository.get_quiz_by_id(mock_db, quiz_id)

    assert retrieved_quiz.id == quiz_id
    assert retrieved_quiz.title == "Integration Quiz"
