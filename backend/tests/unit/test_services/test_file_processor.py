"""
Tests unitarios para FileProcessor
"""
import pytest
from unittest.mock import Mock, patch
from fastapi import HTTPException
from app.services.file_processor import FileProcessor


def test_extract_from_txt_utf8():
    """Extraer texto UTF-8 válido"""
    content = "Hello World\nLine 2".encode('utf-8')

    result = FileProcessor._extract_from_txt(content)

    assert result == "Hello World\nLine 2"


def test_extract_from_txt_latin1_fallback():
    """Fallback a Latin-1 si UTF-8 falla"""
    # Bytes que no son UTF-8 válidos
    content = b'\xc0\xc1\xf5'

    result = FileProcessor._extract_from_txt(content)

    # Debe decodificar con latin-1 sin errores
    assert isinstance(result, str)


def test_extract_from_txt_empty():
    """Contenido vacío retorna string vacío"""
    content = b''

    result = FileProcessor._extract_from_txt(content)

    assert result == ""


def test_validate_file_valid_pdf():
    """Validar archivo PDF válido"""
    mock_file = Mock()
    mock_file.filename = "document.pdf"

    filename, file_type = FileProcessor.validate_file(mock_file)

    assert filename == "document.pdf"
    assert file_type == "pdf"


def test_validate_file_no_filename():
    """Archivo sin nombre debe fallar"""
    mock_file = Mock()
    mock_file.filename = None

    with pytest.raises(HTTPException) as exc_info:
        FileProcessor.validate_file(mock_file)

    assert exc_info.value.status_code == 400


def test_validate_file_invalid_extension():
    """Extensión inválida debe fallar"""
    mock_file = Mock()
    mock_file.filename = "malware.exe"

    with pytest.raises(HTTPException) as exc_info:
        FileProcessor.validate_file(mock_file)

    assert exc_info.value.status_code == 400
