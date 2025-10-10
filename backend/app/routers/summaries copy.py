# app/routers/summaries.py
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db                 # <- ojo: es app.db (no app.core.db)
from app.core.deps import get_current_user
from app.schemas.summary_schemas import SummaryIn, SummaryOut, SummaryListOut
from app.services.summary_service import SummaryService

router = APIRouter(prefix="/summaries", tags=["summaries"])
service = SummaryService()


@router.get("", response_model=SummaryListOut, summary="List Summaries")
def list_summaries(
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    document_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    me=Depends(get_current_user),
):
    return service.list(db, me.id, limit=limit, offset=offset, document_id=document_id)


@router.post("", response_model=SummaryOut, status_code=201, summary="Create Summary")
def create_summary(
    payload: SummaryIn,
    db: Session = Depends(get_db),
    me=Depends(get_current_user),
):
    return service.create(db, me.id, payload)


@router.get("/{summary_id}", response_model=SummaryOut, summary="Get Summary")
def get_summary(
    summary_id: int,
    db: Session = Depends(get_db),
    me=Depends(get_current_user),
):
    return service.get(db, me.id, summary_id)


@router.delete("/{summary_id}", status_code=204, summary="Delete Summary")
def delete_summary(
    summary_id: int,
    db: Session = Depends(get_db),
    me=Depends(get_current_user),
):
    service.delete(db, me.id, summary_id)
    return None


# --------- NUEVO: auto-resumen ----------
@router.post("/auto", response_model=SummaryOut, status_code=201, summary="Auto-generate Summary for a document")
def auto_summary(
    document_id: int = Query(..., description="ID del documento a resumir"),
    max_sentences: int = Query(5, ge=1, le=12, description="Máx. oraciones"),
    db: Session = Depends(get_db),
    me=Depends(get_current_user),
):
    out = service.generate_auto_summary(db, me.id, document_id=document_id, max_sentences=max_sentences)
    if not out:
        # puede ser doc inexistente, sin contenido o sin permiso
        raise HTTPException(status_code=400, detail="no se pudo generar el resumen")
    return out
