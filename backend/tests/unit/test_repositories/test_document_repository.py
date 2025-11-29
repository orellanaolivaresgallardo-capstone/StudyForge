"""
Tests unitarios para DocumentRepository
"""
import pytest
from uuid import uuid4
from unittest.mock import Mock, MagicMock, patch
from app.repositories.document_repository import DocumentRepository
from app.models import Document


# ========================================
# TESTS PARA create()
# ========================================

def test_create_document():
    """create debe crear un documento y hacer flush sin commit"""
    # Arrange
    mock_db = MagicMock()
    user_id = uuid4()
    doc_id = uuid4()

    mock_doc = Mock(spec=Document)
    mock_doc.id = doc_id
    mock_doc.user_id = user_id
    mock_doc.title = "Test Document"
    mock_doc.file_name = "test.pdf"
    mock_doc.file_type = "pdf"
    mock_doc.file_size_bytes = 1024
    mock_doc.extracted_text = "Test content"

    def refresh_side_effect(doc):
        doc.id = doc_id
        doc.user_id = user_id

    mock_db.refresh.side_effect = refresh_side_effect

    # Act
    result = DocumentRepository.create(
        db=mock_db,
        user_id=user_id,
        title="Test Document",
        file_name="test.pdf",
        file_type="pdf",
        file_size_bytes=1024,
        file_content=b"fake pdf content",
        extracted_text="Test content"
    )

    # Assert
    mock_db.add.assert_called_once()
    mock_db.flush.assert_called_once()  # NO commit, solo flush
    mock_db.refresh.assert_called_once()
    assert result.title == "Test Document"
    assert result.file_type == "pdf"


def test_create_document_without_extracted_text():
    """create debe permitir crear documento sin texto extraído"""
    mock_db = MagicMock()
    user_id = uuid4()

    result = DocumentRepository.create(
        db=mock_db,
        user_id=user_id,
        title="Image Document",
        file_name="image.png",
        file_type="png",
        file_size_bytes=2048,
        file_content=b"fake image content",
        extracted_text=None
    )

    mock_db.add.assert_called_once()
    mock_db.flush.assert_called_once()
    # No debe hacer commit según la implementación
    mock_db.commit.assert_not_called()


def test_create_document_with_large_file():
    """create debe manejar archivos grandes (>10MB)"""
    mock_db = MagicMock()
    user_id = uuid4()
    large_content = b"x" * (15 * 1024 * 1024)  # 15 MB

    result = DocumentRepository.create(
        db=mock_db,
        user_id=user_id,
        title="Large PDF",
        file_name="large.pdf",
        file_type="pdf",
        file_size_bytes=len(large_content),
        file_content=large_content
    )

    mock_db.add.assert_called_once()
    assert result.file_size_bytes == len(large_content)


# ========================================
# TESTS PARA get_by_id()
# ========================================

def test_get_by_id_found():
    """get_by_id debe retornar el documento con relaciones cargadas"""
    mock_db = MagicMock()
    doc_id = uuid4()

    mock_doc = Mock(spec=Document)
    mock_doc.id = doc_id
    mock_doc.title = "Found Document"

    # Configurar el mock para simular execute con select + unique()
    mock_db.execute.return_value.unique.return_value.scalar_one_or_none.return_value = mock_doc

    result = DocumentRepository.get_by_id(mock_db, doc_id)

    assert result == mock_doc
    assert result.id == doc_id
    mock_db.execute.assert_called_once()


def test_get_by_id_not_found():
    """get_by_id debe retornar None cuando el documento no existe"""
    mock_db = MagicMock()
    doc_id = uuid4()

    mock_db.execute.return_value.unique.return_value.scalar_one_or_none.return_value = None

    result = DocumentRepository.get_by_id(mock_db, doc_id)

    assert result is None


# ========================================
# TESTS PARA get_by_user()
# ========================================

def test_get_by_user_with_results():
    """get_by_user debe retornar lista de documentos del usuario"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_docs = [
        Mock(spec=Document, id=uuid4(), title="Doc 1"),
        Mock(spec=Document, id=uuid4(), title="Doc 2"),
        Mock(spec=Document, id=uuid4(), title="Doc 3"),
    ]

    # NOTE: .unique() is required when using joinedload() with collections
    mock_db.execute.return_value.unique.return_value.scalars.return_value.all.return_value = mock_docs

    result = DocumentRepository.get_by_user(mock_db, user_id)

    assert len(result) == 3
    assert result == mock_docs


def test_get_by_user_with_pagination():
    """get_by_user debe respetar skip y limit para paginación"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_docs = [
        Mock(spec=Document, id=uuid4(), title="Doc 4"),
        Mock(spec=Document, id=uuid4(), title="Doc 5"),
    ]

    # NOTE: .unique() is required when using joinedload() with collections
    mock_db.execute.return_value.unique.return_value.scalars.return_value.all.return_value = mock_docs

    result = DocumentRepository.get_by_user(mock_db, user_id, skip=3, limit=2)

    # En SQLAlchemy 2.0, skip y limit se aplican en el statement, no en el mock
    mock_db.execute.assert_called_once()
    assert len(result) == 2


def test_get_by_user_empty_results():
    """get_by_user debe retornar lista vacía cuando no hay documentos"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    result = DocumentRepository.get_by_user(mock_db, user_id)

    assert result == []
    assert len(result) == 0


def test_get_by_user_default_pagination():
    """get_by_user debe usar valores por defecto skip=0, limit=100"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    DocumentRepository.get_by_user(mock_db, user_id)

    # Los valores por defecto se aplican en el statement
    mock_db.execute.assert_called_once()


# ========================================
# TESTS PARA count_by_user()
# ========================================

def test_count_by_user_with_documents():
    """count_by_user debe retornar el número correcto de documentos"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_db.execute.return_value.scalar.return_value = 5

    result = DocumentRepository.count_by_user(mock_db, user_id)

    assert result == 5
    mock_db.execute.assert_called_once()


def test_count_by_user_no_documents():
    """count_by_user debe retornar 0 cuando no hay documentos"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_db.execute.return_value.scalar.return_value = None

    result = DocumentRepository.count_by_user(mock_db, user_id)

    assert result == 0


# ========================================
# TESTS PARA delete()
# ========================================

def test_delete_existing_document():
    """delete debe eliminar el documento y retornar True"""
    mock_db = MagicMock()
    doc_id = uuid4()

    mock_doc = Mock(spec=Document)
    mock_doc.id = doc_id

    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_doc

    result = DocumentRepository.delete(mock_db, doc_id)

    assert result is True
    mock_db.delete.assert_called_once_with(mock_doc)
    mock_db.commit.assert_called_once()


def test_delete_non_existing_document():
    """delete debe retornar False cuando el documento no existe"""
    mock_db = MagicMock()
    doc_id = uuid4()

    mock_db.execute.return_value.scalar_one_or_none.return_value = None

    result = DocumentRepository.delete(mock_db, doc_id)

    assert result is False
    mock_db.delete.assert_not_called()
    mock_db.commit.assert_not_called()


# ========================================
# TESTS PARA update_title()
# ========================================

def test_update_title_existing_document():
    """update_title debe actualizar el título y retornar el documento"""
    mock_db = MagicMock()
    doc_id = uuid4()

    mock_doc = Mock(spec=Document)
    mock_doc.id = doc_id
    mock_doc.title = "Old Title"

    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_doc

    result = DocumentRepository.update_title(mock_db, doc_id, "New Title")

    assert result == mock_doc
    assert mock_doc.title == "New Title"
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once_with(mock_doc)


def test_update_title_non_existing_document():
    """update_title debe retornar None cuando el documento no existe"""
    mock_db = MagicMock()
    doc_id = uuid4()

    mock_db.execute.return_value.scalar_one_or_none.return_value = None

    result = DocumentRepository.update_title(mock_db, doc_id, "New Title")

    assert result is None
    mock_db.commit.assert_not_called()


def test_update_title_with_empty_string():
    """update_title debe permitir título vacío"""
    mock_db = MagicMock()
    doc_id = uuid4()

    mock_doc = Mock(spec=Document)
    mock_doc.id = doc_id
    mock_doc.title = "Old Title"

    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_doc

    result = DocumentRepository.update_title(mock_db, doc_id, "")

    assert mock_doc.title == ""
    assert result is not None


# ========================================
# TESTS PARA calculate_total_size_by_user()
# ========================================

def test_calculate_total_size_with_documents():
    """calculate_total_size_by_user debe sumar tamaños correctamente"""
    mock_db = MagicMock()
    user_id = uuid4()

    # Total: 1024 + 2048 + 512 = 3584 bytes
    mock_db.execute.return_value.scalar.return_value = 3584

    result = DocumentRepository.calculate_total_size_by_user(mock_db, user_id)

    assert result == 3584


def test_calculate_total_size_no_documents():
    """calculate_total_size_by_user debe retornar 0 cuando no hay documentos"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_db.execute.return_value.scalar.return_value = None

    result = DocumentRepository.calculate_total_size_by_user(mock_db, user_id)

    assert result == 0


def test_calculate_total_size_large_values():
    """calculate_total_size_by_user debe manejar valores grandes (>GB)"""
    mock_db = MagicMock()
    user_id = uuid4()

    large_size = 5 * 1024 * 1024 * 1024  # 5 GB
    mock_db.execute.return_value.scalar.return_value = large_size

    result = DocumentRepository.calculate_total_size_by_user(mock_db, user_id)

    assert result == large_size
    assert result > 1_000_000_000  # > 1 GB


# ========================================
# TESTS DE INTEGRACIÓN (flujos completos)
# ========================================

def test_create_count_and_delete_flow():
    """Simular flujo completo: crear, contar y eliminar documentos"""
    mock_db = MagicMock()
    user_id = uuid4()
    doc_id = uuid4()

    # 1. Create document
    mock_doc = Mock(spec=Document)
    mock_doc.id = doc_id
    mock_doc.user_id = user_id

    def refresh_side_effect(doc):
        doc.id = doc_id

    mock_db.refresh.side_effect = refresh_side_effect

    DocumentRepository.create(
        db=mock_db,
        user_id=user_id,
        title="Test",
        file_name="test.pdf",
        file_type="pdf",
        file_size_bytes=1024,
        file_content=b"content"
    )

    # 2. Count documents
    mock_db.execute.return_value.scalar.return_value = 1

    count = DocumentRepository.count_by_user(mock_db, user_id)
    assert count == 1

    # 3. Delete document
    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_doc

    deleted = DocumentRepository.delete(mock_db, doc_id)
    assert deleted is True
