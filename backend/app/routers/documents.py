# app/routers/documents.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.document_schemas import DocumentIn, DocumentOut, DocumentListOut
from app.services.document_service import DocumentService

router = APIRouter()
service = DocumentService()

@router.get("", response_model=DocumentListOut, summary="List documents")
def list_documents(db: Session = Depends(get_db)):
    return service.list(db)

@router.post("", response_model=DocumentOut, summary="Create document")
def create_document(payload: DocumentIn, db: Session = Depends(get_db)):
    return service.create(db, payload)
