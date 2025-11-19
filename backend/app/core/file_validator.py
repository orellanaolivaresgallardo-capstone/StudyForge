"""
Validador de archivos usando magic numbers (file signatures).
Proporciona seguridad adicional contra manipulación de extensiones.
"""
from typing import Optional, Tuple
from fastapi import HTTPException, status, UploadFile
from app.core.logging import get_logger

logger = get_logger(__name__)


class FileValidator:
    """
    Validador de archivos basado en magic numbers.
    Verifica la firma binaria del archivo para prevenir ataques.
    """
    
    # Magic numbers para tipos de archivo soportados
    # Formato: bytes_signature: (extensión_esperada, descripción)
    MAGIC_NUMBERS = {
        # PDF
        b'%PDF': ('pdf', 'PDF Document'),
        
        # Microsoft Office (ZIP-based: DOCX, PPTX)
        b'PK\x03\x04': ('zip_office', 'ZIP-based Office Document'),
        
        # Plain text (UTF-8 BOM)
        b'\xEF\xBB\xBF': ('txt', 'UTF-8 Text with BOM'),
    }
    
    # Extensiones permitidas por tipo de archivo
    ALLOWED_EXTENSIONS = {
        'pdf': ['pdf'],
        'zip_office': ['docx', 'pptx'],
        'txt': ['txt'],
    }
    
    @staticmethod
    def _read_magic_bytes(content: bytes, length: int = 8) -> bytes:
        """
        Lee los primeros bytes del archivo (magic bytes).
        
        Args:
            content: Contenido del archivo
            length: Número de bytes a leer
            
        Returns:
            Primeros bytes del archivo
        """
        return content[:length]
    
    @staticmethod
    def _detect_file_type(content: bytes) -> Optional[Tuple[str, str]]:
        """
        Detecta el tipo de archivo basándose en los magic bytes.
        
        Args:
            content: Contenido del archivo
            
        Returns:
            Tupla (tipo, descripción) o None si no se reconoce
        """
        magic_bytes = FileValidator._read_magic_bytes(content)
        
        # Verificar cada signature conocida
        for signature, (file_type, description) in FileValidator.MAGIC_NUMBERS.items():
            if magic_bytes.startswith(signature):
                return file_type, description
        
        # Verificar si es texto plano (ASCII/UTF-8 sin BOM)
        try:
            # Intentar decodificar como texto
            content[:1024].decode('utf-8')
            # Si tiene caracteres imprimibles, es probablemente texto
            sample = content[:1024]
            if all(32 <= b < 127 or b in (9, 10, 13) for b in sample[:100]):
                return 'txt', 'Plain Text'
        except (UnicodeDecodeError, AttributeError):
            pass
        
        return None
    
    @staticmethod
    def _is_valid_zip_office(content: bytes, expected_extension: str) -> bool:
        """
        Validación adicional para archivos Office basados en ZIP.
        Verifica que contenga las estructuras esperadas.
        
        Args:
            content: Contenido del archivo
            expected_extension: Extensión esperada (docx, pptx)
            
        Returns:
            True si es válido
        """
        import zipfile
        import io
        
        try:
            # Intentar abrir como ZIP
            with zipfile.ZipFile(io.BytesIO(content), 'r') as zip_file:
                file_list = zip_file.namelist()
                
                # DOCX debe contener document.xml
                if expected_extension == 'docx':
                    return 'word/document.xml' in file_list
                
                # PPTX debe contener presentation.xml
                elif expected_extension == 'pptx':
                    return 'ppt/presentation.xml' in file_list
                
            return False
        except (zipfile.BadZipFile, Exception):
            return False
    
    @staticmethod
    async def validate_file_content(
        file: UploadFile,
        expected_extension: str
    ) -> Tuple[bool, str]:
        """
        Valida que el contenido del archivo coincida con su extensión.
        
        Args:
            file: Archivo a validar
            expected_extension: Extensión esperada basada en nombre
            
        Returns:
            Tupla (es_válido, mensaje)
            
        Raises:
            HTTPException: Si el archivo es peligroso o inválido
        """
        # Leer contenido del archivo
        content = await file.read()
        
        # Resetear posición para lectura posterior
        await file.seek(0)
        
        # Validar tamaño mínimo
        if len(content) < 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo está vacío o es demasiado pequeño"
            )
        
        # Detectar tipo real del archivo
        detected = FileValidator._detect_file_type(content)
        
        if not detected:
            logger.warning(
                f"No se pudo detectar tipo de archivo para: {file.filename}"
            )
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Tipo de archivo no reconocido o no soportado"
            )
        
        file_type, description = detected
        
        # Verificar que la extensión coincida con el tipo detectado
        allowed_extensions = FileValidator.ALLOWED_EXTENSIONS.get(file_type, [])
        
        if expected_extension not in allowed_extensions:
            logger.warning(
                f"Mismatch: archivo {file.filename} tiene extensión "
                f".{expected_extension} pero el contenido es {description}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El contenido del archivo no coincide con su extensión. "
                       f"Se esperaba {expected_extension} pero se detectó {description}"
            )
        
        # Validación adicional para archivos Office ZIP
        if file_type == 'zip_office':
            if not FileValidator._is_valid_zip_office(content, expected_extension):
                logger.warning(
                    f"Archivo {file.filename} no contiene estructura "
                    f"válida de {expected_extension}"
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El archivo no tiene una estructura válida de {expected_extension}"
                )
        
        logger.info(
            f"Archivo validado: {file.filename} ({description}) - "
            f"Extensión: {expected_extension}"
        )
        
        return True, f"Archivo válido: {description}"
    
    @staticmethod
    async def validate_and_get_info(file: UploadFile) -> dict:
        """
        Valida un archivo y retorna información completa.
        
        Args:
            file: Archivo a validar
            
        Returns:
            Diccionario con información del archivo
        """
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo no tiene nombre"
            )
        
        # Obtener extensión
        file_extension = file.filename.split(".")[-1].lower()
        
        # Validar contenido
        is_valid, message = await FileValidator.validate_file_content(
            file, file_extension
        )
        
        # Obtener tamaño
        content = await file.read()
        await file.seek(0)
        
        return {
            'filename': file.filename,
            'extension': file_extension,
            'size_bytes': len(content),
            'is_valid': is_valid,
            'validation_message': message,
            'content_type': file.content_type
        }
