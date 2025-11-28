"""
Fixtures compartidas para tests de StudyForge
"""
import pytest
from uuid import uuid4
from unittest.mock import Mock
from datetime import datetime


@pytest.fixture
def fake_user():
    """Usuario fake con cuota de almacenamiento"""
    from unittest.mock import PropertyMock

    user = Mock()
    user.id = uuid4()
    user.email = "test@studyforge.com"
    user.storage_quota_bytes = 10_000_000  # 10 MB
    user.storage_used_bytes = 0
    user.max_file_size_bytes = 5_000_000  # 5 MB

    # Agregar propiedades computadas como en el modelo User
    type(user).storage_available_bytes = PropertyMock(
        return_value=lambda: max(0, user.storage_quota_bytes - user.storage_used_bytes)
    )
    type(user).storage_usage_percentage = PropertyMock(
        return_value=lambda: (user.storage_used_bytes / user.storage_quota_bytes) * 100 if user.storage_quota_bytes > 0 else 0.0
    )

    # Hacer que las propiedades sean accesibles como atributos normales
    user.storage_available_bytes = max(0, user.storage_quota_bytes - user.storage_used_bytes)
    user.storage_usage_percentage = (user.storage_used_bytes / user.storage_quota_bytes) * 100 if user.storage_quota_bytes > 0 else 0.0

    return user


@pytest.fixture
def fake_study_space(fake_user):
    """Study space fake con relaciones vacías"""
    space = Mock()
    space.id = uuid4()
    space.user_id = fake_user.id
    space.name = "Test Space"
    space.description = "Test description"
    space.color = "#8B5CF6"
    space.created_at = datetime.now()
    space.updated_at = datetime.now()
    space.documents = []
    space.summaries = []
    return space


@pytest.fixture
def fake_document(fake_user):
    """Documento fake con texto extraído"""
    doc = Mock()
    doc.id = uuid4()
    doc.user_id = fake_user.id
    doc.title = "Test Document"
    doc.file_name = "test.pdf"
    doc.file_type = "pdf"
    doc.file_size_bytes = 1024
    doc.extracted_text = "This is extracted text. " * 10
    doc.created_at = datetime.now()
    doc.updated_at = datetime.now()
    doc.study_spaces = []
    return doc


@pytest.fixture
def fake_summary(fake_user, fake_study_space):
    """Resumen fake con JSONB content y denormalized fields"""
    summary = Mock()
    summary.id = uuid4()
    summary.user_id = fake_user.id
    summary.document_id = uuid4()  # NEW: Nullable FK (can be None if document deleted)
    summary.study_space_id = fake_study_space.id  # NEW: Required FK (NOT NULL, CASCADE)
    summary.title = "Test Summary"
    summary.content = {
        "summary": "Test summary content",
        "full_data": {"title": "Test", "summary": "..."}
    }
    summary.expertise_level = "medio"
    summary.topics = ["test", "topic"]
    summary.key_concepts = [
        {"concept": "Test", "definition": "A test concept"}
    ]
    # NEW: Denormalized cache fields
    summary.source_document_title = "Test Document"
    summary.source_document_filename = "test.pdf"
    summary.document_state = "active_in_space"  # 'active_in_space' | 'removed_from_space' | 'permanently_deleted'
    summary.created_at = datetime.now()
    summary.updated_at = datetime.now()
    # NEW: Relationship to study_space (1-N)
    summary.study_space = fake_study_space
    return summary


@pytest.fixture
def fake_quiz(fake_user, fake_study_space):
    """Quiz fake con preguntas y source tracking"""
    quiz = Mock()
    quiz.id = uuid4()
    quiz.user_id = fake_user.id
    quiz.study_space_id = fake_study_space.id  # NEW: Required FK (NOT NULL, CASCADE)
    quiz.source_type = "study_space"  # NEW: 'document' | 'summary' | 'study_space'
    quiz.title = "Test Quiz"
    quiz.difficulty_level = 3
    quiz.questions = [
        {
            "question": "Test question?",
            "options": {
                "correct": "A",
                "semi-correct": "B",
                "incorrect1": "C",
                "incorrect2": "D"
            },
            "explanation": "Test explanation"
        }
    ]
    # NEW: Source tracking fields (nullable, SET NULL on delete)
    quiz.source_document_id = None
    quiz.source_summary_id = None
    # NEW: Denormalized cache fields (JSONB)
    quiz.source_names = {"space": "Test Space"}
    quiz.source_metadata = {"summary_count": 0}
    quiz.created_at = datetime.now()
    # NEW: Relationship to study_space
    quiz.study_space = fake_study_space
    return quiz


@pytest.fixture
def fake_db():
    """Mock de database session"""
    db = Mock()
    db.commit = Mock()
    db.refresh = Mock()
    db.query = Mock()
    return db


@pytest.fixture
def sample_pdf_content():
    """Contenido de PDF válido para tests"""
    return b"%PDF-1.4\n%fake pdf content for testing purposes only"


def create_fake_quiz_attempt(quiz_id, user_id, score, completed=True):
    """Helper para crear quiz attempt fake"""
    attempt = Mock()
    attempt.id = uuid4()
    attempt.quiz_id = quiz_id
    attempt.user_id = user_id
    attempt.score = score if completed else None
    attempt.completed_at = datetime.now() if completed else None
    attempt.created_at = datetime.now()
    return attempt
