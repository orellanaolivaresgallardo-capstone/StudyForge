from __future__ import annotations

import os
from typing import List, Tuple, Optional

from sqlalchemy.orm import Session

from app.repositories.models import Summary, Document
from app.schemas.summary_schemas import SummaryIn, SummaryOut, SummaryListOut
from .llm_provider import LlmProvider
from .openai_adapter import OpenAiAdapter

# Máximo de caracteres por chunk antes de mandarlo a la IA
MAX_CHUNK_CHARS = 2400


class SummaryService:
    """Operaciones CRUD sobre summaries (sin lógica de IA)."""

    def list_for_user(
        self,
        db: Session,
        user_id: int,
        document_id: Optional[int] = None,
    ) -> SummaryListOut:
        q = db.query(Summary).filter(Summary.user_id == user_id)
        if document_id is not None:
            q = q.filter(Summary.document_id == document_id)

        rows = q.order_by(Summary.created_at.desc()).all()
        items = [SummaryOut.model_validate(r) for r in rows]
        return SummaryListOut(items=items)
    
    def list(
        self,
        db: Session,
        user_id: int,
        document_id: Optional[int] = None,
    ) -> SummaryListOut:
        """Alias para mantener compatibilidad con el router existente."""
        return self.list_for_user(db=db, user_id=user_id, document_id=document_id)
    

    def create(self, db: Session, user_id: int, payload: SummaryIn) -> SummaryOut:
        # Opcional: podríamos validar que el documento pertenece al usuario aquí.
        row = Summary(
            title=payload.title,
            content=payload.content,
            document_id=payload.document_id,
            user_id=user_id,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return SummaryOut.model_validate(row)

    def delete(self, db: Session, user_id: int, summary_id: int) -> bool:
        row = (
            db.query(Summary)
            .filter(Summary.user_id == user_id, Summary.id == summary_id)
            .first()
        )
        if not row:
            return False

        db.delete(row)
        db.commit()
        return True


def _choose_provider() -> LlmProvider:
    prov = os.getenv("SUMMARIZER_PROVIDER", "").lower()
    # Por ahora solo soportamos OpenAI; si hace falta otro, se agrega acá.
    if prov == "openai":
        return OpenAiAdapter()
    raise RuntimeError("IA provider not configured (set SUMMARIZER_PROVIDER=openai)")


def _chunk(text: str, max_chars: int = MAX_CHUNK_CHARS) -> List[str]:
    text = (text or "").strip()
    if not text:
        return []

    if len(text) <= max_chars:
        return [text]

    out: List[str] = []
    current: List[str] = []
    current_len = 0

    # Rompemos por párrafos primero
    for para in text.split("\n\n"):
        p = para.strip()
        if not p:
            continue
        if current_len + len(p) + 2 <= max_chars:
            current.append(p)
            current_len += len(p) + 2
        else:
            if current:
                out.append("\n\n".join(current))
            current = [p]
            current_len = len(p)

    if current:
        out.append("\n\n".join(current))

    return out


def summarize_strict(
    title: str,
    text: str,
    max_sentences: int = 5,
) -> Tuple[str, str, int]:
    """Hace chunking y resume SOLO con IA.

    Devuelve:
        content: str  -> texto resumido final
        provider: str -> nombre del proveedor (ej: "openai")
        chunks_used: int -> cuántos chunks se mandaron a la IA
    """
    prov = _choose_provider()
    raw = (text or "").strip()
    if not raw:
        raise ValueError("Empty text to summarize")

    chunks = _chunk(raw, MAX_CHUNK_CHARS)
    if not chunks:
        raise ValueError("Empty text after preprocessing")

    # Escalamos la longitud objetivo en base a la cantidad de chunks.
    # max_sentences viene del frontend (parámetro del usuario).
    target_total = max(1, max_sentences)
    per_chunk = max(2, target_total // max(1, len(chunks)))

    used = 0
    partials: List[str] = []

    # 1) Resumir cada chunk con IA
    for ch in chunks:
        out = prov.summarize_text(ch, target_sentences=per_chunk, timeout_s=14.0)
        if not out:
            raise RuntimeError("AI summarization failed (chunk)")
        used += 1
        partials.append(out)

    # 2) Resumen final de resúmenes (también con IA)
    combined = "\n\n".join(partials)
    final = prov.summarize_text(
        combined,
        target_sentences=target_total,
        timeout_s=16.0,
    )
    if not final:
        raise RuntimeError("AI summarization failed (final)")

    return final, prov.name, used
