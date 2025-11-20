# app/services/document_service.py
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.repositories.models import Document, Summary
from app.schemas.document_schemas import DocumentIn
from docx import Document as DocxReader
from pypdf import PdfReader
from io import BytesIO
from fastapi import UploadFile
import unicodedata

class DocumentService:
    def list(self, db: Session, owner_id: int) -> dict:
        """
        Devuelve SOLO los documentos del usuario indicado.
        """
        items = (
            db.query(Document)
            .filter(Document.user_id == owner_id)
            .order_by(desc(Document.created_at))
            .all()
        )
        # El router espera {"items": [...]}
        return {"items": items}

    def create(self, db: Session, payload: DocumentIn, owner_id: int) -> Document:
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

    def delete(self, db: Session, owner_id: int, doc_id: int) -> bool:
        """
        Elimina el documento del usuario (y sus resúmenes) si le pertenece.
        Retorna True si borró algo, False si no existe o no es del usuario.
        """
        doc = (
            db.query(Document)
            .filter(Document.id == doc_id, Document.user_id == owner_id)
            .first()
        )
        if not doc:
            return False

        # 🔒 Borrar resúmenes asociados (por si no hay ON DELETE CASCADE en la DB)
        db.query(Summary).filter(
            Summary.document_id == doc_id,
            Summary.user_id == owner_id
        ).delete(synchronize_session=False)

        db.delete(doc)
        db.commit()
        return True
    
    async def extract_text_from_file(self, file: UploadFile) -> dict:
        filename = file.filename.lower()

        # === TXT ===
        if filename.endswith(".txt"):
            data = await file.read()
            text = data.decode("utf-8", errors="ignore")
            base = filename.replace(".txt", "")
        # === PDF ===
        elif filename.endswith(".pdf"):
            try:
                reader = PdfReader(BytesIO(await file.read()))
                text = ""
                for page in reader.pages:
                    text += page.extract_text() or ""
                base = filename.replace(".pdf", "")
            except Exception as e:
                raise ValueError("No se pudo leer el PDF")
        # === DOCX ===
        elif filename.endswith(".docx"):
            try:
                doc = DocxReader(BytesIO(await file.read()))
                text = "\n".join([p.text for p in doc.paragraphs])
                base = filename.replace(".docx", "")
            except:
                raise ValueError("No se pudo leer el archivo DOCX")
        else:
            raise ValueError("Formato no permitido. Usa TXT, PDF o DOCX.")

        # Normaliza espacios y genera descripción corta
        clean_text = " ".join(text.split())
        desc = clean_text[:160] if clean_text else None

        return {
            "title": base[:200],
            "description": desc,
            "content": text
        }
