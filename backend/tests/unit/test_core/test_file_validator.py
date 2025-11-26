"""
Tests unitarios para FileValidator
"""
import pytest
from unittest.mock import Mock
from fastapi import HTTPException
from app.core.file_validator import FileValidator


def test_read_magic_bytes_basic():
    """Leer primeros bytes de contenido"""
    content = b'%PDF-1.4 some content here'

    magic = FileValidator._read_magic_bytes(content, 4)

    assert magic == b'%PDF'


def test_detect_file_type_pdf():
    """Detectar PDF por magic bytes"""
    content = b'%PDF-1.4\nSome PDF content...'

    file_type, description = FileValidator._detect_file_type(content)

    assert file_type == 'pdf'
    assert description == 'PDF Document'


def test_detect_file_type_zip_office():
    """Detectar archivo Office por magic bytes ZIP"""
    # PK\x03\x04 es la signature de archivos ZIP (DOCX, PPTX)
    content = b'PK\x03\x04\x14\x00\x00\x00\x08\x00...'

    file_type, description = FileValidator._detect_file_type(content)

    assert file_type == 'zip_office'
    assert description == 'ZIP-based Office Document'


def test_detect_file_type_plain_text():
    """Detectar texto plano sin BOM"""
    content = b'This is a plain text file with ASCII content.'

    file_type, description = FileValidator._detect_file_type(content)

    assert file_type == 'txt'
    assert description == 'Plain Text'


def test_detect_file_type_unknown():
    """Archivo desconocido retorna None"""
    # Bytes aleatorios que no coinciden con ningún magic number
    content = b'\xFF\xD8\xFF\xE0\x00\x10JFIF'  # JPEG signature

    result = FileValidator._detect_file_type(content)

    assert result is None


@pytest.mark.asyncio
async def test_validate_file_content_too_small():
    """Archivo muy pequeño debe fallar"""
    mock_file = Mock()
    mock_file.filename = "test.pdf"
    mock_file.read = Mock(return_value=b'PDF')  # Solo 3 bytes
    mock_file.seek = Mock()

    # Hacer que read sea async
    async def async_read():
        return b'PDF'

    async def async_seek(pos):
        pass

    mock_file.read = async_read
    mock_file.seek = async_seek

    with pytest.raises(HTTPException) as exc_info:
        await FileValidator.validate_file_content(mock_file, 'pdf')

    assert exc_info.value.status_code == 400
    assert "vacío o es demasiado pequeño" in exc_info.value.detail
