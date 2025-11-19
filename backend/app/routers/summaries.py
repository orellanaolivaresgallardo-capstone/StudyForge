# app/routers/summaries.py
"""
Router de resúmenes - Crear, listar, obtener y eliminar resúmenes.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.core.dependencies import get_current_user
from app.services.summary_service import SummaryService
from app.schemas.summary import SummaryResponse, SummaryListResponse, ExpertiseLevelEnum
from app.models.user import User

router = APIRouter()
summary_service = SummaryService()


@router.post("/upload", response_model=SummaryResponse, status_code=status.HTTP_201_CREATED)
async def upload_and_generate_summary(
    file: UploadFile = File(..., description="Archivo a procesar (PDF, PPTX, DOCX, TXT)"),
    expertise_level: ExpertiseLevelEnum = Form(..., description="Nivel de expertise del resumen"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Sube un documento y genera un resumen con IA.

    **El documento NO se almacena**, solo se procesa para generar el resumen.

    Args:
        file: Archivo a procesar
        expertise_level: Nivel de expertise (basico, medio, avanzado)
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Resumen generado con temas y conceptos clave
    """
    summary = await summary_service.create_summary_from_file(
        db=db,
        user_id=current_user.id,
        file=file,
        expertise_level=expertise_level,
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
    return SummaryListResponse(items=summaries, total=total)


@router.get("/{summary_id}", response_model=SummaryResponse)
def get_summary(
    summary_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Obtiene un resumen específico.

    Args:
        summary_id: ID del resumen
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Resumen completo

    Raises:
        HTTPException: Si el resumen no existe o no pertenece al usuario
    """
    summary = summary_service.get_summary(
        db=db,
        summary_id=summary_id,
        user=current_user,
    )
    return summary


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
    return None
