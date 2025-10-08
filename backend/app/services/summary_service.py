"""Service layer for summary-related operations."""
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy import select, join
from sqlalchemy.orm import Session

from app.repositories.models import Document, Summary


class SummaryService:
    """Service class that encapsulates operations for summaries."""

    def list(
        self,
        db: Session,
        user_id: int,
        document_id: Optional[int],
        limit: int,
        offset: int,
    ) -> List[Summary]:
        """Return summaries owned by the provided user, optionally filtered by document."""

        summary_document_join = join(
            Summary,
            Document,
            Summary.document_id == Document.id,
        )

        stmt = (
            select(Summary)
            .select_from(summary_document_join)
            .where(Document.user_id == user_id)
            .limit(limit)
            .offset(offset)
        )

        if document_id is not None:
            stmt = stmt.where(Summary.document_id == document_id)

        result = db.execute(stmt)
        return result.scalars().all()

    def get(self, db: Session, user_id: int, summary_id: int) -> Optional[Summary]:
        """Return a single summary only if it belongs to the provided user."""

        summary_document_join = join(
            Summary,
            Document,
            Summary.document_id == Document.id,
        )

        stmt = (
            select(Summary)
            .select_from(summary_document_join)
            .where(Document.user_id == user_id, Summary.id == summary_id)
        )

        return db.execute(stmt).scalar_one_or_none()

    def create(
        self,
        db: Session,
        user_id: int,
        title: str,
        content: str,
        document_id: int,
    ) -> Summary:
        """Create a summary for a document owned by the user."""

        document_exists_stmt = (
            select(Document.id)
            .where(Document.id == document_id, Document.user_id == user_id)
            .limit(1)
        )
        document_exists = db.execute(document_exists_stmt).scalar_one_or_none()

        if document_exists is None:
            raise HTTPException(status_code=404, detail="documento no encontrado")

        summary = Summary(
            title=title,
            content=content,
            document_id=document_id,
        )
        db.add(summary)
        db.commit()
        db.refresh(summary)
        return summary

    def delete(self, db: Session, user_id: int, summary_id: int) -> None:
        """Delete a summary if it belongs to the provided user."""

        summary_document_join = join(
            Summary,
            Document,
            Summary.document_id == Document.id,
        )

        stmt = (
            select(Summary)
            .select_from(summary_document_join)
            .where(Document.user_id == user_id, Summary.id == summary_id)
        )

        summary = db.execute(stmt).scalar_one_or_none()

        if summary is None:
            raise HTTPException(status_code=404, detail="resumen no encontrado")

        db.delete(summary)
        db.commit()
