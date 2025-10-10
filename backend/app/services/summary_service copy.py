# app/services/summary_service.py
from __future__ import annotations

from typing import Optional, List, Tuple
import math
import re

from sqlalchemy.orm import Session

from app.repositories.models import Document, Summary, User
from app.schemas.summary_schemas import (
    SummaryIn,
    SummaryOut,
    SummaryListOut,
)

class SummaryService:
    #
    # CRUD básico (ya lo tenías; lo dejamos completo para claridad)
    #
    def list(
        self, db: Session, user_id: int, limit: int = 20, offset: int = 0, document_id: Optional[int] = None
    ) -> SummaryListOut:
        q = db.query(Summary).filter(Summary.user_id == user_id)
        if document_id is not None:
            q = q.filter(Summary.document_id == document_id)

        rows = (
            q.order_by(Summary.id.asc())
            .offset(offset)
            .limit(min(max(limit, 1), 200))
            .all()
        )
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

    def get(self, db: Session, user_id: int, summary_id: int) -> Optional[SummaryOut]:
        r = (
            db.query(Summary)
            .filter(Summary.user_id == user_id, Summary.id == summary_id)
            .first()
        )
        if not r:
            return None
        return SummaryOut(
            id=r.id,
            title=r.title,
            content=r.content,
            document_id=r.document_id,
            created_at=r.created_at,
        )

    def delete(self, db: Session, user_id: int, summary_id: int) -> bool:
        r = (
            db.query(Summary)
            .filter(Summary.user_id == user_id, Summary.id == summary_id)
            .first()
        )
        if not r:
            return False
        db.delete(r)
        db.commit()
        return True

    def create(self, db: Session, user_id: int, payload: SummaryIn) -> Optional[SummaryOut]:
        # Verificamos que el documento exista y sea del usuario (si documents tiene user_id)
        doc = db.query(Document).filter(Document.id == payload.document_id).first()
        if not doc:
            return None
        # Si Document.owner está activo, valida ownership
        if hasattr(doc, "user_id") and doc.user_id is not None and doc.user_id != user_id:
            return None

        obj = Summary(
            title=payload.title.strip(),
            content=payload.content.strip(),
            document_id=payload.document_id,
            user_id=user_id,
        )
        db.add(obj)
        db.commit()
        db.refresh(obj)

        return SummaryOut(
            id=obj.id,
            title=obj.title,
            content=obj.content,
            document_id=obj.document_id,
            created_at=obj.created_at,
        )

    #
    # AUTO-RESUMEN (ligero, sin dependencias externas)
    #
    def generate_auto_summary(
        self, db: Session, user_id: int, document_id: int, max_sentences: int = 5
    ) -> Optional[SummaryOut]:
        # 1) Carga documento + ownership
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return None
        if hasattr(doc, "user_id") and doc.user_id is not None and doc.user_id != user_id:
            return None

        raw = (doc.content or "").strip()
        if not raw:
            return None

        # 2) Resumen naive:
        #    - Segmenta en oraciones
        #    - Calcula score por TF simple (palabras frecuentes, ignora stopwords básicas)
        #    - Ajuste por longitud (evitar oraciones extremadamente cortas/largas)
        #    - Toma top-N y preserva el orden original
        sentences = self._split_sentences(raw)
        if not sentences:
            return None

        # Construye vocabulario y TF
        tokenized = [self._tokenize(s) for s in sentences]
        tf = {}
        for toks in tokenized:
            for t in toks:
                tf[t] = tf.get(t, 0) + 1

        # Normaliza TF
        total = sum(tf.values()) or 1
        for k in list(tf.keys()):
            tf[k] = tf[k] / total

        # Scoring de cada oración
        scores: List[Tuple[int, float]] = []
        for idx, toks in enumerate(tokenized):
            # suma de TF, penaliza extremos de longitud
            length = max(len(toks), 1)
            base = sum(tf.get(t, 0.0) for t in toks)
            length_penalty = 1.0
            if length < 6:
                length_penalty = 0.6
            elif length > 40:
                length_penalty = 0.7
            score = base * length_penalty
            scores.append((idx, score))

        # Ordena por score desc y elige top-N índices
        scores.sort(key=lambda x: x[1], reverse=True)
        chosen = sorted([idx for idx, _ in scores[:max(1, max_sentences)]])
        summary_text = " ".join(sentences[i] for i in chosen).strip()

        # 3) Persiste como Summary
        title = f"Resumen de: {doc.title[:150]}"
        obj = Summary(
            title=title,
            content=summary_text,
            document_id=doc.id,
            user_id=user_id,
        )
        db.add(obj)
        db.commit()
        db.refresh(obj)

        return SummaryOut(
            id=obj.id,
            title=obj.title,
            content=obj.content,
            document_id=obj.document_id,
            created_at=obj.created_at,
        )

    # ---------------------------
    # utilidades de texto simples
    # ---------------------------
    _sent_splitter = re.compile(r"(?<=[\.\!\?…])\s+|\n+")
    _word_re = re.compile(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+", re.UNICODE)
    _stop = set("""
        de la que el en y a los del se las por un para con no una su al lo como más pero sus le ya o muy sin sobre
        también me hasta hay donde quien desde todo nos durante todos uno les ni contra otros ese eso ante ellos e esto
        mí antes algunos qué unos yo otro otras otra él tanto esa estos mucho quienes nada muchos cual poco ella estar
        estas algunas algo nosotros mi mis tú te ti tu tus ellas nosotras vosotros vosotras os mío mía míos mías tuyo tuya
        tuyos tuyas suyo suya suyos suyas nuestro nuestra nuestros nuestras vuestro vuestra vuestros vuestras esos esas
        estoy estás está estamos estáis están esté estés estemos estéis estén estaré estarás estará estaremos estaréis
        estarán estaba estabas estaba estábamos estabais estaban estuve estuviste estuvo estuvimos estuvisteis estuvieron
        estuviera estuvieras estuviera estuviéramos estuvierais estuvieran estuviese estuvieses estuviese estuviésemos
        estuvieseis estuviesen estando estado estada estados estadas estad
    """.split())

    def _split_sentences(self, text: str) -> List[str]:
        parts = [p.strip() for p in self._sent_splitter.split(text) if p and p.strip()]
        # Colapsa espacios
        return [re.sub(r"\s+", " ", p) for p in parts]

    def _tokenize(self, sentence: str) -> List[str]:
        toks = [t.lower() for t in self._word_re.findall(sentence)]
        return [t for t in toks if t not in self._stop and len(t) > 1]
