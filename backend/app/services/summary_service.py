# app/services/summary_service.py
from typing import Optional, List
from sqlalchemy.orm import Session

from app.repositories.models import Summary, Document
from app.schemas.summary_schemas import SummaryIn, SummaryOut, SummaryListOut


class SummaryService:
    def list(
        self,
        db: Session,
        user_id: int,
        *,
        limit: int = 20,
        offset: int = 0,
        document_id: Optional[int] = None,
    ) -> SummaryListOut:
        q = db.query(Summary).filter(Summary.user_id == user_id)
        if document_id is not None:
            q = q.filter(Summary.document_id == document_id)
        q = q.order_by(Summary.id.asc()).limit(limit).offset(offset)
        rows: List[Summary] = q.all()
        items = [
            SummaryOut(
                id=r.id,
                title=r.title,
                content=r.content,
                document_id=r.document_id,
                created_at=r.created_at,
            )
            for r in rows
        ]
        return SummaryListOut(items=items)

    def create(self, db: Session, user_id: int, data: SummaryIn) -> SummaryOut:
        """
        Crea un summary. Reglas:
        - user_id SIEMPRE se toma del usuario autenticado.
        - Permite document_id aunque el documento no tenga owner (compat con docs viejos).
        """
        # (Opcional) validar que el documento exista
        doc = db.query(Document).filter(Document.id == data.document_id).first()
        if not doc:
            # Documento inexistente
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="documento no encontrado")

        # Insert
        summary = Summary(
            title=data.title,
            content=data.content,
            document_id=data.document_id,
            user_id=user_id,                 # <- CLAVE: setear siempre el owner
        )
        db.add(summary)
        db.commit()
        db.refresh(summary)

        return SummaryOut(
            id=summary.id,
            title=summary.title,
            content=summary.content,
            document_id=summary.document_id,
            created_at=summary.created_at,
        )

    def get(self, db: Session, user_id: int, summary_id: int) -> SummaryOut:
        r = db.query(Summary).filter(
            Summary.id == summary_id, Summary.user_id == user_id
        ).first()
        if not r:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="summary no encontrado")
        return SummaryOut(
            id=r.id,
            title=r.title,
            content=r.content,
            document_id=r.document_id,
            created_at=r.created_at,
        )

    def delete(self, db: Session, user_id: int, summary_id: int) -> None:
        r = db.query(Summary).filter(
            Summary.id == summary_id, Summary.user_id == user_id
        ).first()
        if not r:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="summary no encontrado")
        db.delete(r)
        db.commit()
