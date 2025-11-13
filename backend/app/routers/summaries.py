# app/routers/summaries.py
from typing import Optional, List
import re
import string

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.core.deps import get_current_user
from app.repositories.models import Document, User
from app.schemas.summary_schemas import SummaryIn, SummaryOut, SummaryListOut
from app.services.summary_service import SummaryService

router = APIRouter(prefix="/summaries", tags=["summaries"])
service = SummaryService()


# ---------- helpers: resumen "abstractive-ish" por reglas ----------
_ES_STOPWORDS = {
    "a","acá","al","algo","algunas","algunos","allá","allí","ante","antes","aquel","aquella","aquellas","aquellos","aqui","aquí","arriba","así",
    "aún","cada","como","con","cual","cuando","cuándo","de","debe","debido","del","desde","donde","dónde","dos","el","él","ella","ellas","ellos",
    "en","entre","era","ese","eso","esos","esta","está","están","estaba","estaban","estamos","estar","este","esto","estos","fue","fueron","ha",
    "haber","había","habían","han","hasta","la","las","le","les","lo","los","más","me","mi","mientras","muy","no","nos","nosotros","o","otra",
    "otros","para","pero","poco","por","porque","que","qué","quien","quién","quienes","se","ser","si","sí","sin","sobre","su","sus","también",
    "tan","tanto","te","ti","tiene","tienen","tu","tus","un","una","uno","unos","usted","y","ya"
}

_SENT_SPLIT = re.compile(r'(?<=[\.\!\?])\s+')

def _strip_emojis(text: str) -> str:
    # elimina caracteres fuera del BMP y pictogramas comunes
    return re.sub(r'[\U00010000-\U0010ffff]', '', text)

def _normalize_text(text: str) -> str:
    text = _strip_emojis(text)
    text = text.replace("“","").replace("”","").replace("«","").replace("»","")
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def _split_sentences_es(text: str) -> List[str]:
    text = _normalize_text(text)
    sents = _SENT_SPLIT.split(text) if text else []
    sents = [s.strip() for s in sents if s.strip()]
    return sents

def _tokens(text: str) -> List[str]:
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation + "“”«»…"))
    toks = re.split(r'\s+', text)
    return [t for t in toks if len(t) > 2 and t not in _ES_STOPWORDS and not t.isdigit()]

def _top_keywords(text: str, k: int = 4) -> List[str]:
    freq = {}
    for t in _tokens(text):
        freq[t] = freq.get(t, 0) + 1
    # top k por frecuencia y luego por longitud (palabras más informativas)
    kws = sorted(freq.items(), key=lambda x: (x[1], len(x[0])), reverse=True)
    return [w for w, _ in kws[:k]]

def _compress_sentence(s: str, limit: int = 140) -> str:
    s = _normalize_text(s)
    if len(s) > limit:
        s = s[:limit].rstrip(" ,;") + "…"
    if not s.endswith(('.', '!', '?')):
        s += '.'
    return s

def _strip_leadins(s: str) -> str:
    # elimina muletillas para que suene a tema
    s_low = s.lower().strip()
    leadins = [
        "había una vez", "había una vez", "un día", "un dia", "entonces", "y entonces",
        "desde entonces", "y desde entonces"
    ]
    for li in leadins:
        if s_low.startswith(li):
            return s[len(li):].lstrip(" ,.:;—-")
    return s

def summarize_text_rulebased(text: str, max_sentences: int = 3) -> str:
    """
    Resumen breve y legible en 2–3 frases:
    1) Tema del texto (derivado de la 1ª oración, sin muletillas).
    2) Ideas/acciones clave (keywords).
    3) Cierre con la última oración (si aporta).
    """
    sents = _split_sentences_es(text)
    if not sents:
        return "(sin contenido)"

    first = _strip_leadins(sents[0])
    first = _compress_sentence(f"El texto trata de {first}", 160)

    kws = _top_keywords(text, k=4)
    middle = ""
    if kws:
        middle = _compress_sentence("A lo largo del relato aparecen ideas como " + ", ".join(kws), 160)

    last = ""
    if len(sents) > 1:
        last = _compress_sentence("En conclusión, " + sents[-1], 160)

    parts = [first]
    if middle:
        parts.append(middle)
    if last:
        parts.append(last)

    # respeta max_sentences (mínimo 1)
    parts = parts[:max(1, max_sentences)]
    return " ".join(parts)


# ------------------- endpoints -------------------

@router.get("", response_model=SummaryListOut)
def list_summaries(
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    document_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    return service.list(db, me.id, limit=limit, offset=offset, document_id=document_id)


@router.post("", response_model=SummaryOut, status_code=status.HTTP_201_CREATED)
def create_summary(
    payload: SummaryIn,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    result = service.create(db, me.id, payload)
    if result is None:
        doc = db.query(Document).filter(Document.id == payload.document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="documento no encontrado")
        if getattr(doc, "user_id", None) is not None and doc.user_id != me.id:
            raise HTTPException(status_code=403, detail="no tienes acceso a este documento")
        raise HTTPException(status_code=400, detail="no se pudo crear el resumen")
    return result


@router.get("/{summary_id}", response_model=SummaryOut)
def get_summary(
    summary_id: int,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    result = service.get(db, me.id, summary_id)
    if result is None:
        raise HTTPException(status_code=404, detail="resumen no encontrado")
    return result


@router.delete("/{summary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_summary(
    summary_id: int,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    deleted = service.delete(db, me.id, summary_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="resumen no encontrado")
    return


@router.post("/auto", response_model=SummaryOut, status_code=status.HTTP_201_CREATED)
def create_auto_summary(
    document_id: int = Query(..., description="ID del documento"),
    max_sentences: int = Query(3, ge=1, le=6, description="Frases en el resumen"),
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="documento no encontrado")
    if getattr(doc, "user_id", None) is not None and doc.user_id != me.id:
        raise HTTPException(status_code=403, detail="no tienes acceso a este documento")

    # Resumen por reglas (mejor que cortar oraciones)
    content = summarize_text_rulebased(doc.content or "", max_sentences=max_sentences)

    # TÍTULO DEL RESUMEN = TÍTULO DEL DOCUMENTO (sin “Resumen de:”)
    payload = SummaryIn(title=doc.title, content=content, document_id=doc.id)
    result = service.create(db, me.id, payload)
    if result is None:
        raise HTTPException(status_code=400, detail="no se pudo crear el resumen")
    return result
