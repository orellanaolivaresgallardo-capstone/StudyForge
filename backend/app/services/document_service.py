# app/services/document_service.py
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.repositories.models import Document
from app.schemas.document_schemas import DocumentIn

class DocumentService:
    def list(self, db: Session, owner_id: int):
        """
        Devuelve SOLO los documentos del usuario indicado.
        """
        items = (
            db.query(Document)
            .filter(Document.user_id == owner_id)
            .order_by(desc(Document.created_at))
            .all()
        )
        # El router ya espera DocumentListOut -> {"items": [...]}
        return {"items": items}

    def create(self, db: Session, payload: DocumentIn, owner_id: int):
        """
        Crea un documento asignándolo SIEMPRE al usuario indicado (owner_id).
        """
        doc = Document(
            title=payload.title,
            description=payload.description,
            content=payload.content,
            user_id=owner_id,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc
