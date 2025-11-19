# app/routers/summaries.py
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.core.deps import get_current_user
from app.repositories.models import Document, User
from app.schemas.summary_schemas import SummaryIn, SummaryOut, SummaryListOut
from app.services.summary_service import SummaryService, summarize_strict

router = APIRouter(prefix="/summaries", tags=["summaries"])
service = SummaryService()


@router.get("", response_model=SummaryListOut, summary="List Summaries")
def list_summaries(
    document_id: Optional[int] = Query(None, description="Filtrar por documento"),
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    """
    Lista resúmenes del usuario autenticado.

    - Si se pasa document_id: sólo ese documento.
    - Si no: todos los resúmenes del usuario.
    """
    return service.list(db=db, user_id=me.id, document_id=document_id)


@router.post("", response_model=SummaryOut, status_code=status.HTTP_201_CREATED, summary="Create Summary")
def create_summary(
    payload: SummaryIn,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    """
    Crea un resumen manual para un documento del usuario.
    """
    # Validamos que el documento exista y sea del usuario
    doc = (
        db.query(Document)
        .filter(Document.id == payload.document_id, Document.user_id == me.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="documento no encontrado")

    return service.create(db=db, user_id=me.id, payload=payload)


@router.delete(
    "/{summary_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Summary",
)
def delete_summary(
    summary_id: int,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    """
    Elimina un resumen del usuario.
    """
    ok = service.delete(db=db, user_id=me.id, summary_id=summary_id)
    if not ok:
        raise HTTPException(status_code=404, detail="resumen no encontrado")
    return None


# --------- Auto-resumen con IA ----------
@router.post(
    "/auto",
    response_model=SummaryOut,
    status_code=status.HTTP_201_CREATED,
    summary="Auto-generate Summary for a document",
)
def auto_summary(
    document_id: int = Query(..., description="ID del documento a resumir"),
    max_sentences: int = Query(5, ge=1, le=12, description="Máx. oraciones"),
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    """
    Genera un resumen con IA para un documento del usuario y lo guarda en DB.
    """
    # 1) Validar que el documento existe y pertenece al usuario
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == me.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="documento no encontrado")

    # 2) Pedir resumen a la IA (sin fallback)
    try:
        content, provider, chunks_used = summarize_strict(
            doc.title or "",
            doc.content or "",
            max_sentences=max_sentences,
        )
    except Exception as e:
        # 503 = proveedor de IA caído / mal configurado
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI provider error: {e}",
        )

    # 3) Guardar el resumen en la tabla summaries
    payload = SummaryIn(
        title=doc.title,
        content=content,
        document_id=doc.id,
    )
    return service.create(db=db, user_id=me.id, payload=payload)
