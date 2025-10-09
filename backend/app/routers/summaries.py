# app/routers/summaries.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db   
from app.core.deps import get_current_user
from app.schemas.summary_schemas import SummaryIn, SummaryOut, SummaryListOut
from app.services.summary_service import SummaryService

router = APIRouter(prefix="/summaries", tags=["summaries"])
service = SummaryService()


@router.get("", response_model=SummaryListOut)
def list_summaries(
    db: Session = Depends(get_db),
    me=Depends(get_current_user),
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    document_id: int | None = Query(None),
):
    return service.list(db, me.id, limit=limit, offset=offset, document_id=document_id)


@router.post("", response_model=SummaryOut, status_code=201)
def create_summary(
    payload: SummaryIn,
    db: Session = Depends(get_db),
    me=Depends(get_current_user),
):
    return service.create(db, me.id, payload)


@router.get("/{summary_id}", response_model=SummaryOut)
def get_summary(
    summary_id: int,
    db: Session = Depends(get_db),
    me=Depends(get_current_user),
):
    return service.get(db, me.id, summary_id)


@router.delete("/{summary_id}", status_code=204)
def delete_summary(
    summary_id: int,
    db: Session = Depends(get_db),
    me=Depends(get_current_user),
):
    service.delete(db, me.id, summary_id)
    return None
