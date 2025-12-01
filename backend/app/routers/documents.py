# app/routers/documents.py
"""
Router de documentos - Subir, listar, obtener y eliminar documentos.
Con validación de cuotas de almacenamiento por usuario.
"""
import os
from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.core.dependencies import get_current_user, verify_document_ownership
from app.core.logging import log_audit_event
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


@router.post("", response_model=DocumentDetailResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(..., description="Archivo a subir (PDF, DOCX, PPTX, TXT)"),
    study_space_ids: str = Form(..., description="IDs de espacios de estudio (separados por coma), al menos uno requerido"),
    title: str = Form(None, description="Título del documento (opcional, usa nombre del archivo si no se especifica)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Sube un documento y lo asigna a uno o más espacios de estudio.

    **IMPORTANTE**: El documento DEBE ser asignado a al menos un espacio de estudio.

    **Validaciones de cuota:**
    - El archivo no debe exceder max_file_size_bytes del usuario
    - El usuario debe tener suficiente espacio disponible (storage_available_bytes)

    Args:
        file: Archivo a subir
        study_space_ids: IDs de espacios separados por coma (ej: "uuid1,uuid2")
        title: Título del documento (opcional)
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Documento creado y asignado a los espacios

    Raises:
        HTTPException 400: Si no se proporciona al menos un espacio o si algún espacio no existe
        HTTPException 413: Si el archivo es demasiado grande
        HTTPException 507: Si no hay suficiente espacio de almacenamiento
        HTTPException 415: Si el tipo de archivo no es soportado
    """
    # 0. Validar y parsear study_space_ids
    if not study_space_ids or study_space_ids.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes asignar el documento a al menos un espacio de estudio"
        )

    try:
        space_ids_list = [UUID(sid.strip()) for sid in study_space_ids.split(",") if sid.strip()]
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de IDs de espacios inválido"
        )

    if not space_ids_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes asignar el documento a al menos un espacio de estudio"
        )

    # Verificar que todos los espacios existen y pertenecen al usuario
    from app.repositories.study_space_repository import StudySpaceRepository
    from app.core.dependencies import verify_space_ownership

    for space_id in space_ids_list:
        space = StudySpaceRepository.get_by_id(db, space_id)
        if not space:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Espacio de estudio {space_id} no encontrado"
            )
        verify_space_ownership(space, current_user)
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
    # Si no se especifica título, usar filename sin extensión (más user-friendly)
    default_title = os.path.splitext(filename)[0]  # "math.txt" → "math"
    document = DocumentRepository.create(
        db=db,
        user_id=current_user.id,
        title=title or default_title,
        file_name=filename,
        file_type=file_type,
        file_size_bytes=file_size_bytes,
        file_content=file_content,
        extracted_text=extracted_text,
    )

    # 7. Asignar documento a los espacios especificados
    from app.repositories.study_space_repository import StudySpaceRepository

    for space_id in space_ids_list:
        space = StudySpaceRepository.get_by_id(db, space_id)
        if space and document not in space.documents:
            space.documents.append(document)

    # 8. Actualizar storage_used_bytes del usuario
    current_user.storage_used_bytes += file_size_bytes
    db.commit()
    db.refresh(current_user)
    db.refresh(document)

    # Audit log: successful document upload
    log_audit_event(
        event="document_upload",
        user_id=str(current_user.id),
        resource_type="document",
        resource_id=str(document.id),
        action="create",
        result="success",
        extra={
            "file_name": filename,
            "file_size_bytes": file_size_bytes,
            "file_type": file_type,
            "space_count": len(space_ids_list)
        }
    )

    # Construir respuesta con study_space_names
    return DocumentDetailResponse(
        id=document.id,
        user_id=document.user_id,
        title=document.title,
        file_name=document.file_name,
        file_type=document.file_type,
        file_size_bytes=document.file_size_bytes,
        created_at=document.created_at,
        updated_at=document.updated_at,
        extracted_text=document.extracted_text,
        study_space_names=[space.name for space in document.study_spaces]
    )


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

    # Construir respuestas con study_space_names
    document_responses = []
    for doc in documents:
        doc_dict = {
            "id": doc.id,
            "user_id": doc.user_id,
            "title": doc.title,
            "file_name": doc.file_name,
            "file_type": doc.file_type,
            "file_size_bytes": doc.file_size_bytes,
            "created_at": doc.created_at,
            "updated_at": doc.updated_at,
            "study_space_names": [space.name for space in doc.study_spaces]
        }
        document_responses.append(DocumentResponse(**doc_dict))

    return DocumentListResponse(items=document_responses, total=total, skip=skip, limit=limit)


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

    IMPORTANTE: Antes de eliminar el documento, denormaliza su información
    en todos los resúmenes asociados para preservar el historial.

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

    # Eliminar documento con denormalización
    from app.services.deletion_service import DeletionService
    success = DeletionService.delete_document_with_denormalization(db, document_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado"
        )

    # Actualizar storage_used_bytes del usuario
    current_user.storage_used_bytes = max(0, current_user.storage_used_bytes - file_size)
    db.commit()

    # Audit log: successful document deletion
    log_audit_event(
        event="document_deletion",
        user_id=str(current_user.id),
        resource_type="document",
        resource_id=str(document_id),
        action="delete",
        result="success",
        extra={"file_size_bytes": file_size}
    )

    return None
