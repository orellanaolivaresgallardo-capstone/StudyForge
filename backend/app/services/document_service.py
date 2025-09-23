from app.repositories.document_repo import DocumentRepo
from app.schemas.document_schemas import DocumentIn, DocumentOut, DocumentListOut

class DocumentService:
    def __init__(self, repo: DocumentRepo | None = None):
        self.repo = repo or DocumentRepo()

    def list(self) -> DocumentListOut:
        return self.repo.list()

    def create(self, data: DocumentIn) -> DocumentOut:
        # Aquí más adelante: validaciones, normalización, etc.
        return self.repo.insert(data)
