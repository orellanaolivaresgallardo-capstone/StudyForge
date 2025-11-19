"""
Tests para el validador de archivos con magic numbers.
Verifica la detección correcta de tipos de archivo y prevención de ataques.
"""
import pytest
import io
from fastapi import UploadFile, HTTPException
from app.core.file_validator import FileValidator


# Magic bytes de muestra para diferentes tipos de archivo
SAMPLE_PDF_HEADER = b'%PDF-1.4\n'
SAMPLE_ZIP_HEADER = b'PK\x03\x04'
SAMPLE_TEXT = b'This is a plain text file\nwith multiple lines'
SAMPLE_UTF8_BOM = b'\xEF\xBB\xBFThis is UTF-8 with BOM'


def create_upload_file(content: bytes, filename: str) -> UploadFile:
    """Helper para crear UploadFile de prueba."""
    return UploadFile(
        file=io.BytesIO(content),
        filename=filename
    )


@pytest.mark.asyncio
async def test_detect_pdf():
    """Test detección de archivos PDF."""
    content = SAMPLE_PDF_HEADER + b'Some PDF content here'
    file_type, description = FileValidator._detect_file_type(content)
    
    assert file_type == 'pdf'
    assert 'PDF' in description


@pytest.mark.asyncio
async def test_detect_zip_office():
    """Test detección de archivos Office basados en ZIP."""
    content = SAMPLE_ZIP_HEADER + b'Some ZIP content'
    file_type, description = FileValidator._detect_file_type(content)
    
    assert file_type == 'zip_office'


@pytest.mark.asyncio
async def test_detect_plain_text():
    """Test detección de archivos de texto plano."""
    file_type, description = FileValidator._detect_file_type(SAMPLE_TEXT)
    
    assert file_type == 'txt'
    assert 'Text' in description


@pytest.mark.asyncio
async def test_detect_utf8_with_bom():
    """Test detección de texto UTF-8 con BOM."""
    file_type, description = FileValidator._detect_file_type(SAMPLE_UTF8_BOM)
    
    assert file_type == 'txt'


@pytest.mark.asyncio
async def test_detect_unknown_type():
    """Test que archivos desconocidos retornan None."""
    # Contenido binario aleatorio que no coincide con ningún magic number
    content = b'\xFF\xFE\xFD\xFC\xFB\xFA'
    result = FileValidator._detect_file_type(content)
    
    assert result is None


@pytest.mark.asyncio
async def test_validate_pdf_correct():
    """Test validación exitosa de PDF."""
    content = SAMPLE_PDF_HEADER + b'PDF content'
    file = create_upload_file(content, 'document.pdf')
    
    is_valid, message = await FileValidator.validate_file_content(file, 'pdf')
    
    assert is_valid is True
    assert 'PDF' in message


@pytest.mark.asyncio
async def test_validate_extension_mismatch():
    """Test que detecta cuando el contenido no coincide con la extensión."""
    # Archivo PDF con extensión .txt
    content = SAMPLE_PDF_HEADER + b'PDF content'
    file = create_upload_file(content, 'fake.txt')
    
    with pytest.raises(HTTPException) as exc_info:
        await FileValidator.validate_file_content(file, 'txt')
    
    assert exc_info.value.status_code == 400
    assert 'no coincide' in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_validate_empty_file():
    """Test que archivos vacíos son rechazados."""
    file = create_upload_file(b'', 'empty.pdf')
    
    with pytest.raises(HTTPException) as exc_info:
        await FileValidator.validate_file_content(file, 'pdf')
    
    assert exc_info.value.status_code == 400
    assert 'vacío' in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_validate_too_small_file():
    """Test que archivos muy pequeños son rechazados."""
    file = create_upload_file(b'AB', 'tiny.pdf')
    
    with pytest.raises(HTTPException) as exc_info:
        await FileValidator.validate_file_content(file, 'pdf')
    
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_validate_unknown_format():
    """Test que formatos desconocidos son rechazados."""
    content = b'\xFF\xFE\xFD\xFC\xFB\xFA' * 10
    file = create_upload_file(content, 'unknown.xyz')
    
    with pytest.raises(HTTPException) as exc_info:
        await FileValidator.validate_file_content(file, 'xyz')
    
    assert exc_info.value.status_code == 415


@pytest.mark.asyncio
async def test_validate_text_file():
    """Test validación de archivo de texto."""
    file = create_upload_file(SAMPLE_TEXT, 'notes.txt')
    
    is_valid, message = await FileValidator.validate_file_content(file, 'txt')
    
    assert is_valid is True
    assert 'Text' in message


@pytest.mark.asyncio
async def test_file_position_reset():
    """Test que la posición del archivo se resetea después de la validación."""
    content = SAMPLE_PDF_HEADER + b'PDF content'
    file = create_upload_file(content, 'document.pdf')
    
    # Validar
    await FileValidator.validate_file_content(file, 'pdf')
    
    # Verificar que podemos leer desde el inicio
    read_content = await file.read()
    assert read_content == content


@pytest.mark.asyncio
async def test_validate_and_get_info():
    """Test obtención de información completa del archivo."""
    content = SAMPLE_PDF_HEADER + b'PDF content'
    file = create_upload_file(content, 'test.pdf')
    
    info = await FileValidator.validate_and_get_info(file)
    
    assert info['filename'] == 'test.pdf'
    assert info['extension'] == 'pdf'
    assert info['size_bytes'] == len(content)
    assert info['is_valid'] is True
    assert 'PDF' in info['validation_message']


@pytest.mark.asyncio
async def test_validate_no_filename():
    """Test que archivos sin nombre son rechazados."""
    content = SAMPLE_PDF_HEADER + b'PDF content'
    file = create_upload_file(content, '')
    
    with pytest.raises(HTTPException) as exc_info:
        await FileValidator.validate_and_get_info(file)
    
    assert exc_info.value.status_code == 400
    assert 'nombre' in exc_info.value.detail.lower()


def test_read_magic_bytes():
    """Test lectura de magic bytes."""
    content = b'ABCDEFGHIJKLMNOP'
    
    magic = FileValidator._read_magic_bytes(content, 4)
    assert magic == b'ABCD'
    
    magic = FileValidator._read_magic_bytes(content, 8)
    assert magic == b'ABCDEFGH'


def test_allowed_extensions_mapping():
    """Test que todas las extensiones tienen tipo de archivo asociado."""
    assert 'pdf' in FileValidator.ALLOWED_EXTENSIONS
    assert 'zip_office' in FileValidator.ALLOWED_EXTENSIONS
    assert 'txt' in FileValidator.ALLOWED_EXTENSIONS
    
    # Verificar que las extensiones soportadas están correctamente mapeadas
    assert 'pdf' in FileValidator.ALLOWED_EXTENSIONS['pdf']
    assert 'docx' in FileValidator.ALLOWED_EXTENSIONS['zip_office']
    assert 'pptx' in FileValidator.ALLOWED_EXTENSIONS['zip_office']
