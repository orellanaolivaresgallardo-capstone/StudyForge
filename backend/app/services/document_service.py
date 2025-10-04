# app/services/document_service.py
from sqlalchemy.orm import Session
from app.repositories.document_repo import DocumentRepo
from app.schemas.document_schemas import DocumentIn, DocumentOut, DocumentListOut

class DocumentService:
    def __init__(self, repo: DocumentRepo | None = None):
        self.repo = repo or DocumentRepo()

    def list(self, db: Session) -> DocumentListOut:
        return self.repo.list(db)

    def create(self, db: Session, data: DocumentIn) -> DocumentOut:
        # aquí podrías aplicar reglas/validaciones antes de insertar
        return self.repo.insert(db, data)
