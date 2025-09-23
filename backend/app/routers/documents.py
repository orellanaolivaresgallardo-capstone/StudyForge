from fastapi import APIRouter
from app.schemas.document_schemas import DocumentIn, DocumentOut, DocumentListOut
from app.services.document_service import DocumentService

router = APIRouter()
service = DocumentService()

@router.get("", response_model=DocumentListOut, summary="List documents")
def list_documents():
    return service.list()

@router.post("", response_model=DocumentOut, summary="Create document")
def create_document(payload: DocumentIn):
    return service.create(payload)
