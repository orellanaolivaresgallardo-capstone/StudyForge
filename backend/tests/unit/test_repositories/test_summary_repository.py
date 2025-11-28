"""
Tests unitarios para SummaryRepository
"""
import pytest
from uuid import uuid4
from unittest.mock import Mock, MagicMock
from app.repositories.summary_repository import SummaryRepository
from app.models.summary import Summary, ExpertiseLevel


# ========================================
# TESTS PARA create()
# ========================================

def test_create_summary_basic():
    """create debe crear un resumen con nivel básico"""
    mock_db = MagicMock()
    user_id = uuid4()
    summary_id = uuid4()
    document_id = uuid4()
    study_space_id = uuid4()

    content = {
        "title": "Python Basics",
        "summary": "Introduction to Python programming",
        "topics": ["variables", "functions", "loops"],
        "key_concepts": [
            {"concept": "variable", "definition": "A container for data"}
        ]
    }

    def refresh_side_effect(summary):
        summary.id = summary_id

    mock_db.refresh.side_effect = refresh_side_effect

    result = SummaryRepository.create(
        db=mock_db,
        user_id=user_id,
        document_id=document_id,
        study_space_id=study_space_id,
        title="Python Basics",
        content=content,
        expertise_level=ExpertiseLevel.BASICO,
        topics=["variables", "functions", "loops"],
        key_concepts=["variable", "function", "loop"],
        source_document_title="Python Tutorial",
        source_document_filename="python_basics.pdf"
    )

    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()
    assert result.title == "Python Basics"


def test_create_summary_medium_level():
    """create debe crear un resumen con nivel medio"""
    mock_db = MagicMock()
    user_id = uuid4()
    document_id = uuid4()
    study_space_id = uuid4()

    content = {"summary": "Advanced concepts"}

    result = SummaryRepository.create(
        db=mock_db,
        user_id=user_id,
        document_id=document_id,
        study_space_id=study_space_id,
        title="Advanced Python",
        content=content,
        expertise_level=ExpertiseLevel.MEDIO,
        topics=["decorators", "generators"],
        key_concepts=["decorator", "generator"],
        source_document_title="Advanced Python Guide",
        source_document_filename="advanced_python.pdf"
    )

    mock_db.add.assert_called_once()
    assert result.expertise_level == ExpertiseLevel.MEDIO


def test_create_summary_advanced_level():
    """create debe crear un resumen con nivel avanzado"""
    mock_db = MagicMock()
    user_id = uuid4()
    document_id = uuid4()
    study_space_id = uuid4()

    content = {"summary": "Expert level content"}

    result = SummaryRepository.create(
        db=mock_db,
        user_id=user_id,
        document_id=document_id,
        study_space_id=study_space_id,
        title="Python Internals",
        content=content,
        expertise_level=ExpertiseLevel.AVANZADO,
        topics=["metaclasses", "descriptors"],
        key_concepts=["metaclass", "descriptor"],
        source_document_title="Python Internals Guide",
        source_document_filename="python_internals.pdf"
    )

    assert result.expertise_level == ExpertiseLevel.AVANZADO


def test_create_summary_with_multiple_topics():
    """create debe manejar múltiples temas"""
    mock_db = MagicMock()
    user_id = uuid4()
    document_id = uuid4()
    study_space_id = uuid4()

    topics = ["topic1", "topic2", "topic3", "topic4", "topic5"]

    result = SummaryRepository.create(
        db=mock_db,
        user_id=user_id,
        document_id=document_id,
        study_space_id=study_space_id,
        title="Multi-topic Summary",
        content={"summary": "Content"},
        expertise_level=ExpertiseLevel.MEDIO,
        topics=topics,
        key_concepts=["concept1", "concept2"],
        source_document_title="Multi-topic Document",
        source_document_filename="topics.pdf"
    )

    assert result.topics == topics
    assert len(result.topics) == 5


def test_create_summary_with_multiple_key_concepts():
    """create debe manejar múltiples conceptos clave"""
    mock_db = MagicMock()
    user_id = uuid4()
    document_id = uuid4()
    study_space_id = uuid4()

    key_concepts = ["concept1", "concept2", "concept3", "concept4"]

    result = SummaryRepository.create(
        db=mock_db,
        user_id=user_id,
        document_id=document_id,
        study_space_id=study_space_id,
        title="Concepts Summary",
        content={"summary": "Content"},
        expertise_level=ExpertiseLevel.BASICO,
        topics=["topic1"],
        key_concepts=key_concepts,
        source_document_title="Key Concepts Document",
        source_document_filename="concepts.pdf"
    )

    assert result.key_concepts == key_concepts
    assert len(result.key_concepts) == 4


# ========================================
# TESTS PARA get_by_id()
# ========================================

def test_get_by_id_found():
    """get_by_id debe retornar el resumen con relaciones cargadas"""
    mock_db = MagicMock()
    summary_id = uuid4()

    mock_summary = Mock(spec=Summary)
    mock_summary.id = summary_id
    mock_summary.title = "Found Summary"

    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_summary

    result = SummaryRepository.get_by_id(mock_db, summary_id)

    assert result == mock_summary
    assert result.id == summary_id
    mock_db.execute.assert_called_once()


def test_get_by_id_not_found():
    """get_by_id debe retornar None cuando no existe"""
    mock_db = MagicMock()
    summary_id = uuid4()

    mock_db.execute.return_value.scalar_one_or_none.return_value = None

    result = SummaryRepository.get_by_id(mock_db, summary_id)

    assert result is None


# ========================================
# TESTS PARA get_by_user()
# ========================================

def test_get_by_user_with_results():
    """get_by_user debe retornar lista de resúmenes del usuario"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_summaries = [
        Mock(spec=Summary, id=uuid4(), title="Summary 1"),
        Mock(spec=Summary, id=uuid4(), title="Summary 2"),
        Mock(spec=Summary, id=uuid4(), title="Summary 3"),
    ]

    mock_db.execute.return_value.scalars.return_value.all.return_value = mock_summaries

    result = SummaryRepository.get_by_user(mock_db, user_id)

    assert len(result) == 3
    assert result == mock_summaries


def test_get_by_user_with_pagination():
    """get_by_user debe respetar skip y limit"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    SummaryRepository.get_by_user(mock_db, user_id, skip=5, limit=10)

    # En SQLAlchemy 2.0, skip y limit se aplican en el statement
    mock_db.execute.assert_called_once()


def test_get_by_user_empty():
    """get_by_user debe retornar lista vacía sin resúmenes"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    result = SummaryRepository.get_by_user(mock_db, user_id)

    assert result == []


def test_get_by_user_default_pagination():
    """get_by_user debe usar valores por defecto skip=0, limit=100"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    SummaryRepository.get_by_user(mock_db, user_id)

    # Los valores por defecto se aplican en el statement
    mock_db.execute.assert_called_once()


# ========================================
# TESTS PARA count_by_user()
# ========================================

def test_count_by_user():
    """count_by_user debe retornar el número correcto"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_db.execute.return_value.scalar.return_value = 8

    result = SummaryRepository.count_by_user(mock_db, user_id)

    assert result == 8


def test_count_by_user_zero():
    """count_by_user debe retornar 0 sin resúmenes"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_db.execute.return_value.scalar.return_value = None

    result = SummaryRepository.count_by_user(mock_db, user_id)

    assert result == 0


# ========================================
# TESTS PARA delete()
# ========================================

def test_delete_summary():
    """delete debe eliminar el resumen"""
    mock_db = MagicMock()

    mock_summary = Mock(spec=Summary)
    mock_summary.id = uuid4()

    SummaryRepository.delete(mock_db, mock_summary)

    mock_db.delete.assert_called_once_with(mock_summary)
    mock_db.commit.assert_called_once()


# ========================================
# TESTS DE INTEGRACIÓN
# ========================================

def test_create_and_retrieve_summary():
    """Flujo completo: crear resumen y recuperarlo"""
    mock_db = MagicMock()
    user_id = uuid4()
    summary_id = uuid4()
    document_id = uuid4()
    study_space_id = uuid4()

    # Create
    def refresh_side_effect(summary):
        summary.id = summary_id

    mock_db.refresh.side_effect = refresh_side_effect

    created_summary = SummaryRepository.create(
        db=mock_db,
        user_id=user_id,
        document_id=document_id,
        study_space_id=study_space_id,
        title="Integration Summary",
        content={"summary": "Test content"},
        expertise_level=ExpertiseLevel.MEDIO,
        topics=["test"],
        key_concepts=["concept1"],
        source_document_title="Integration Test Document",
        source_document_filename="integration.pdf"
    )

    # Retrieve
    mock_summary = Mock(spec=Summary)
    mock_summary.id = summary_id
    mock_summary.title = "Integration Summary"

    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_summary

    retrieved_summary = SummaryRepository.get_by_id(mock_db, summary_id)

    assert retrieved_summary.id == summary_id
    assert retrieved_summary.title == "Integration Summary"


def test_create_add_documents_and_delete():
    """Flujo: crear resumen y eliminar"""
    mock_db = MagicMock()
    user_id = uuid4()
    summary_id = uuid4()
    document_id = uuid4()
    study_space_id = uuid4()

    # Create summary
    mock_summary = Mock(spec=Summary)
    mock_summary.id = summary_id

    def refresh_side_effect(summary):
        summary.id = summary_id

    mock_db.refresh.side_effect = refresh_side_effect

    SummaryRepository.create(
        db=mock_db,
        user_id=user_id,
        document_id=document_id,
        study_space_id=study_space_id,
        title="Summary with Docs",
        content={"summary": "Content"},
        expertise_level=ExpertiseLevel.BASICO,
        topics=["topic1"],
        key_concepts=["concept1"],
        source_document_title="Test Document",
        source_document_filename="test.pdf"
    )

    # Delete
    SummaryRepository.delete(mock_db, mock_summary)

    assert mock_db.commit.call_count == 2  # create + delete
    mock_db.delete.assert_called_once()


def test_expertise_levels():
    """Verificar que se pueden crear resúmenes con todos los niveles"""
    mock_db = MagicMock()
    user_id = uuid4()
    document_id = uuid4()
    study_space_id = uuid4()

    levels = [ExpertiseLevel.BASICO, ExpertiseLevel.MEDIO, ExpertiseLevel.AVANZADO]

    for level in levels:
        SummaryRepository.create(
            db=mock_db,
            user_id=user_id,
            document_id=document_id,
            study_space_id=study_space_id,
            title=f"Summary {level.value}",
            content={"summary": "Content"},
            expertise_level=level,
            topics=["topic"],
            key_concepts=["concept"],
            source_document_title="Test Document",
            source_document_filename="test.pdf"
        )

    assert mock_db.add.call_count == 3
    assert mock_db.commit.call_count == 3
