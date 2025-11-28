"""
Tests unitarios para documents router
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from uuid import uuid4
from datetime import datetime, timezone
from fastapi import HTTPException
from io import BytesIO


@pytest.fixture
def fake_user():
    """Usuario fake para tests"""
    user = Mock()
    user.id = uuid4()
    user.email = "test@example.com"
    user.username = "testuser"
    user.storage_quota_bytes = 10_000_000  # 10 MB
    user.storage_used_bytes = 0
    user.max_file_size_bytes = 5_000_000  # 5 MB
    user.storage_available_bytes = 10_000_000
    user.storage_usage_percentage = 0.0
    return user


@pytest.fixture
def fake_db():
    """DB session fake"""
    db = Mock()
    db.commit = Mock()
    db.refresh = Mock()
    return db


@pytest.fixture
def fake_document(fake_user):
    """Documento fake que pertenece a fake_user"""
    doc = Mock()
    doc.id = uuid4()
    doc.user_id = fake_user.id  # Mismo user_id que fake_user
    doc.title = "Test Document"
    doc.file_name = "test.pdf"
    doc.file_type = "pdf"
    doc.file_size_bytes = 1000
    doc.created_at = datetime.now(timezone.utc)
    doc.updated_at = datetime.now(timezone.utc)
    doc.study_spaces = []
    doc.file_content = b"test content"
    return doc


@pytest.fixture
def fake_study_space():
    """Study space fake"""
    space = Mock()
    space.id = uuid4()
    space.name = "Test Space"
    space.user_id = uuid4()
    space.documents = []
    return space


# Tests para upload_document

@pytest.mark.asyncio
@patch('app.services.file_processor.FileProcessor.validate_file_security')
@patch('app.services.file_processor.FileProcessor.extract_text')
@patch('app.repositories.document_repository.DocumentRepository.create')
@patch('app.repositories.study_space_repository.StudySpaceRepository.get_by_id')
@patch('app.core.dependencies.verify_space_ownership')
async def test_upload_document_success(
    mock_verify_space, mock_get_space, mock_create_doc,
    mock_extract_text, mock_validate_file,
    fake_user, fake_db, fake_document, fake_study_space
):
    """Debe subir documento exitosamente"""
    from app.routers.documents import upload_document

    # Setup mocks
    mock_validate_file.return_value = ("test.pdf", "pdf")
    mock_extract_text.return_value = "extracted text"
    mock_create_doc.return_value = fake_document
    mock_get_space.return_value = fake_study_space

    # Mock file upload
    mock_file = Mock()
    mock_file.read = AsyncMock(return_value=b"test content")
    mock_file.seek = AsyncMock()

    result = await upload_document(
        file=mock_file,
        study_space_ids=str(fake_study_space.id),
        title="Test Doc",
        current_user=fake_user,
        db=fake_db
    )

    assert result == fake_document
    mock_create_doc.assert_called_once()
    fake_db.commit.assert_called()


@pytest.mark.asyncio
async def test_upload_document_no_space_ids(fake_user, fake_db):
    """Debe fallar si no se proporciona space_ids"""
    from app.routers.documents import upload_document

    mock_file = Mock()

    with pytest.raises(HTTPException) as exc_info:
        await upload_document(
            file=mock_file,
            study_space_ids="",
            title="Test",
            current_user=fake_user,
            db=fake_db
        )

    assert exc_info.value.status_code == 400
    assert "al menos un espacio" in exc_info.value.detail


@pytest.mark.asyncio
async def test_upload_document_invalid_space_id_format(fake_user, fake_db):
    """Debe fallar con formato de UUID inválido"""
    from app.routers.documents import upload_document

    mock_file = Mock()

    with pytest.raises(HTTPException) as exc_info:
        await upload_document(
            file=mock_file,
            study_space_ids="not-a-valid-uuid",
            title="Test",
            current_user=fake_user,
            db=fake_db
        )

    assert exc_info.value.status_code == 400
    assert "inválido" in exc_info.value.detail


@pytest.mark.asyncio
@patch('app.repositories.study_space_repository.StudySpaceRepository.get_by_id')
async def test_upload_document_space_not_found(mock_get_space, fake_user, fake_db):
    """Debe fallar si el espacio no existe"""
    from app.routers.documents import upload_document

    mock_get_space.return_value = None
    mock_file = Mock()

    with pytest.raises(HTTPException) as exc_info:
        await upload_document(
            file=mock_file,
            study_space_ids=str(uuid4()),
            title="Test",
            current_user=fake_user,
            db=fake_db
        )

    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
@patch('app.services.file_processor.FileProcessor.validate_file_security')
@patch('app.repositories.study_space_repository.StudySpaceRepository.get_by_id')
@patch('app.core.dependencies.verify_space_ownership')
async def test_upload_document_file_too_large(
    mock_verify_space, mock_get_space, mock_validate_file,
    fake_user, fake_db, fake_study_space
):
    """Debe fallar si el archivo es muy grande"""
    from app.routers.documents import upload_document

    mock_validate_file.return_value = ("test.pdf", "pdf")
    mock_get_space.return_value = fake_study_space

    # Crear contenido que exceda max_file_size_bytes
    large_content = b"x" * (fake_user.max_file_size_bytes + 1)

    mock_file = Mock()
    mock_file.read = AsyncMock(return_value=large_content)

    with pytest.raises(HTTPException) as exc_info:
        await upload_document(
            file=mock_file,
            study_space_ids=str(fake_study_space.id),
            title="Test",
            current_user=fake_user,
            db=fake_db
        )

    assert exc_info.value.status_code == 413
    assert "tamaño máximo" in exc_info.value.detail


@pytest.mark.asyncio
@patch('app.services.file_processor.FileProcessor.validate_file_security')
@patch('app.repositories.study_space_repository.StudySpaceRepository.get_by_id')
@patch('app.core.dependencies.verify_space_ownership')
async def test_upload_document_insufficient_storage(
    mock_verify_space, mock_get_space, mock_validate_file,
    fake_user, fake_db, fake_study_space
):
    """Debe fallar si no hay suficiente espacio"""
    from app.routers.documents import upload_document

    mock_validate_file.return_value = ("test.pdf", "pdf")
    mock_get_space.return_value = fake_study_space

    # Configurar usuario con poco espacio disponible
    fake_user.storage_available_bytes = 100

    mock_file = Mock()
    mock_file.read = AsyncMock(return_value=b"x" * 1000)

    with pytest.raises(HTTPException) as exc_info:
        await upload_document(
            file=mock_file,
            study_space_ids=str(fake_study_space.id),
            title="Test",
            current_user=fake_user,
            db=fake_db
        )

    assert exc_info.value.status_code == 507
    assert "espacio de almacenamiento" in exc_info.value.detail


# Tests para list_documents

@patch('app.repositories.document_repository.DocumentRepository.get_by_user')
@patch('app.repositories.document_repository.DocumentRepository.count_by_user')
def test_list_documents_success(mock_count, mock_get, fake_user, fake_db, fake_document):
    """Debe listar documentos exitosamente"""
    from app.routers.documents import list_documents

    # Setup space con nombre
    fake_space = Mock()
    fake_space.name = "Space 1"
    fake_document.study_spaces = [fake_space]

    mock_get.return_value = [fake_document]
    mock_count.return_value = 1

    result = list_documents(
        skip=0,
        limit=100,
        current_user=fake_user,
        db=fake_db
    )

    assert result.total == 1
    assert len(result.items) == 1
    assert result.items[0].id == fake_document.id


# Tests para get_storage_info

@patch('app.repositories.document_repository.DocumentRepository.count_by_user')
def test_get_storage_info_success(mock_count, fake_user, fake_db):
    """Debe retornar información de storage"""
    from app.routers.documents import get_storage_info

    mock_count.return_value = 5

    result = get_storage_info(current_user=fake_user, db=fake_db)

    assert result.storage_quota_bytes == fake_user.storage_quota_bytes
    assert result.storage_used_bytes == fake_user.storage_used_bytes
    assert result.total_documents == 5


# Tests para get_document

@patch('app.repositories.document_repository.DocumentRepository.get_by_id')
@patch('app.core.dependencies.verify_document_ownership')
def test_get_document_success(mock_verify, mock_get, fake_user, fake_db, fake_document):
    """Debe obtener documento exitosamente"""
    from app.routers.documents import get_document

    mock_get.return_value = fake_document
    mock_verify.return_value = fake_document

    result = get_document(
        document_id=fake_document.id,
        current_user=fake_user,
        db=fake_db
    )

    assert result == fake_document
    mock_get.assert_called_once_with(fake_db, fake_document.id)


# Tests para update_document_title

@patch('app.repositories.document_repository.DocumentRepository.get_by_id')
@patch('app.core.dependencies.verify_document_ownership')
def test_update_document_title_success(mock_verify, mock_get, fake_user, fake_db, fake_document):
    """Debe actualizar título exitosamente"""
    from app.routers.documents import update_document_title
    from app.schemas.document import DocumentUpdateTitle

    mock_get.return_value = fake_document
    mock_verify.return_value = fake_document

    update_data = DocumentUpdateTitle(title="New Title")

    result = update_document_title(
        document_id=fake_document.id,
        update_data=update_data,
        current_user=fake_user,
        db=fake_db
    )

    assert fake_document.title == "New Title"
    fake_db.commit.assert_called_once()
    fake_db.refresh.assert_called_once()


# Tests para delete_document

@patch('app.repositories.document_repository.DocumentRepository.get_by_id')
@patch('app.core.dependencies.verify_document_ownership')
@patch('app.services.deletion_service.DeletionService.delete_document_with_denormalization')
def test_delete_document_success(mock_delete_service, mock_verify, mock_get, fake_user, fake_db, fake_document):
    """Debe eliminar documento exitosamente"""
    from app.routers.documents import delete_document

    mock_get.return_value = fake_document
    mock_verify.return_value = fake_document
    mock_delete_service.return_value = True

    result = delete_document(
        document_id=fake_document.id,
        current_user=fake_user,
        db=fake_db
    )

    assert result is None
    mock_delete_service.assert_called_once_with(fake_db, fake_document.id)
    fake_db.commit.assert_called_once()


@patch('app.repositories.document_repository.DocumentRepository.get_by_id')
@patch('app.core.dependencies.verify_document_ownership')
@patch('app.services.deletion_service.DeletionService.delete_document_with_denormalization')
def test_delete_document_not_found(mock_delete_service, mock_verify, mock_get, fake_user, fake_db, fake_document):
    """Debe fallar si el documento no se puede eliminar"""
    from app.routers.documents import delete_document

    mock_get.return_value = fake_document
    mock_verify.return_value = fake_document
    mock_delete_service.return_value = False

    with pytest.raises(HTTPException) as exc_info:
        delete_document(
            document_id=fake_document.id,
            current_user=fake_user,
            db=fake_db
        )

    assert exc_info.value.status_code == 404
