"""
Tests para los métodos __repr__ de los modelos.
Verifica que las representaciones de string sean correctas.
"""
import uuid
from datetime import datetime, timezone
from app.models.document import Document
from app.models.quiz import Quiz
from app.models.quiz_attempt import QuizAttempt
from app.models.study_space import StudySpace
from app.models.summary import Summary


def test_document_repr():
    """Test que Document.__repr__ formatea correctamente el tamaño en MB."""
    # Crear un documento de prueba con 2 MB (2 * 1024 * 1024 bytes)
    doc = Document(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        title="test_document.pdf",
        file_name="test_document.pdf",
        file_type="pdf",
        file_size_bytes=2097152,  # 2 MB
        file_content=b"test content",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    repr_str = repr(doc)

    assert "test_document.pdf" in repr_str
    assert "2.00MB" in repr_str
    assert repr_str.startswith("<Document")
    assert repr_str.endswith(">")


def test_document_repr_small_file():
    """Test que Document.__repr__ formatea correctamente archivos pequeños."""
    # Archivo de 500 KB
    doc = Document(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        title="small.txt",
        file_name="small.txt",
        file_type="txt",
        file_size_bytes=512000,  # ~0.5 MB
        file_content=b"small content",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    repr_str = repr(doc)

    assert "small.txt" in repr_str
    assert "0.49MB" in repr_str


def test_quiz_repr():
    """Test que Quiz.__repr__ muestra título y nivel de dificultad."""
    quiz = Quiz(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        study_space_id=uuid.uuid4(),
        source_type="document",
        title="Introducción a Python",
        difficulty_level=3,
        questions={"questions": []},
        created_at=datetime.now(timezone.utc)
    )

    repr_str = repr(quiz)

    assert "Quiz" in repr_str
    assert "Introducción a Python" in repr_str
    assert "Nivel 3" in repr_str
    assert repr_str.startswith("<Quiz")
    assert repr_str.endswith(">")


def test_quiz_repr_different_levels():
    """Test que Quiz.__repr__ funciona con diferentes niveles de dificultad."""
    for level in [1, 2, 3, 4, 5]:
        quiz = Quiz(
            id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            study_space_id=uuid.uuid4(),
            source_type="summary",
            title=f"Quiz Nivel {level}",
            difficulty_level=level,
            questions={"questions": []},
            created_at=datetime.now(timezone.utc)
        )

        repr_str = repr(quiz)
        assert f"Nivel {level}" in repr_str


def test_quiz_attempt_repr_completed():
    """Test que QuizAttempt.__repr__ muestra 'completado' cuando está completo."""
    attempt = QuizAttempt(
        id=uuid.uuid4(),
        quiz_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
        score=85.5,
        correct_answers={"answers": ["A", "B", "C"]},
        user_answers={"answers": ["A", "B", "D"]},
        quiz_title="Test Quiz"
    )

    repr_str = repr(attempt)

    assert "QuizAttempt" in repr_str
    assert "completado" in repr_str
    assert "85.5" in repr_str
    assert repr_str.startswith("<QuizAttempt")
    assert repr_str.endswith(">")


def test_quiz_attempt_repr_in_progress():
    """Test que QuizAttempt.__repr__ muestra 'en progreso' cuando no está completo."""
    attempt = QuizAttempt(
        id=uuid.uuid4(),
        quiz_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        started_at=datetime.now(timezone.utc),
        completed_at=None,
        score=None,
        correct_answers={"answers": ["A", "B", "C"]},
        user_answers={"answers": []},
        quiz_title="Test Quiz"
    )

    repr_str = repr(attempt)

    assert "QuizAttempt" in repr_str
    assert "en progreso" in repr_str
    assert "None" in repr_str  # Score es None


def test_study_space_repr():
    """Test que StudySpace.__repr__ muestra el nombre del espacio."""
    space = StudySpace(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        name="Matemáticas Avanzadas",
        description="Espacio para estudiar cálculo",
        color="#8B5CF6",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    repr_str = repr(space)

    assert "StudySpace" in repr_str
    assert "Matemáticas Avanzadas" in repr_str
    assert repr_str.startswith("<StudySpace")
    assert repr_str.endswith(">")


def test_study_space_repr_no_description():
    """Test que StudySpace.__repr__ funciona sin descripción."""
    space = StudySpace(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        name="Física",
        description=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    repr_str = repr(space)

    assert "Física" in repr_str


def test_summary_repr():
    """Test que Summary.__repr__ muestra título y nivel de expertise."""
    summary = Summary(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        document_id=uuid.uuid4(),
        study_space_id=uuid.uuid4(),
        title="Resumen de Álgebra Lineal",
        content={"sections": []},
        expertise_level="avanzado",
        topics={"topics": ["matrices", "vectores"]},
        key_concepts={"concepts": []},
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    repr_str = repr(summary)

    assert "Summary" in repr_str
    assert "Resumen de Álgebra Lineal" in repr_str
    assert "avanzado" in repr_str
    assert repr_str.startswith("<Summary")
    assert repr_str.endswith(">")


def test_summary_repr_all_expertise_levels():
    """Test que Summary.__repr__ funciona con todos los niveles de expertise."""
    levels = ["basico", "medio", "avanzado"]

    for level in levels:
        summary = Summary(
            id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            document_id=uuid.uuid4(),
            study_space_id=uuid.uuid4(),
            title=f"Resumen {level}",
            content={"sections": []},
            expertise_level=level,
            topics={"topics": []},
            key_concepts={"concepts": []},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )

        repr_str = repr(summary)
        assert level in repr_str
        assert f"Resumen {level}" in repr_str
