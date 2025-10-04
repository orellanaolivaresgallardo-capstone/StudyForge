# app/repositories/document_repo.py
from sqlalchemy.orm import Session
from app.schemas.document_schemas import DocumentIn, DocumentOut, DocumentListOut
from app.repositories.models import Document

class DocumentRepo:
    def list(self, db: Session) -> DocumentListOut:
        rows = db.query(Document).order_by(Document.id.asc()).all()
        items = [DocumentOut(id=r.id, title=r.title, description=r.description) for r in rows]
        return DocumentListOut(items=items)

    def insert(self, db: Session, data: DocumentIn) -> DocumentOut:
        obj = Document(title=data.title, description=data.description, content=data.content)
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return DocumentOut(id=obj.id, title=obj.title, description=obj.description)
