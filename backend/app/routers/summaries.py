# app/routers/summaries.py
"""
Router de resúmenes - Crear, listar, obtener y eliminar resúmenes.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.core.dependencies import get_current_user
from app.core.logging import log_audit_event
from app.services.summary_service import SummaryService
from app.schemas.summary import (
    SummaryResponse,
    SummaryDetailResponse,
    SummaryListResponse,
    SummaryFromDocumentsRequest,
    ExpertiseLevelEnum
)
from app.models.user import User

router = APIRouter()
summary_service = SummaryService()


@router.post("/upload", response_model=SummaryResponse, status_code=status.HTTP_201_CREATED)
async def upload_and_generate_summary(
    file: UploadFile = File(..., description="Archivo a procesar (PDF, PPTX, DOCX, TXT)"),
    study_space_id: UUID = Form(..., description="ID del espacio de estudio"),
    expertise_level: ExpertiseLevelEnum = Form(..., description="Nivel de expertise del resumen"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Sube un documento, lo almacena y genera un resumen con IA.

    El documento se guarda en la base de datos y se asocia con el resumen generado.
    Consume espacio de la cuota de almacenamiento del usuario.

    Args:
        file: Archivo a procesar (PDF, PPTX, DOCX, TXT)
        study_space_id: ID del espacio de estudio al que pertenecerá el resumen
        expertise_level: Nivel de expertise (basico, medio, avanzado)
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Resumen generado con temas y conceptos clave

    Raises:
        HTTPException 413: Si el archivo excede el tamaño máximo permitido
        HTTPException 507: Si no hay suficiente espacio de almacenamiento
        HTTPException 500: Si falla la generación del resumen con OpenAI
    """
    summary = await summary_service.create_summary_from_file(
        db=db,
        user_id=current_user.id,
        study_space_id=study_space_id,
        file=file,
        expertise_level=expertise_level,
    )

    # Audit log: successful summary creation from file
    log_audit_event(
        event="summary_creation",
        user_id=str(current_user.id),
        resource_type="summary",
        resource_id=str(summary.id),
        action="create",
        result="success",
        extra={
            "expertise_level": expertise_level.value,
            "study_space_id": str(study_space_id),
            "source": "file_upload"
        }
    )

    return summary


@router.post("/from-documents", response_model=SummaryResponse, status_code=status.HTTP_201_CREATED)
def generate_summary_from_documents(
    request: SummaryFromDocumentsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Genera un resumen a partir de un documento ya almacenado.

    Crea un resumen desde un documento previamente subido.
    No consume espacio adicional de almacenamiento.

    Args:
        request: ID de documento, espacio de estudio y nivel de expertise
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Resumen generado

    Raises:
        HTTPException 403: Si el documento no pertenece al usuario
        HTTPException 404: Si el documento o espacio no existe
    """
    summary = summary_service.create_summary_from_documents(
        db=db,
        user=current_user,
        document_id=request.document_id,
        study_space_id=request.study_space_id,
        expertise_level=request.expertise_level,
    )

    # Audit log: successful summary creation from existing document
    log_audit_event(
        event="summary_creation",
        user_id=str(current_user.id),
        resource_type="summary",
        resource_id=str(summary.id),
        action="create",
        result="success",
        extra={
            "expertise_level": request.expertise_level.value,
            "study_space_id": str(request.study_space_id),
            "document_id": str(request.document_id),
            "source": "existing_document"
        }
    )

    return summary


@router.get("", response_model=SummaryListResponse)
def list_summaries(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lista todos los resúmenes del usuario autenticado.

    Args:
        skip: Número de registros a saltar (paginación)
        limit: Número máximo de registros a retornar
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Lista de resúmenes con total
    """
    summaries, total = summary_service.get_summaries(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )

    # Pydantic automáticamente convierte los ORM models usando model_config from_attributes
    return SummaryListResponse(items=summaries, total=total)


@router.get("/{summary_id}", response_model=SummaryDetailResponse)
def get_summary(
    summary_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Obtiene un resumen específico con documentos asociados.

    Args:
        summary_id: ID del resumen
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Resumen completo con documentos fuente

    Raises:
        HTTPException: Si el resumen no existe o no pertenece al usuario
    """
    summary = summary_service.get_summary(
        db=db,
        summary_id=summary_id,
        user=current_user,
    )

    # Pydantic automáticamente convierte el ORM model con sus relaciones
    return SummaryDetailResponse.model_validate(summary)


@router.delete("/{summary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_summary(
    summary_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Elimina un resumen.

    Args:
        summary_id: ID del resumen
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Raises:
        HTTPException: Si el resumen no existe o no pertenece al usuario
    """
    summary_service.delete_summary(
        db=db,
        summary_id=summary_id,
        user=current_user,
    )

    # Audit log: successful summary deletion
    log_audit_event(
        event="summary_deletion",
        user_id=str(current_user.id),
        resource_type="summary",
        resource_id=str(summary_id),
        action="delete",
        result="success"
    )

    return None
