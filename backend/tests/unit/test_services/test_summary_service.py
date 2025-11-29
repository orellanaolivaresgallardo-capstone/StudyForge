"""
Tests unitarios para SummaryService
"""
import pytest
import io
from uuid import uuid4
from unittest.mock import Mock, MagicMock, patch, AsyncMock
from fastapi import HTTPException, UploadFile
from app.services.summary_service import SummaryService
from app.models.summary import Summary, ExpertiseLevel
from app.models.user import User
from app.models.document import Document


# ========================================
# TESTS PARA __init__()
# ========================================

@patch('app.services.summary_service.OpenAIService')
def test_init(mock_openai_service):
    """__init__ debe inicializar OpenAIService"""
    service = SummaryService()
    mock_openai_service.assert_called_once()


# ========================================
# TESTS PARA create_summary_from_file()
# ========================================

@patch('app.services.summary_service.OpenAIService')
@patch('app.services.summary_service.FileProcessor')
@patch('app.services.summary_service.UserRepository')
@patch('app.services.summary_service.DocumentRepository')
@patch('app.services.summary_service.SummaryRepository')
@patch('app.repositories.study_space_repository.StudySpaceRepository')
@patch('app.core.dependencies.verify_space_ownership')
@patch('app.services.summary_service.log_quota_event')
@patch('app.services.summary_service.log_openai_request')
@pytest.mark.asyncio
async def test_create_summary_from_file_success(
    mock_log_openai, mock_log_quota, mock_verify_space, mock_space_repo, mock_summary_repo, mock_doc_repo,
    mock_user_repo, mock_file_processor, mock_openai_service
):
    """create_summary_from_file debe crear resumen exitosamente"""
    mock_db = MagicMock()
    user_id = uuid4()
    study_space_id = uuid4()

    # Mock file
    file_content = b"This is test content for a PDF file"
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "test.pdf"
    mock_file.read = AsyncMock(return_value=file_content)
    mock_file.seek = AsyncMock()

    # Mock FileProcessor
    mock_file_processor.validate_file.return_value = ("test.pdf", "pdf")
    mock_file_processor.extract_text = AsyncMock(return_value="Extracted text from PDF")

    # Mock User with enough quota
    mock_user = Mock(spec=User)
    mock_user.id = user_id
    mock_user.max_file_size_bytes = 10 * 1024 * 1024  # 10MB
    mock_user.storage_quota_bytes = 100 * 1024 * 1024  # 100MB
    mock_user.storage_used_bytes = 0
    mock_user.storage_available_bytes = 100 * 1024 * 1024
    mock_user_repo.get_by_id.return_value = mock_user

    # Mock StudySpace
    mock_study_space = Mock()
    mock_study_space.id = study_space_id
    mock_study_space.name = "Test Space"
    mock_study_space.color = "#8B5CF6"
    mock_space_repo.get_by_id.return_value = mock_study_space
    mock_verify_space.return_value = mock_study_space

    # Mock OpenAI response
    mock_openai = Mock()
    mock_openai.model = "gpt-4"
    mock_openai.generate_summary.return_value = {
        "title": "Test Summary",
        "summary": "This is a summary",
        "topics": ["topic1", "topic2"],
        "key_concepts": [{"concept": "test", "definition": "test def"}]
    }
    mock_openai_service.return_value = mock_openai

    # Mock Document creation
    mock_document = Mock(spec=Document)
    mock_document.id = uuid4()
    mock_document.title = "test.pdf"
    mock_document.file_name = "test.pdf"
    mock_doc_repo.create.return_value = mock_document

    # Mock Summary creation
    mock_summary = Mock(spec=Summary)
    mock_summary.id = uuid4()
    mock_summary_repo.create.return_value = mock_summary

    # Execute
    service = SummaryService()
    result = await service.create_summary_from_file(
        db=mock_db,
        user_id=user_id,
        study_space_id=study_space_id,
        file=mock_file,
        expertise_level=ExpertiseLevel.MEDIO
    )

    # Verify
    assert result == mock_summary
    mock_file_processor.validate_file.assert_called_once()
    mock_user_repo.get_by_id.assert_called_once_with(mock_db, user_id)
    mock_space_repo.get_by_id.assert_called_once_with(mock_db, study_space_id)
    mock_verify_space.assert_called_once()
    mock_openai.generate_summary.assert_called_once()
    mock_doc_repo.create.assert_called_once()
    mock_summary_repo.create.assert_called_once()
    mock_db.commit.assert_called()


@patch('app.services.summary_service.OpenAIService')
@patch('app.services.summary_service.FileProcessor')
@patch('app.services.summary_service.UserRepository')
@patch('app.services.summary_service.log_quota_event')
@pytest.mark.asyncio
async def test_create_summary_from_file_user_not_found(
    mock_log_quota, mock_user_repo, mock_file_processor, mock_openai_service
):
    """create_summary_from_file debe lanzar 404 si usuario no existe"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "test.pdf"
    mock_file.read = AsyncMock(return_value=b"content")
    mock_file.seek = AsyncMock()

    mock_file_processor.validate_file.return_value = ("test.pdf", "pdf")
    mock_user_repo.get_by_id.return_value = None

    service = SummaryService()
    study_space_id = uuid4()

    with pytest.raises(HTTPException) as exc_info:
        await service.create_summary_from_file(
            db=mock_db,
            user_id=user_id,
            study_space_id=study_space_id,
            file=mock_file,
            expertise_level=ExpertiseLevel.BASICO
        )

    assert exc_info.value.status_code == 404
    assert "Usuario no encontrado" in exc_info.value.detail


@patch('app.services.summary_service.OpenAIService')
@patch('app.services.summary_service.FileProcessor')
@patch('app.services.summary_service.UserRepository')
@patch('app.services.summary_service.log_quota_event')
@pytest.mark.asyncio
async def test_create_summary_from_file_exceeds_max_file_size(
    mock_log_quota, mock_user_repo, mock_file_processor, mock_openai_service
):
    """create_summary_from_file debe lanzar 413 si archivo excede tamaño máximo"""
    mock_db = MagicMock()
    user_id = uuid4()

    # File larger than max allowed
    large_content = b"x" * (20 * 1024 * 1024)  # 20MB
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "large.pdf"
    mock_file.read = AsyncMock(return_value=large_content)
    mock_file.seek = AsyncMock()

    mock_file_processor.validate_file.return_value = ("large.pdf", "pdf")

    mock_user = Mock(spec=User)
    mock_user.max_file_size_bytes = 10 * 1024 * 1024  # 10MB max
    mock_user_repo.get_by_id.return_value = mock_user

    service = SummaryService()
    study_space_id = uuid4()

    with pytest.raises(HTTPException) as exc_info:
        await service.create_summary_from_file(
            db=mock_db,
            user_id=user_id,
            study_space_id=study_space_id,
            file=mock_file,
            expertise_level=ExpertiseLevel.BASICO
        )

    assert exc_info.value.status_code == 413
    assert "excede el tamaño máximo" in exc_info.value.detail
    mock_log_quota.assert_called_once()


@patch('app.services.summary_service.OpenAIService')
@patch('app.services.summary_service.FileProcessor')
@patch('app.services.summary_service.UserRepository')
@patch('app.services.summary_service.log_quota_event')
@pytest.mark.asyncio
async def test_create_summary_from_file_insufficient_storage(
    mock_log_quota, mock_user_repo, mock_file_processor, mock_openai_service
):
    """create_summary_from_file debe lanzar 507 si no hay suficiente espacio"""
    mock_db = MagicMock()
    user_id = uuid4()

    file_content = b"x" * (5 * 1024 * 1024)  # 5MB
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "test.pdf"
    mock_file.read = AsyncMock(return_value=file_content)
    mock_file.seek = AsyncMock()

    mock_file_processor.validate_file.return_value = ("test.pdf", "pdf")

    mock_user = Mock(spec=User)
    mock_user.max_file_size_bytes = 10 * 1024 * 1024  # 10MB max (ok)
    mock_user.storage_available_bytes = 1 * 1024 * 1024  # Only 1MB available
    mock_user.storage_used_bytes = 99 * 1024 * 1024
    mock_user.storage_quota_bytes = 100 * 1024 * 1024
    mock_user_repo.get_by_id.return_value = mock_user

    service = SummaryService()
    study_space_id = uuid4()

    with pytest.raises(HTTPException) as exc_info:
        await service.create_summary_from_file(
            db=mock_db,
            user_id=user_id,
            study_space_id=study_space_id,
            file=mock_file,
            expertise_level=ExpertiseLevel.BASICO
        )

    assert exc_info.value.status_code == 507
    assert "suficiente espacio" in exc_info.value.detail


@patch('app.services.summary_service.OpenAIService')
@patch('app.services.summary_service.FileProcessor')
@patch('app.services.summary_service.UserRepository')
@patch('app.services.summary_service.log_openai_request')
@pytest.mark.asyncio
async def test_create_summary_from_file_openai_error(
    mock_log_openai, mock_user_repo, mock_file_processor, mock_openai_service
):
    """create_summary_from_file debe manejar errores de OpenAI"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "test.pdf"
    mock_file.read = AsyncMock(return_value=b"content")
    mock_file.seek = AsyncMock()

    mock_file_processor.validate_file.return_value = ("test.pdf", "pdf")
    mock_file_processor.extract_text = AsyncMock(return_value="Extracted text")

    mock_user = Mock(spec=User)
    mock_user.max_file_size_bytes = 10 * 1024 * 1024
    mock_user.storage_available_bytes = 10 * 1024 * 1024
    mock_user_repo.get_by_id.return_value = mock_user

    mock_openai = Mock()
    mock_openai.model = "gpt-4"
    mock_openai.generate_summary.side_effect = Exception("OpenAI API Error")
    mock_openai_service.return_value = mock_openai

    service = SummaryService()
    study_space_id = uuid4()

    with pytest.raises(HTTPException) as exc_info:
        await service.create_summary_from_file(
            db=mock_db,
            user_id=user_id,
            study_space_id=study_space_id,
            file=mock_file,
            expertise_level=ExpertiseLevel.BASICO
        )

    assert exc_info.value.status_code == 500
    assert "Error al generar resumen" in exc_info.value.detail
    mock_db.rollback.assert_called()


@patch('app.services.summary_service.OpenAIService')
@patch('app.services.summary_service.FileProcessor')
@patch('app.services.summary_service.UserRepository')
@patch('app.services.summary_service.DocumentRepository')
@patch('app.repositories.study_space_repository.StudySpaceRepository')
@patch('app.core.dependencies.verify_space_ownership')
@patch('app.services.summary_service.log_error')
@pytest.mark.asyncio
async def test_create_summary_from_file_generic_error(
    mock_log_error, mock_verify_space, mock_space_repo, mock_doc_repo,
    mock_user_repo, mock_file_processor, mock_openai_service
):
    """create_summary_from_file debe manejar errores genéricos inesperados"""
    mock_db = MagicMock()
    user_id = uuid4()
    study_space_id = uuid4()

    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "test.pdf"
    mock_file.read = AsyncMock(return_value=b"content")
    mock_file.seek = AsyncMock()

    mock_file_processor.validate_file.return_value = ("test.pdf", "pdf")
    mock_file_processor.extract_text = AsyncMock(return_value="Extracted text")

    mock_user = Mock(spec=User)
    mock_user.id = user_id
    mock_user.max_file_size_bytes = 10 * 1024 * 1024
    mock_user.storage_available_bytes = 10 * 1024 * 1024
    mock_user_repo.get_by_id.return_value = mock_user

    mock_study_space = Mock()
    mock_study_space.id = study_space_id
    mock_space_repo.get_by_id.return_value = mock_study_space
    mock_verify_space.return_value = mock_study_space

    # Simular error inesperado en DocumentRepository.create
    mock_doc_repo.create.side_effect = RuntimeError("Database connection lost")

    mock_openai = Mock()
    mock_openai.model = "gpt-4"
    mock_openai.generate_summary.return_value = {"title": "Test", "summary": "Text"}
    mock_openai_service.return_value = mock_openai

    service = SummaryService()

    with pytest.raises(HTTPException) as exc_info:
        await service.create_summary_from_file(
            db=mock_db,
            user_id=user_id,
            study_space_id=study_space_id,
            file=mock_file,
            expertise_level=ExpertiseLevel.BASICO
        )

    assert exc_info.value.status_code == 500
    assert "Error interno al crear resumen" in exc_info.value.detail
    mock_db.rollback.assert_called()
    mock_log_error.assert_called_once()


# ========================================
# TESTS PARA get_summaries()
# ========================================

@patch('app.services.summary_service.OpenAIService')
@patch('app.services.summary_service.SummaryRepository')
def test_get_summaries(mock_summary_repo, mock_openai_service):
    """get_summaries debe retornar lista de resúmenes con paginación"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_summaries = [
        Mock(spec=Summary, id=uuid4(), title="Summary 1"),
        Mock(spec=Summary, id=uuid4(), title="Summary 2"),
    ]

    mock_summary_repo.get_by_user.return_value = mock_summaries
    mock_summary_repo.count_by_user.return_value = 10

    service = SummaryService()
    summaries, total = service.get_summaries(mock_db, user_id, skip=0, limit=2)

    assert len(summaries) == 2
    assert total == 10
    mock_summary_repo.get_by_user.assert_called_once_with(mock_db, user_id, 0, 2)
    mock_summary_repo.count_by_user.assert_called_once_with(mock_db, user_id)


# ========================================
# TESTS PARA get_summary()
# ========================================

@patch('app.services.summary_service.OpenAIService')
@patch('app.services.summary_service.SummaryRepository')
@patch('app.services.summary_service.verify_summary_ownership')
def test_get_summary(mock_verify, mock_summary_repo, mock_openai_service):
    """get_summary debe retornar resumen con verificación de ownership"""
    mock_db = MagicMock()
    summary_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = uuid4()

    mock_summary = Mock(spec=Summary)
    mock_summary.id = summary_id
    mock_summary_repo.get_by_id.return_value = mock_summary
    mock_verify.return_value = mock_summary

    service = SummaryService()
    result = service.get_summary(mock_db, summary_id, mock_user)

    assert result == mock_summary
    mock_summary_repo.get_by_id.assert_called_once_with(mock_db, summary_id)
    mock_verify.assert_called_once_with(mock_summary, mock_user)


# ========================================
# TESTS PARA create_summary_from_documents()
# ========================================

@patch('app.services.summary_service.OpenAIService')
@patch('app.services.summary_service.DocumentRepository')
@patch('app.services.summary_service.SummaryRepository')
@patch('app.repositories.study_space_repository.StudySpaceRepository')
@patch('app.core.dependencies.verify_document_ownership')
@patch('app.core.dependencies.verify_space_ownership')
@patch('app.services.summary_service.log_openai_request')
def test_create_summary_from_documents_success(
    mock_log_openai, mock_verify_space, mock_verify_doc, mock_space_repo, mock_summary_repo,
    mock_doc_repo, mock_openai_service
):
    """create_summary_from_documents debe crear resumen desde un documento"""
    mock_db = MagicMock()
    user_id = uuid4()
    doc_id = uuid4()
    study_space_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_document = Mock(spec=Document)
    mock_document.id = doc_id
    mock_document.title = "Test Document"
    mock_document.file_name = "test.pdf"
    mock_document.extracted_text = "This is the extracted text from document"

    mock_study_space = Mock()
    mock_study_space.id = study_space_id
    mock_study_space.name = "Test Space"
    mock_study_space.color = "#FF5733"
    mock_study_space.description = None

    mock_doc_repo.get_by_id.return_value = mock_document
    mock_verify_doc.return_value = mock_document
    mock_space_repo.get_by_id.return_value = mock_study_space
    mock_verify_space.return_value = mock_study_space

    mock_openai = Mock()
    mock_openai.model = "gpt-4"
    mock_openai.generate_summary.return_value = {
        "title": "Document Summary",
        "summary": "Summary text",
        "topics": ["topic1"],
        "key_concepts": []
    }
    mock_openai_service.return_value = mock_openai

    mock_summary = Mock(spec=Summary)
    mock_summary.id = uuid4()
    mock_summary_repo.create.return_value = mock_summary

    service = SummaryService()
    result = service.create_summary_from_documents(
        db=mock_db,
        user=mock_user,
        document_id=doc_id,
        study_space_id=study_space_id,
        expertise_level=ExpertiseLevel.MEDIO
    )

    assert result == mock_summary
    mock_doc_repo.get_by_id.assert_called_once_with(mock_db, doc_id)
    mock_verify_doc.assert_called_once()
    mock_space_repo.get_by_id.assert_called_once_with(mock_db, study_space_id)
    mock_verify_space.assert_called_once()
    mock_openai.generate_summary.assert_called_once()
    mock_summary_repo.create.assert_called_once()


def test_create_summary_from_documents_empty_list():
    """OBSOLETE: create_summary_from_documents ya no acepta listas, solo document_id único"""
    pass


def test_create_summary_from_documents_multiple_documents():
    """OBSOLETE: create_summary_from_documents ya no acepta múltiples documentos, solo document_id único"""
    pass


@patch('app.services.summary_service.OpenAIService')
@patch('app.services.summary_service.DocumentRepository')
@patch('app.repositories.study_space_repository.StudySpaceRepository')
@patch('app.core.dependencies.verify_document_ownership')
@patch('app.core.dependencies.verify_space_ownership')
def test_create_summary_from_documents_no_text(
    mock_verify_space, mock_verify_doc, mock_space_repo, mock_doc_repo, mock_openai_service
):
    """create_summary_from_documents debe lanzar 400 si no hay texto"""
    mock_db = MagicMock()
    mock_user = Mock(spec=User)
    mock_user.id = uuid4()
    doc_id = uuid4()
    study_space_id = uuid4()

    mock_document = Mock(spec=Document)
    mock_document.extracted_text = ""  # No text

    mock_study_space = Mock()
    mock_study_space.id = study_space_id

    mock_doc_repo.get_by_id.return_value = mock_document
    mock_verify_doc.return_value = mock_document
    mock_space_repo.get_by_id.return_value = mock_study_space
    mock_verify_space.return_value = mock_study_space

    service = SummaryService()

    with pytest.raises(HTTPException) as exc_info:
        service.create_summary_from_documents(
            db=mock_db,
            user=mock_user,
            document_id=doc_id,
            study_space_id=study_space_id,
            expertise_level=ExpertiseLevel.BASICO
        )

    assert exc_info.value.status_code == 400
    assert "texto extraíble" in exc_info.value.detail


@patch('app.services.summary_service.OpenAIService')
@patch('app.services.summary_service.DocumentRepository')
@patch('app.services.summary_service.SummaryRepository')
@patch('app.repositories.study_space_repository.StudySpaceRepository')
@patch('app.core.dependencies.verify_document_ownership')
@patch('app.core.dependencies.verify_space_ownership')
@patch('app.services.summary_service.log_openai_request')
def test_create_summary_from_documents_with_space_context(
    mock_log_openai, mock_verify_space, mock_verify_doc, mock_space_repo, mock_summary_repo,
    mock_doc_repo, mock_openai_service
):
    """create_summary_from_documents debe incluir contexto del espacio"""
    mock_db = MagicMock()
    user_id = uuid4()
    doc_id = uuid4()
    study_space_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    # Study space with description
    mock_study_space = Mock()
    mock_study_space.id = study_space_id
    mock_study_space.name = "ML Space"
    mock_study_space.color = "#FF5733"
    mock_study_space.description = "Machine Learning space"

    mock_document = Mock(spec=Document)
    mock_document.id = doc_id
    mock_document.title = "Doc"
    mock_document.file_name = "doc.pdf"
    mock_document.extracted_text = "Document text"

    mock_doc_repo.get_by_id.return_value = mock_document
    mock_verify_doc.return_value = mock_document
    mock_space_repo.get_by_id.return_value = mock_study_space
    mock_verify_space.return_value = mock_study_space

    mock_openai = Mock()
    mock_openai.model = "gpt-4"
    mock_openai.generate_summary.return_value = {
        "title": "Summary",
        "summary": "Text",
        "topics": [],
        "key_concepts": []
    }
    mock_openai_service.return_value = mock_openai

    mock_summary = Mock(spec=Summary)
    mock_summary.id = uuid4()
    mock_summary_repo.create.return_value = mock_summary

    service = SummaryService()
    service.create_summary_from_documents(
        db=mock_db,
        user=mock_user,
        document_id=doc_id,
        study_space_id=study_space_id,
        expertise_level=ExpertiseLevel.AVANZADO
    )

    # Verify that space_context was passed to generate_summary
    call_args = mock_openai.generate_summary.call_args
    assert call_args[1]["space_context"] == "Machine Learning space"


@patch('app.services.summary_service.OpenAIService')
@patch('app.services.summary_service.DocumentRepository')
@patch('app.repositories.study_space_repository.StudySpaceRepository')
@patch('app.core.dependencies.verify_document_ownership')
@patch('app.core.dependencies.verify_space_ownership')
@patch('app.services.summary_service.log_openai_request')
def test_create_summary_from_documents_openai_error(
    mock_log_openai, mock_verify_space, mock_verify_doc, mock_space_repo,
    mock_doc_repo, mock_openai_service
):
    """create_summary_from_documents debe manejar errores de OpenAI"""
    mock_db = MagicMock()
    user_id = uuid4()
    doc_id = uuid4()
    study_space_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_document = Mock(spec=Document)
    mock_document.id = doc_id
    mock_document.title = "Test Document"
    mock_document.file_name = "test.pdf"
    mock_document.extracted_text = "Document text"

    mock_study_space = Mock()
    mock_study_space.id = study_space_id
    mock_study_space.name = "Test Space"

    mock_doc_repo.get_by_id.return_value = mock_document
    mock_verify_doc.return_value = mock_document
    mock_space_repo.get_by_id.return_value = mock_study_space
    mock_verify_space.return_value = mock_study_space

    # Simular error de OpenAI
    mock_openai = Mock()
    mock_openai.model = "gpt-4"
    mock_openai.generate_summary.side_effect = Exception("OpenAI rate limit exceeded")
    mock_openai_service.return_value = mock_openai

    service = SummaryService()

    with pytest.raises(HTTPException) as exc_info:
        service.create_summary_from_documents(
            db=mock_db,
            user=mock_user,
            document_id=doc_id,
            study_space_id=study_space_id,
            expertise_level=ExpertiseLevel.MEDIO
        )

    assert exc_info.value.status_code == 500
    assert "Error al generar resumen" in exc_info.value.detail
    # Verificar que se llamó log_openai_request con status="failed"
    assert mock_log_openai.call_count == 1
    assert mock_log_openai.call_args[1]["status"] == "failed"


@patch('app.services.summary_service.OpenAIService')
@patch('app.services.summary_service.DocumentRepository')
@patch('app.services.summary_service.SummaryRepository')
@patch('app.repositories.study_space_repository.StudySpaceRepository')
@patch('app.core.dependencies.verify_document_ownership')
@patch('app.core.dependencies.verify_space_ownership')
@patch('app.services.summary_service.log_openai_request')
@patch('app.services.summary_service.log_error')
def test_create_summary_from_documents_generic_error(
    mock_log_error, mock_log_openai, mock_verify_space, mock_verify_doc, mock_space_repo,
    mock_summary_repo, mock_doc_repo, mock_openai_service
):
    """create_summary_from_documents debe manejar errores genéricos inesperados"""
    mock_db = MagicMock()
    user_id = uuid4()
    doc_id = uuid4()
    study_space_id = uuid4()

    mock_user = Mock(spec=User)
    mock_user.id = user_id

    mock_document = Mock(spec=Document)
    mock_document.id = doc_id
    mock_document.title = "Test Document"
    mock_document.file_name = "test.pdf"
    mock_document.extracted_text = "Document text"

    mock_study_space = Mock()
    mock_study_space.id = study_space_id
    mock_study_space.name = "Test Space"

    mock_doc_repo.get_by_id.return_value = mock_document
    mock_verify_doc.return_value = mock_document
    mock_space_repo.get_by_id.return_value = mock_study_space
    mock_verify_space.return_value = mock_study_space

    mock_openai = Mock()
    mock_openai.model = "gpt-4"
    mock_openai.generate_summary.return_value = {
        "title": "Summary",
        "summary": "Text",
        "topics": [],
        "key_concepts": []
    }
    mock_openai_service.return_value = mock_openai

    # Simular error inesperado en SummaryRepository.create
    mock_summary_repo.create.side_effect = RuntimeError("Database deadlock")

    service = SummaryService()

    with pytest.raises(HTTPException) as exc_info:
        service.create_summary_from_documents(
            db=mock_db,
            user=mock_user,
            document_id=doc_id,
            study_space_id=study_space_id,
            expertise_level=ExpertiseLevel.MEDIO
        )

    assert exc_info.value.status_code == 500
    assert "Error interno al crear resumen" in exc_info.value.detail
    mock_db.rollback.assert_called()
    mock_log_error.assert_called_once()


# ========================================
# TESTS PARA delete_summary()
# ========================================

@patch('app.services.summary_service.OpenAIService')
@patch('app.services.summary_service.SummaryRepository')
def test_delete_summary(mock_summary_repo, mock_openai_service):
    """delete_summary debe eliminar resumen"""
    mock_db = MagicMock()
    summary_id = uuid4()

    mock_user = Mock(spec=User)
    mock_summary = Mock(spec=Summary)
    mock_summary.id = summary_id

    with patch.object(SummaryService, 'get_summary', return_value=mock_summary):
        service = SummaryService()
        service.delete_summary(mock_db, summary_id, mock_user)

    mock_summary_repo.delete.assert_called_once_with(mock_db, mock_summary)
