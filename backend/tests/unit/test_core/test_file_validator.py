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


# Tests para _is_valid_zip_office

def test_is_valid_zip_office_docx_valid():
    """DOCX válido debe contener word/document.xml"""
    import zipfile
    import io

    # Crear un ZIP con estructura de DOCX
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zf:
        zf.writestr('word/document.xml', '<document/>')
        zf.writestr('[Content_Types].xml', '<Types/>')

    content = zip_buffer.getvalue()

    result = FileValidator._is_valid_zip_office(content, 'docx')

    assert result is True


def test_is_valid_zip_office_docx_invalid():
    """DOCX sin word/document.xml debe fallar"""
    import zipfile
    import io

    # Crear un ZIP sin estructura de DOCX
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zf:
        zf.writestr('some_file.txt', 'content')

    content = zip_buffer.getvalue()

    result = FileValidator._is_valid_zip_office(content, 'docx')

    assert result is False


def test_is_valid_zip_office_pptx_valid():
    """PPTX válido debe contener ppt/presentation.xml"""
    import zipfile
    import io

    # Crear un ZIP con estructura de PPTX
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zf:
        zf.writestr('ppt/presentation.xml', '<presentation/>')
        zf.writestr('[Content_Types].xml', '<Types/>')

    content = zip_buffer.getvalue()

    result = FileValidator._is_valid_zip_office(content, 'pptx')

    assert result is True


def test_is_valid_zip_office_pptx_invalid():
    """PPTX sin ppt/presentation.xml debe fallar"""
    import zipfile
    import io

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zf:
        zf.writestr('random.xml', '<data/>')

    content = zip_buffer.getvalue()

    result = FileValidator._is_valid_zip_office(content, 'pptx')

    assert result is False


def test_is_valid_zip_office_bad_zip():
    """Contenido no-ZIP debe retornar False"""
    content = b'This is not a ZIP file'

    result = FileValidator._is_valid_zip_office(content, 'docx')

    assert result is False


def test_is_valid_zip_office_unknown_extension():
    """Extensión desconocida debe retornar False"""
    import zipfile
    import io

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zf:
        zf.writestr('file.txt', 'content')

    content = zip_buffer.getvalue()

    result = FileValidator._is_valid_zip_office(content, 'xlsx')

    assert result is False


# Tests para validate_file_content

@pytest.mark.asyncio
async def test_validate_file_content_unrecognized_type():
    """Tipo de archivo no reconocido debe fallar"""
    mock_file = Mock()
    mock_file.filename = "test.jpg"

    async def async_read():
        # JPEG signature
        return b'\xFF\xD8\xFF\xE0\x00\x10JFIF more content here'

    async def async_seek(pos):
        pass

    mock_file.read = async_read
    mock_file.seek = async_seek

    with pytest.raises(HTTPException) as exc_info:
        await FileValidator.validate_file_content(mock_file, 'jpg')

    assert exc_info.value.status_code == 415
    assert "no reconocido o no soportado" in exc_info.value.detail


@pytest.mark.asyncio
async def test_validate_file_content_extension_mismatch():
    """Extensión no coincide con contenido debe fallar"""
    mock_file = Mock()
    mock_file.filename = "malicious.txt"

    async def async_read():
        # Contenido PDF pero extensión .txt
        return b'%PDF-1.4\nPDF content here...'

    async def async_seek(pos):
        pass

    mock_file.read = async_read
    mock_file.seek = async_seek

    with pytest.raises(HTTPException) as exc_info:
        await FileValidator.validate_file_content(mock_file, 'txt')

    assert exc_info.value.status_code == 400
    assert "no coincide con su extensión" in exc_info.value.detail


@pytest.mark.asyncio
async def test_validate_file_content_invalid_office_structure():
    """Office file con estructura inválida debe fallar"""
    import zipfile
    import io

    mock_file = Mock()
    mock_file.filename = "fake.docx"

    # Crear un ZIP sin estructura de DOCX
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zf:
        zf.writestr('random.txt', 'not a docx')

    content = zip_buffer.getvalue()

    async def async_read():
        return content

    async def async_seek(pos):
        pass

    mock_file.read = async_read
    mock_file.seek = async_seek

    with pytest.raises(HTTPException) as exc_info:
        await FileValidator.validate_file_content(mock_file, 'docx')

    assert exc_info.value.status_code == 400
    assert "estructura válida" in exc_info.value.detail


@pytest.mark.asyncio
async def test_validate_file_content_valid_pdf():
    """PDF válido debe pasar validación"""
    mock_file = Mock()
    mock_file.filename = "document.pdf"

    async def async_read():
        return b'%PDF-1.4\nSome PDF content here with enough bytes...'

    async def async_seek(pos):
        pass

    mock_file.read = async_read
    mock_file.seek = async_seek

    is_valid, message = await FileValidator.validate_file_content(mock_file, 'pdf')

    assert is_valid is True
    assert "PDF Document" in message


@pytest.mark.asyncio
async def test_validate_file_content_valid_docx():
    """DOCX válido debe pasar validación"""
    import zipfile
    import io

    mock_file = Mock()
    mock_file.filename = "document.docx"

    # Crear DOCX válido
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zf:
        zf.writestr('word/document.xml', '<document/>')
        zf.writestr('[Content_Types].xml', '<Types/>')

    content = zip_buffer.getvalue()

    async def async_read():
        return content

    async def async_seek(pos):
        pass

    mock_file.read = async_read
    mock_file.seek = async_seek

    is_valid, message = await FileValidator.validate_file_content(mock_file, 'docx')

    assert is_valid is True
    assert "ZIP-based Office Document" in message


# Tests para validate_and_get_info

@pytest.mark.asyncio
async def test_validate_and_get_info_no_filename():
    """Archivo sin nombre debe fallar"""
    mock_file = Mock()
    mock_file.filename = None

    with pytest.raises(HTTPException) as exc_info:
        await FileValidator.validate_and_get_info(mock_file)

    assert exc_info.value.status_code == 400
    assert "no tiene nombre" in exc_info.value.detail


@pytest.mark.asyncio
async def test_validate_and_get_info_success():
    """Debe retornar información completa del archivo"""
    mock_file = Mock()
    mock_file.filename = "test.pdf"
    mock_file.content_type = "application/pdf"

    pdf_content = b'%PDF-1.4\nSome PDF content here with enough bytes...'

    call_count = {'count': 0}

    async def async_read():
        call_count['count'] += 1
        # Primera llamada: validate_file_content
        # Segunda llamada: get size
        return pdf_content

    async def async_seek(pos):
        pass

    mock_file.read = async_read
    mock_file.seek = async_seek

    info = await FileValidator.validate_and_get_info(mock_file)

    assert info['filename'] == 'test.pdf'
    assert info['extension'] == 'pdf'
    assert info['size_bytes'] == len(pdf_content)
    assert info['is_valid'] is True
    assert 'PDF Document' in info['validation_message']
    assert info['content_type'] == 'application/pdf'
