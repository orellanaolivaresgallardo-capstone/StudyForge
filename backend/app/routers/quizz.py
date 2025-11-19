# app/routers/quizz.py
from typing import Optional, Dict, Any, List
import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.core.deps import get_current_user
from app.repositories.models import User
from app.services.quiz_service import QuizService
from app.schemas.quizz_schemas import QuizAnswersIn, QuizCheckOut

router = APIRouter(prefix="/quizzes", tags=["quizzes"])
svc = QuizService()


@router.post("/auto", status_code=status.HTTP_201_CREATED)
def create_auto_quiz(
    document_id: int = Query(..., description="ID del documento"),
    size: int = Query(6, ge=3, le=10, description="Cantidad de preguntas"),
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    """
    Genera un quiz con IA (JSON estructurado) y lo persiste.
    Si el proveedor IA falla/timeout → 503.
    """
    try:
        qz = svc.create_auto(db, me.id, document_id, size)
        return {
            "id": qz.id,
            "document_id": qz.document_id,
            "title": qz.title,
            "size": qz.size,
            "created_at": qz.created_at,
        }
    except ValueError as e:
        # p. ej., documento no pertenece al usuario
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        # fallo del proveedor IA / parseo JSON, etc.
        raise HTTPException(status_code=503, detail=f"AI provider error: {e}")


@router.get("")
def list_quizzes(
    document_id: int = Query(..., description="ID del documento"),
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    """
    Lista los quizzes del usuario para un documento.
    """
    items = svc.list_by_document(db, me.id, document_id)
    return {
        "items": [
            {
                "id": q.id,
                "document_id": q.document_id,
                "title": q.title,
                "size": q.size,
                "created_at": q.created_at,
            }
            for q in items
        ]
    }


@router.get("/{quiz_id}")
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    """
    Devuelve el quiz con sus preguntas.
    Nota: incluye answer_index en la respuesta (el front NO debe mostrarlo).
    """
    qz = svc.get(db, me.id, quiz_id)
    if not qz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    return {
        "id": qz.id,
        "document_id": qz.document_id,
        "title": qz.title,
        "questions": [
            {
                "id": qq.id,
                "question": qq.question,
                "options": json.loads(qq.options_json),
                "answer_index": qq.answer_index,  # mantener para corrección en backend
                "explanation": qq.explanation,
            }
            for qq in qz.questions
        ],
    }


@router.post("/{quiz_id}/answer")
def answer_quiz(
    quiz_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    """
    Recibe {"answers":[int,...]} y devuelve score y detalle booleano.
    """
    answers: List[int] = payload.get("answers") or []
    try:
        score, total, correct = svc.compute_score(db, me.id, quiz_id, answers)
        return {"score": score, "total": total, "correct": correct}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    """
    Borra el quiz (y sus preguntas) si pertenece al usuario.
    """
    qz = svc.get(db, me.id, quiz_id)
    if not qz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    db.delete(qz)
    db.commit()
    return

@router.post("/{quiz_id}/check", response_model=QuizCheckOut)
def check_quiz_answers(
    quiz_id: int,
    payload: QuizAnswersIn,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    """
    Corrige las respuestas del usuario para este quiz y devuelve:
    - score
    - total de preguntas
    - detalle por pregunta (correcta / incorrecta + explicación).
    """
    try:
        score, total, detailed = svc.check_answers_detailed(
            db, me.id, quiz_id, payload.answers
        )
    except RuntimeError:
        raise HTTPException(status_code=404, detail="Quiz not found")

    return {
        "score": score,
        "total": total,
        "results": detailed,
    }
