# app/routers/documents.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.document_schemas import DocumentIn, DocumentOut, DocumentListOut
from app.services.document_service import DocumentService
from app.core.deps import get_current_user
from app.repositories.models import User

router = APIRouter()
service = DocumentService()

@router.get("", response_model=DocumentListOut, summary="List documents (only mine)")
def list_documents(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """
    Devuelve SOLO los documentos del usuario autenticado.
    """
    # Nota: el servicio debe filtrar por owner. Si tu servicio actual no lo hace aún,
    # en el siguiente paso ajustamos DocumentService para soportar owner_id.
    return service.list(db, owner_id=current.id)

@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED, summary="Create document (as me)")
def create_document(
    payload: DocumentIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """
    Crea un documento asignándolo SIEMPRE al usuario autenticado (ignora cualquier user_id del cliente).
    """
    return service.create(db, payload, owner_id=current.id)
