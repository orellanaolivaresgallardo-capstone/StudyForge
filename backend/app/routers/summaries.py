from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.core.security import get_current_user
from app.schemas.summary_schemas import SummaryIn, SummaryOut, SummaryListOut
from app.services.summary_service import SummaryService
from app.repositories.models import Summary


router = APIRouter(prefix="/summaries", tags=["summaries"])
summary_service = SummaryService()


@router.get("", response_model=SummaryListOut)
def list_summaries(
    limit: int = 20,
    offset: int = 0,
    document_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> SummaryListOut:
    summaries: list[Summary] = summary_service.list(
        db=db,
        user_id=current_user.id,
        document_id=document_id,
        limit=limit,
        offset=offset,
    )
    return SummaryListOut(items=summaries)


@router.get("/{summary_id}", response_model=SummaryOut)
def get_summary(
    summary_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> SummaryOut:
    summary = summary_service.get(db=db, user_id=current_user.id, summary_id=summary_id)
    if summary is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="resumen no encontrado")
    return summary


@router.post("", response_model=SummaryOut)
def create_summary(
    payload: SummaryIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> SummaryOut:
    summary = summary_service.create(
        db=db,
        user_id=current_user.id,
        title=payload.title,
        content=payload.content,
        document_id=payload.document_id,
    )
    return summary


@router.delete("/{summary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_summary(
    summary_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> None:
    summary_service.delete(db=db, user_id=current_user.id, summary_id=summary_id)
