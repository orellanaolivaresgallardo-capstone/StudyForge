"""
Tests unitarios para FileProcessor
"""
import pytest
import io
from unittest.mock import Mock, MagicMock, patch, AsyncMock
from fastapi import HTTPException, UploadFile
import io
from unittest.mock import Mock, MagicMock, patch, AsyncMock
from fastapi import HTTPException, UploadFile
from app.services.file_processor import FileProcessor


# ========================================
# TESTS PARA validate_file()
# ========================================

def test_validate_file_valid_pdf():
    """Validar archivo PDF válido"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "document.pdf"

    filename, extension = FileProcessor.validate_file(mock_file)

    assert filename == "document.pdf"
    assert extension == "pdf"


def test_validate_file_valid_docx():
    """validate_file debe aceptar archivos DOCX válidos"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "document.docx"

    filename, extension = FileProcessor.validate_file(mock_file)

    assert filename == "document.docx"
    assert extension == "docx"


def test_validate_file_valid_pptx():
    """validate_file debe aceptar archivos PPTX válidos"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "presentation.pptx"

    filename, extension = FileProcessor.validate_file(mock_file)

    assert filename == "presentation.pptx"
    assert extension == "pptx"


def test_validate_file_valid_txt():
    """validate_file debe aceptar archivos TXT válidos"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "notes.txt"

    filename, extension = FileProcessor.validate_file(mock_file)

    assert filename == "notes.txt"
    assert extension == "txt"


def test_validate_file_no_filename():
    """Archivo sin nombre debe fallar"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = None

    with pytest.raises(HTTPException) as exc_info:
        FileProcessor.validate_file(mock_file)

    assert exc_info.value.status_code == 400
    assert "no tiene nombre" in exc_info.value.detail


def test_validate_file_invalid_extension():
    """Extensión inválida debe fallar"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "malware.exe"

    with pytest.raises(HTTPException) as exc_info:
        FileProcessor.validate_file(mock_file)

    assert exc_info.value.status_code == 400
    assert "no soportado" in exc_info.value.detail


def test_validate_file_case_insensitive():
    """validate_file debe ser case-insensitive para extensiones"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "DOCUMENT.PDF"

    filename, extension = FileProcessor.validate_file(mock_file)

    assert extension == "pdf"  # Lowercase


# ========================================
# TESTS PARA validate_file_security()
# ========================================

@patch('app.services.file_processor.FileValidator')
@pytest.mark.asyncio
async def test_validate_file_security_valid(mock_validator):
    """validate_file_security debe validar archivo con magic numbers"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "document.pdf"
    mock_validator.validate_file_content = AsyncMock()

    filename, extension = await FileProcessor.validate_file_security(mock_file)

    assert filename == "document.pdf"
    assert extension == "pdf"
    mock_validator.validate_file_content.assert_called_once_with(mock_file, "pdf")


@patch('app.services.file_processor.FileValidator')
@pytest.mark.asyncio
async def test_validate_file_security_no_filename(mock_validator):
    """validate_file_security debe lanzar 400 sin nombre"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = None

    with pytest.raises(HTTPException) as exc_info:
        await FileProcessor.validate_file_security(mock_file)

    assert exc_info.value.status_code == 400


@patch('app.services.file_processor.FileValidator')
@pytest.mark.asyncio
async def test_validate_file_security_invalid_extension(mock_validator):
    """validate_file_security debe rechazar extensiones inválidas"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "script.js"

    with pytest.raises(HTTPException) as exc_info:
        await FileProcessor.validate_file_security(mock_file)

    assert exc_info.value.status_code == 400
    assert "no soportado" in exc_info.value.detail


# ========================================
# TESTS PARA extract_text()
# ========================================

@patch('app.services.file_processor.FileProcessor.validate_file')
@pytest.mark.asyncio
async def test_extract_text_txt_utf8(mock_validate):
    """extract_text debe extraer texto de archivo TXT en UTF-8"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "test.txt"
    content = "Este es un texto de prueba en UTF-8".encode('utf-8')
    mock_file.read = AsyncMock(return_value=content)

    mock_validate.return_value = ("test.txt", "txt")

    with patch.object(FileProcessor, '_extract_from_txt', return_value="Este es un texto de prueba en UTF-8"):
        text = await FileProcessor.extract_text(mock_file)

    assert "texto de prueba" in text


@patch('app.services.file_processor.FileProcessor.validate_file')
@pytest.mark.asyncio
async def test_extract_text_file_too_large(mock_validate):
    """extract_text debe lanzar 413 si archivo es muy grande"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "huge.pdf"

    # Simulate 100MB file
    large_content = b"x" * (100 * 1024 * 1024)
    mock_file.read = AsyncMock(return_value=large_content)

    mock_validate.return_value = ("huge.pdf", "pdf")

    with pytest.raises(HTTPException) as exc_info:
        await FileProcessor.extract_text(mock_file)

    assert exc_info.value.status_code == 413
    assert "excede el tamaño máximo" in exc_info.value.detail


@patch('app.services.file_processor.FileProcessor.validate_file')
@pytest.mark.asyncio
async def test_extract_text_empty_content(mock_validate):
    """extract_text debe lanzar 400 si no hay texto extraído"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "empty.txt"
    mock_file.read = AsyncMock(return_value=b"   ")  # Solo espacios

    mock_validate.return_value = ("empty.txt", "txt")

    with patch.object(FileProcessor, '_extract_from_txt', return_value="   "):
        with pytest.raises(HTTPException) as exc_info:
            await FileProcessor.extract_text(mock_file)

    assert exc_info.value.status_code == 400
    assert "muy corto" in exc_info.value.detail


@patch('app.services.file_processor.FileProcessor.validate_file')
@patch('app.services.file_processor.FileProcessor._extract_from_pdf')
@pytest.mark.asyncio
async def test_extract_text_pdf(mock_extract_pdf, mock_validate):
    """extract_text debe extraer texto de PDF"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "document.pdf"
    mock_file.read = AsyncMock(return_value=b"PDF content here")

    mock_validate.return_value = ("document.pdf", "pdf")
    mock_extract_pdf.return_value = "Extracted PDF text content"

    text = await FileProcessor.extract_text(mock_file)

    assert text == "Extracted PDF text content"
    mock_extract_pdf.assert_called_once()


@patch('app.services.file_processor.FileProcessor.validate_file')
@patch('app.services.file_processor.FileProcessor._extract_from_pptx')
@pytest.mark.asyncio
async def test_extract_text_pptx(mock_extract_pptx, mock_validate):
    """extract_text debe extraer texto de PPTX"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "presentation.pptx"
    mock_file.read = AsyncMock(return_value=b"PPTX content")

    mock_validate.return_value = ("presentation.pptx", "pptx")
    mock_extract_pptx.return_value = "Extracted PPTX text content"

    text = await FileProcessor.extract_text(mock_file)

    assert text == "Extracted PPTX text content"
    mock_extract_pptx.assert_called_once()


@patch('app.services.file_processor.FileProcessor.validate_file')
@patch('app.services.file_processor.FileProcessor._extract_from_docx')
@pytest.mark.asyncio
async def test_extract_text_docx(mock_extract_docx, mock_validate):
    """extract_text debe extraer texto de DOCX"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "document.docx"
    mock_file.read = AsyncMock(return_value=b"DOCX content")

    mock_validate.return_value = ("document.docx", "docx")
    mock_extract_docx.return_value = "Extracted DOCX text content"

    text = await FileProcessor.extract_text(mock_file)

    assert text == "Extracted DOCX text content"
    mock_extract_docx.assert_called_once()


@patch('app.services.file_processor.FileProcessor.validate_file')
@pytest.mark.asyncio
async def test_extract_text_unsupported_extension(mock_validate):
    """extract_text debe rechazar extensiones no soportadas"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "file.unknown"
    mock_file.read = AsyncMock(return_value=b"content")

    mock_validate.return_value = ("file.unknown", "unknown")

    with pytest.raises(HTTPException) as exc_info:
        await FileProcessor.extract_text(mock_file)

    assert exc_info.value.status_code == 400
    assert "no soportado" in exc_info.value.detail


@patch('app.services.file_processor.FileProcessor.validate_file')
@pytest.mark.asyncio
async def test_extract_text_extraction_error(mock_validate):
    """extract_text debe manejar errores de extracción"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "corrupt.pdf"
    mock_file.read = AsyncMock(return_value=b"corrupted content")

    mock_validate.return_value = ("corrupt.pdf", "pdf")

    with patch.object(FileProcessor, '_extract_from_pdf', side_effect=Exception("Corruption error")):
        with pytest.raises(HTTPException) as exc_info:
            await FileProcessor.extract_text(mock_file)

    assert exc_info.value.status_code == 500
    assert "Error al procesar" in exc_info.value.detail


# ========================================
# TESTS PARA _extract_from_txt()
# ========================================

# ========================================
# TESTS PARA validate_file()
# ========================================

def test_validate_file_valid_pdf():
    """Validar archivo PDF válido"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "document.pdf"

    filename, extension = FileProcessor.validate_file(mock_file)

    assert filename == "document.pdf"
    assert extension == "pdf"


def test_validate_file_valid_docx():
    """validate_file debe aceptar archivos DOCX válidos"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "document.docx"

    filename, extension = FileProcessor.validate_file(mock_file)

    assert filename == "document.docx"
    assert extension == "docx"


def test_validate_file_valid_pptx():
    """validate_file debe aceptar archivos PPTX válidos"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "presentation.pptx"

    filename, extension = FileProcessor.validate_file(mock_file)

    assert filename == "presentation.pptx"
    assert extension == "pptx"


def test_validate_file_valid_txt():
    """validate_file debe aceptar archivos TXT válidos"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "notes.txt"

    filename, extension = FileProcessor.validate_file(mock_file)

    assert filename == "notes.txt"
    assert extension == "txt"


def test_validate_file_no_filename():
    """Archivo sin nombre debe fallar"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = None

    with pytest.raises(HTTPException) as exc_info:
        FileProcessor.validate_file(mock_file)

    assert exc_info.value.status_code == 400
    assert "no tiene nombre" in exc_info.value.detail


def test_validate_file_invalid_extension():
    """Extensión inválida debe fallar"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "malware.exe"

    with pytest.raises(HTTPException) as exc_info:
        FileProcessor.validate_file(mock_file)

    assert exc_info.value.status_code == 400
    assert "no soportado" in exc_info.value.detail


def test_validate_file_case_insensitive():
    """validate_file debe ser case-insensitive para extensiones"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "DOCUMENT.PDF"

    filename, extension = FileProcessor.validate_file(mock_file)

    assert extension == "pdf"  # Lowercase


# ========================================
# TESTS PARA validate_file_security()
# ========================================

@patch('app.services.file_processor.FileValidator')
@pytest.mark.asyncio
async def test_validate_file_security_valid(mock_validator):
    """validate_file_security debe validar archivo con magic numbers"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "document.pdf"
    mock_validator.validate_file_content = AsyncMock()

    filename, extension = await FileProcessor.validate_file_security(mock_file)

    assert filename == "document.pdf"
    assert extension == "pdf"
    mock_validator.validate_file_content.assert_called_once_with(mock_file, "pdf")


@patch('app.services.file_processor.FileValidator')
@pytest.mark.asyncio
async def test_validate_file_security_no_filename(mock_validator):
    """validate_file_security debe lanzar 400 sin nombre"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = None

    with pytest.raises(HTTPException) as exc_info:
        await FileProcessor.validate_file_security(mock_file)

    assert exc_info.value.status_code == 400


@patch('app.services.file_processor.FileValidator')
@pytest.mark.asyncio
async def test_validate_file_security_invalid_extension(mock_validator):
    """validate_file_security debe rechazar extensiones inválidas"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "script.js"

    with pytest.raises(HTTPException) as exc_info:
        await FileProcessor.validate_file_security(mock_file)

    assert exc_info.value.status_code == 400
    assert "no soportado" in exc_info.value.detail


# ========================================
# TESTS PARA extract_text()
# ========================================

@patch('app.services.file_processor.FileProcessor.validate_file')
@pytest.mark.asyncio
async def test_extract_text_txt_utf8(mock_validate):
    """extract_text debe extraer texto de archivo TXT en UTF-8"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "test.txt"
    content = "Este es un texto de prueba en UTF-8".encode('utf-8')
    mock_file.read = AsyncMock(return_value=content)

    mock_validate.return_value = ("test.txt", "txt")

    with patch.object(FileProcessor, '_extract_from_txt', return_value="Este es un texto de prueba en UTF-8"):
        text = await FileProcessor.extract_text(mock_file)

    assert "texto de prueba" in text


@patch('app.services.file_processor.FileProcessor.validate_file')
@pytest.mark.asyncio
async def test_extract_text_file_too_large(mock_validate):
    """extract_text debe lanzar 413 si archivo es muy grande"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "huge.pdf"

    # Simulate 100MB file
    large_content = b"x" * (100 * 1024 * 1024)
    mock_file.read = AsyncMock(return_value=large_content)

    mock_validate.return_value = ("huge.pdf", "pdf")

    with pytest.raises(HTTPException) as exc_info:
        await FileProcessor.extract_text(mock_file)

    assert exc_info.value.status_code == 413
    assert "excede el tamaño máximo" in exc_info.value.detail


@patch('app.services.file_processor.FileProcessor.validate_file')
@pytest.mark.asyncio
async def test_extract_text_empty_content(mock_validate):
    """extract_text debe lanzar 400 si no hay texto extraído"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "empty.txt"
    mock_file.read = AsyncMock(return_value=b"   ")  # Solo espacios

    mock_validate.return_value = ("empty.txt", "txt")

    with patch.object(FileProcessor, '_extract_from_txt', return_value="   "):
        with pytest.raises(HTTPException) as exc_info:
            await FileProcessor.extract_text(mock_file)

    assert exc_info.value.status_code == 400
    assert "muy corto" in exc_info.value.detail


@patch('app.services.file_processor.FileProcessor.validate_file')
@patch('app.services.file_processor.FileProcessor._extract_from_pdf')
@pytest.mark.asyncio
async def test_extract_text_pdf(mock_extract_pdf, mock_validate):
    """extract_text debe extraer texto de PDF"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "document.pdf"
    mock_file.read = AsyncMock(return_value=b"PDF content here")

    mock_validate.return_value = ("document.pdf", "pdf")
    mock_extract_pdf.return_value = "Extracted PDF text content"

    text = await FileProcessor.extract_text(mock_file)

    assert text == "Extracted PDF text content"
    mock_extract_pdf.assert_called_once()


@patch('app.services.file_processor.FileProcessor.validate_file')
@patch('app.services.file_processor.FileProcessor._extract_from_pptx')
@pytest.mark.asyncio
async def test_extract_text_pptx(mock_extract_pptx, mock_validate):
    """extract_text debe extraer texto de PPTX"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "presentation.pptx"
    mock_file.read = AsyncMock(return_value=b"PPTX content")

    mock_validate.return_value = ("presentation.pptx", "pptx")
    mock_extract_pptx.return_value = "Extracted PPTX text content"

    text = await FileProcessor.extract_text(mock_file)

    assert text == "Extracted PPTX text content"
    mock_extract_pptx.assert_called_once()


@patch('app.services.file_processor.FileProcessor.validate_file')
@patch('app.services.file_processor.FileProcessor._extract_from_docx')
@pytest.mark.asyncio
async def test_extract_text_docx(mock_extract_docx, mock_validate):
    """extract_text debe extraer texto de DOCX"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "document.docx"
    mock_file.read = AsyncMock(return_value=b"DOCX content")

    mock_validate.return_value = ("document.docx", "docx")
    mock_extract_docx.return_value = "Extracted DOCX text content"

    text = await FileProcessor.extract_text(mock_file)

    assert text == "Extracted DOCX text content"
    mock_extract_docx.assert_called_once()


@patch('app.services.file_processor.FileProcessor.validate_file')
@pytest.mark.asyncio
async def test_extract_text_unsupported_extension(mock_validate):
    """extract_text debe rechazar extensiones no soportadas"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "file.unknown"
    mock_file.read = AsyncMock(return_value=b"content")

    mock_validate.return_value = ("file.unknown", "unknown")

    with pytest.raises(HTTPException) as exc_info:
        await FileProcessor.extract_text(mock_file)

    assert exc_info.value.status_code == 400
    assert "no soportado" in exc_info.value.detail


@patch('app.services.file_processor.FileProcessor.validate_file')
@pytest.mark.asyncio
async def test_extract_text_extraction_error(mock_validate):
    """extract_text debe manejar errores de extracción"""
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "corrupt.pdf"
    mock_file.read = AsyncMock(return_value=b"corrupted content")

    mock_validate.return_value = ("corrupt.pdf", "pdf")

    with patch.object(FileProcessor, '_extract_from_pdf', side_effect=Exception("Corruption error")):
        with pytest.raises(HTTPException) as exc_info:
            await FileProcessor.extract_text(mock_file)

    assert exc_info.value.status_code == 500
    assert "Error al procesar" in exc_info.value.detail


# ========================================
# TESTS PARA _extract_from_txt()
# ========================================

def test_extract_from_txt_utf8():
    """Extraer texto UTF-8 válido"""
    content = "Hello World\nLine 2".encode('utf-8')

    result = FileProcessor._extract_from_txt(content)

    assert result == "Hello World\nLine 2"


def test_extract_from_txt_spanish_utf8():
    """_extract_from_txt debe decodificar UTF-8 con caracteres especiales"""
    content = "Texto en español con ñ y acentos: áéíóú".encode('utf-8')

    text = FileProcessor._extract_from_txt(content)

    assert "español" in text
    assert "ñ" in text
    assert "áéíóú" in text


def test_extract_from_txt_spanish_utf8():
    """_extract_from_txt debe decodificar UTF-8 con caracteres especiales"""
    content = "Texto en español con ñ y acentos: áéíóú".encode('utf-8')

    text = FileProcessor._extract_from_txt(content)

    assert "español" in text
    assert "ñ" in text
    assert "áéíóú" in text


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


# ========================================
# TESTS PARA _extract_from_pdf()
# ========================================

@patch('app.services.file_processor.pdfplumber')
def test_extract_from_pdf_success(mock_pdfplumber):
    """_extract_from_pdf debe extraer texto con pdfplumber"""
    # Mock PDF with pages
    mock_page1 = Mock()
    mock_page1.extract_text.return_value = "Page 1 content"
    mock_page2 = Mock()
    mock_page2.extract_text.return_value = "Page 2 content"

    mock_pdf = Mock()
    mock_pdf.pages = [mock_page1, mock_page2]
    mock_pdf.__enter__ = Mock(return_value=mock_pdf)
    mock_pdf.__exit__ = Mock(return_value=False)

    mock_pdfplumber.open.return_value = mock_pdf

    content = b"PDF binary content"
    text = FileProcessor._extract_from_pdf(content)

    assert "Page 1 content" in text
    assert "Page 2 content" in text


@patch('app.services.file_processor.pdfplumber')
@patch('app.services.file_processor.PdfReader')
def test_extract_from_pdf_fallback_to_pypdf(mock_pdfreader, mock_pdfplumber):
    """_extract_from_pdf debe usar pypdf como fallback"""
    # pdfplumber fails
    mock_pdf_plumber = Mock()
    mock_pdf_plumber.pages = []
    mock_pdf_plumber.__enter__ = Mock(return_value=mock_pdf_plumber)
    mock_pdf_plumber.__exit__ = Mock(return_value=False)
    mock_pdfplumber.open.return_value = mock_pdf_plumber

    # pypdf succeeds
    mock_page = Mock()
    mock_page.extract_text.return_value = "pypdf extracted text"

    mock_pdf_reader = Mock()
    mock_pdf_reader.pages = [mock_page]
    mock_pdfreader.return_value = mock_pdf_reader

    content = b"PDF binary content"
    text = FileProcessor._extract_from_pdf(content)

    assert "pypdf extracted text" in text


@patch('app.services.file_processor.pdfplumber')
def test_extract_from_pdf_error(mock_pdfplumber):
    """_extract_from_pdf debe lanzar excepción con PDF corrupto"""
    mock_pdfplumber.open.side_effect = Exception("Invalid PDF")

    content = b"corrupted PDF"

    with pytest.raises(Exception) as exc_info:
        FileProcessor._extract_from_pdf(content)

    assert "Error al leer PDF" in str(exc_info.value)


# ========================================
# TESTS PARA _extract_from_pptx()
# ========================================

@patch('app.services.file_processor.Presentation')
def test_extract_from_pptx_success(mock_presentation_class):
    """_extract_from_pptx debe extraer texto de slides"""
    # Mock shapes with text
    mock_shape1 = Mock()
    mock_shape1.text = "Title of slide"
    mock_shape1.has_table = False

    mock_shape2 = Mock()
    mock_shape2.text = "Content of slide"
    mock_shape2.has_table = False

    mock_slide = Mock()
    mock_slide.shapes = [mock_shape1, mock_shape2]

    mock_prs = Mock()
    mock_prs.slides = [mock_slide]
    mock_presentation_class.return_value = mock_prs

    content = b"PPTX binary content"
    text = FileProcessor._extract_from_pptx(content)

    assert "Title of slide" in text
    assert "Content of slide" in text


@patch('app.services.file_processor.Presentation')
def test_extract_from_pptx_with_table(mock_presentation_class):
    """_extract_from_pptx debe extraer texto de tablas"""
    # Mock table
    mock_cell1 = Mock()
    mock_cell1.text = "Cell 1"
    mock_cell2 = Mock()
    mock_cell2.text = "Cell 2"

    mock_row = Mock()
    mock_row.cells = [mock_cell1, mock_cell2]

    mock_table = Mock()
    mock_table.rows = [mock_row]

    mock_shape_with_table = Mock()
    mock_shape_with_table.has_table = True
    mock_shape_with_table.table = mock_table
    mock_shape_with_table.text = ""  # No direct text

    mock_slide = Mock()
    mock_slide.shapes = [mock_shape_with_table]

    mock_prs = Mock()
    mock_prs.slides = [mock_slide]
    mock_presentation_class.return_value = mock_prs

    content = b"PPTX with table"
    text = FileProcessor._extract_from_pptx(content)

    assert "Cell 1" in text
    assert "Cell 2" in text


@patch('app.services.file_processor.Presentation')
def test_extract_from_pptx_error(mock_presentation_class):
    """_extract_from_pptx debe lanzar excepción con PPTX corrupto"""
    mock_presentation_class.side_effect = Exception("Invalid PPTX")

    content = b"corrupted PPTX"

    with pytest.raises(Exception) as exc_info:
        FileProcessor._extract_from_pptx(content)

    assert "Error al leer PPTX" in str(exc_info.value)


# ========================================
# TESTS PARA _extract_from_docx()
# ========================================

@patch('app.services.file_processor.Document')
def test_extract_from_docx_success(mock_document_class):
    """_extract_from_docx debe extraer párrafos"""
    # Mock paragraphs
    mock_para1 = Mock()
    mock_para1.text = "First paragraph"

    mock_para2 = Mock()
    mock_para2.text = "Second paragraph"

    mock_doc = Mock()
    mock_doc.paragraphs = [mock_para1, mock_para2]
    mock_doc.tables = []
    mock_document_class.return_value = mock_doc

    content = b"DOCX binary content"
    text = FileProcessor._extract_from_docx(content)

    assert "First paragraph" in text
    assert "Second paragraph" in text


@patch('app.services.file_processor.Document')
def test_extract_from_docx_with_tables(mock_document_class):
    """_extract_from_docx debe extraer texto de tablas"""
    # Mock table
    mock_cell1 = Mock()
    mock_cell1.text = "Table cell 1"

    mock_cell2 = Mock()
    mock_cell2.text = "Table cell 2"

    mock_row = Mock()
    mock_row.cells = [mock_cell1, mock_cell2]

    mock_table = Mock()
    mock_table.rows = [mock_row]

    mock_doc = Mock()
    mock_doc.paragraphs = []
    mock_doc.tables = [mock_table]
    mock_document_class.return_value = mock_doc

    content = b"DOCX with table"
    text = FileProcessor._extract_from_docx(content)

    assert "Table cell 1" in text
    assert "Table cell 2" in text


@patch('app.services.file_processor.Document')
def test_extract_from_docx_skip_empty_paragraphs(mock_document_class):
    """_extract_from_docx debe omitir párrafos vacíos"""
    mock_para1 = Mock()
    mock_para1.text = "Content"

    mock_para2 = Mock()
    mock_para2.text = "   "  # Empty/whitespace

    mock_doc = Mock()
    mock_doc.paragraphs = [mock_para1, mock_para2]
    mock_doc.tables = []
    mock_document_class.return_value = mock_doc

    content = b"DOCX content"
    text = FileProcessor._extract_from_docx(content)

    assert "Content" in text


@patch('app.services.file_processor.Document')
def test_extract_from_docx_error(mock_document_class):
    """_extract_from_docx debe lanzar excepción con DOCX corrupto"""
    mock_document_class.side_effect = Exception("Invalid DOCX")

    content = b"corrupted DOCX"
    with pytest.raises(Exception) as exc_info:
        FileProcessor._extract_from_pptx(content)

    assert "Error al leer PPTX" in str(exc_info.value)


# ========================================
# TESTS PARA _extract_from_docx()
# ========================================

@patch('app.services.file_processor.Document')
def test_extract_from_docx_success(mock_document_class):
    """_extract_from_docx debe extraer párrafos"""
    # Mock paragraphs
    mock_para1 = Mock()
    mock_para1.text = "First paragraph"

    mock_para2 = Mock()
    mock_para2.text = "Second paragraph"

    mock_doc = Mock()
    mock_doc.paragraphs = [mock_para1, mock_para2]
    mock_doc.tables = []
    mock_document_class.return_value = mock_doc

    content = b"DOCX binary content"
    text = FileProcessor._extract_from_docx(content)

    assert "First paragraph" in text
    assert "Second paragraph" in text


@patch('app.services.file_processor.Document')
def test_extract_from_docx_with_tables(mock_document_class):
    """_extract_from_docx debe extraer texto de tablas"""
    # Mock table
    mock_cell1 = Mock()
    mock_cell1.text = "Table cell 1"

    mock_cell2 = Mock()
    mock_cell2.text = "Table cell 2"

    mock_row = Mock()
    mock_row.cells = [mock_cell1, mock_cell2]

    mock_table = Mock()
    mock_table.rows = [mock_row]

    mock_doc = Mock()
    mock_doc.paragraphs = []
    mock_doc.tables = [mock_table]
    mock_document_class.return_value = mock_doc

    content = b"DOCX with table"
    text = FileProcessor._extract_from_docx(content)

    assert "Table cell 1" in text
    assert "Table cell 2" in text


@patch('app.services.file_processor.Document')
def test_extract_from_docx_skip_empty_paragraphs(mock_document_class):
    """_extract_from_docx debe omitir párrafos vacíos"""
    mock_para1 = Mock()
    mock_para1.text = "Content"

    mock_para2 = Mock()
    mock_para2.text = "   "  # Empty/whitespace

    mock_doc = Mock()
    mock_doc.paragraphs = [mock_para1, mock_para2]
    mock_doc.tables = []
    mock_document_class.return_value = mock_doc

    content = b"DOCX content"
    text = FileProcessor._extract_from_docx(content)

    assert "Content" in text


@patch('app.services.file_processor.Document')
def test_extract_from_docx_error(mock_document_class):
    """_extract_from_docx debe lanzar excepción con DOCX corrupto"""
    mock_document_class.side_effect = Exception("Invalid DOCX")

    content = b"corrupted DOCX"

    with pytest.raises(Exception) as exc_info:
        FileProcessor._extract_from_docx(content)
    with pytest.raises(Exception) as exc_info:
        FileProcessor._extract_from_docx(content)

    assert "Error al leer DOCX" in str(exc_info.value)
    assert "Error al leer DOCX" in str(exc_info.value)
