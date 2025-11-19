# app/routers/documents.py
"""
Router de documentos - Subir, listar, obtener y eliminar documentos.
Con validación de cuotas de almacenamiento por usuario.
"""
from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.core.dependencies import get_current_user, verify_document_ownership
from app.repositories.document_repository import DocumentRepository
from app.repositories.user_repository import UserRepository
from app.services.file_processor import FileProcessor
from app.schemas.document import (
    DocumentResponse,
    DocumentDetailResponse,
    DocumentListResponse,
    DocumentUpdateTitle,
    StorageInfo,
)
from app.models.user import User

router = APIRouter()


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(..., description="Archivo a subir (PDF, DOCX, PPTX, TXT)"),
    title: str = Form(None, description="Título del documento (opcional, usa nombre del archivo si no se especifica)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Sube un documento y lo almacena.

    **Validaciones de cuota:**
    - El archivo no debe exceder max_file_size_bytes del usuario
    - El usuario debe tener suficiente espacio disponible (storage_available_bytes)

    Args:
        file: Archivo a subir
        title: Título del documento (opcional)
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Documento creado

    Raises:
        HTTPException 413: Si el archivo es demasiado grande
        HTTPException 507: Si no hay suficiente espacio de almacenamiento
        HTTPException 415: Si el tipo de archivo no es soportado
    """
    # 1. Validar tipo de archivo con magic numbers (seguridad)
    filename, file_type = await FileProcessor.validate_file_security(file)

    # 2. Leer contenido del archivo
    file_content = await file.read()
    file_size_bytes = len(file_content)

    # 3. Validar tamaño del archivo contra cuota del usuario
    if file_size_bytes > current_user.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"El archivo excede el tamaño máximo permitido de {current_user.max_file_size_bytes // (1024 * 1024)} MB"
        )

    # 4. Validar espacio disponible del usuario
    if current_user.storage_available_bytes < file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_507_INSUFFICIENT_STORAGE,
            detail=f"No tienes suficiente espacio de almacenamiento. Disponible: {current_user.storage_available_bytes // (1024 * 1024)} MB, Requerido: {file_size_bytes // (1024 * 1024)} MB"
        )

    # 5. Extraer texto del archivo para búsqueda futura
    # Reiniciar el cursor del archivo para poder leerlo de nuevo
    await file.seek(0)
    extracted_text = await FileProcessor.extract_text(file)

    # 6. Crear documento en BD
    document = DocumentRepository.create(
        db=db,
        user_id=current_user.id,
        title=title or filename,
        file_name=filename,
        file_type=file_type,
        file_size_bytes=file_size_bytes,
        file_content=file_content,
        extracted_text=extracted_text,
    )

    # 7. Actualizar storage_used_bytes del usuario
    current_user.storage_used_bytes += file_size_bytes
    db.commit()
    db.refresh(current_user)

    return document


@router.get("", response_model=DocumentListResponse)
def list_documents(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lista todos los documentos del usuario autenticado.

    Args:
        skip: Número de registros a saltar (paginación)
        limit: Número máximo de registros a retornar
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Lista de documentos con total
    """
    documents = DocumentRepository.get_by_user(db, current_user.id, skip, limit)
    total = DocumentRepository.count_by_user(db, current_user.id)

    return DocumentListResponse(items=documents, total=total, skip=skip, limit=limit)


@router.get("/storage", response_model=StorageInfo)
def get_storage_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Obtiene información de almacenamiento del usuario.

    Args:
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Información de cuota y uso de almacenamiento
    """
    total_documents = DocumentRepository.count_by_user(db, current_user.id)

    return StorageInfo(
        storage_quota_bytes=current_user.storage_quota_bytes,
        storage_used_bytes=current_user.storage_used_bytes,
        storage_available_bytes=current_user.storage_available_bytes,
        storage_usage_percentage=current_user.storage_usage_percentage,
        total_documents=total_documents,
    )


@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Obtiene un documento específico con su contenido.

    Args:
        document_id: ID del documento
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Documento completo con contenido

    Raises:
        HTTPException 404: Si el documento no existe
        HTTPException 403: Si el documento no pertenece al usuario
    """
    document = DocumentRepository.get_by_id(db, document_id)
    document = verify_document_ownership(document, current_user)

    return document


@router.patch("/{document_id}", response_model=DocumentResponse)
def update_document_title(
    document_id: UUID,
    update_data: DocumentUpdateTitle,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Actualiza el título de un documento.

    Args:
        document_id: ID del documento
        update_data: Nuevos datos (título)
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Documento actualizado

    Raises:
        HTTPException 404: Si el documento no existe
        HTTPException 403: Si el documento no pertenece al usuario
    """
    document = DocumentRepository.get_by_id(db, document_id)
    document = verify_document_ownership(document, current_user)

    # Actualizar título
    document.title = update_data.title
    db.commit()
    db.refresh(document)

    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Elimina un documento y libera el espacio de almacenamiento.

    Args:
        document_id: ID del documento
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Raises:
        HTTPException 404: Si el documento no existe
        HTTPException 403: Si el documento no pertenece al usuario
    """
    document = DocumentRepository.get_by_id(db, document_id)
    document = verify_document_ownership(document, current_user)

    # Guardar tamaño para liberar storage
    file_size = document.file_size_bytes

    # Eliminar documento
    DocumentRepository.delete(db, document_id)

    # Actualizar storage_used_bytes del usuario
    current_user.storage_used_bytes = max(0, current_user.storage_used_bytes - file_size)
    db.commit()

    return None
