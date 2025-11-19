# app/services/quiz_service.py

from typing import Dict, Any, List, Optional, Tuple
import json

from sqlalchemy.orm import Session

from app.repositories.models import Quiz, QuizQuestion, Document
from .openai_adapter import OpenAiAdapter


class QuizService:
    def __init__(self) -> None:
        self.prov = OpenAiAdapter()

    # ---------- Crear quiz automático con IA ----------
    def create_auto(
        self,
        db: Session,
        user_id: int,
        document_id: int,
        size: int = 6,
    ) -> Quiz:
        """
        Genera un quiz vía IA a partir de un documento del usuario y lo persiste.

        - Llama a self.prov.generate_quiz(title, text, size)
        - Tolera pequeñas variaciones en las claves del JSON (ej. ' "questions" ')
        - Crea registros en quizzes y quiz_questions
        """

        # 1) Verificar que el documento existe y pertenece al usuario
        doc: Optional[Document] = (
            db.query(Document)
            .filter(
                Document.id == document_id,
                Document.user_id == user_id,
            )
            .first()
        )
        if not doc:
            raise ValueError("Document not found")

        # 2) Llamar a la IA
        payload = self.prov.generate_quiz(
            title=doc.title or "Quiz automático",
            text=doc.content,
            size=size,
            timeout_s=20.0,
        )
        if not payload:
            # El adaptador ya intentó parsear/validar y falló
            raise RuntimeError("Quiz generation failed (no payload)")

        # 3) Normalizar claves por si vienen con espacios o comillas raras
        def _norm_keys(d: Dict[str, Any]) -> Dict[str, Any]:
            out: Dict[str, Any] = {}
            for k, v in d.items():
                if isinstance(k, str):
                    nk = k.strip().strip('"').strip("'")
                else:
                    nk = k
                out[nk] = v
            return out

        payload = _norm_keys(payload)

        # 4) Recuperar lista de preguntas, tolerando claves raras
        questions: Optional[List[Dict[str, Any]]] = None

        # Caso normal
        if isinstance(payload.get("questions"), list):
            questions = payload["questions"]

        # Salvataje: buscar cualquier clave que contenga "questions"
        if questions is None:
            for k, v in payload.items():
                if isinstance(k, str) and "questions" in k and isinstance(v, list):
                    questions = v
                    break

        if not questions:
            raise RuntimeError("Quiz generation returned no questions")

        # 5) Crear el Quiz principal
        title = payload.get("title") or f"Quiz sobre {doc.title}"
        quiz = Quiz(
            user_id=user_id,
            document_id=document_id,
            title=str(title)[:200],
            size=min(max(len(questions), 1), 50),  # por si vienen más/menos
        )
        db.add(quiz)
        db.flush()  # para tener quiz.id

        # 6) Crear preguntas
        created_any = False
        for q in questions[:size]:
            if not isinstance(q, dict):
                continue

            qn = _norm_keys(q)

            question_text = qn.get("question") or qn.get("texto") or ""
            options = qn.get("options") or qn.get("opciones") or []

            if not isinstance(question_text, str):
                continue
            if not isinstance(options, list) or len(options) < 2:
                continue

            # Asegurar exactamente 4 opciones (rellenar/vaciar)
            options = [str(o) for o in options]
            while len(options) < 4:
                options.append("")
            options = options[:4]

            ai_raw = qn.get("answer_index")
            try:
                answer_index = int(ai_raw)
            except Exception:
                answer_index = 0

            if answer_index < 0 or answer_index > 3:
                answer_index = 0

            explanation = qn.get("explanation") or ""
            if not isinstance(explanation, str):
                explanation = ""

            qq = QuizQuestion(
                quiz_id=quiz.id,
                question=question_text[:2000],
                options_json=json.dumps(options, ensure_ascii=False),
                answer_index=answer_index,
                explanation=explanation[:4000] or None,
            )
            db.add(qq)
            created_any = True

        if not created_any:
            # Nada usable, revertimos
            db.rollback()
            raise RuntimeError("Quiz generation produced no valid questions")

        db.commit()
        db.refresh(quiz)
        return quiz

    # ---------- Listar quizzes por documento ----------
    def list_by_document(
        self,
        db: Session,
        user_id: int,
        document_id: int,
    ) -> List[Quiz]:
        return (
            db.query(Quiz)
            .filter(
                Quiz.user_id == user_id,
                Quiz.document_id == document_id,
            )
            .order_by(Quiz.created_at.desc())
            .all()
        )

    # ---------- Obtener quiz (con preguntas lazy/relationship) ----------
    def get(self, db: Session, user_id: int, quiz_id: int) -> Optional[Quiz]:
        return (
            db.query(Quiz)
            .filter(
                Quiz.id == quiz_id,
                Quiz.user_id == user_id,
            )
            .first()
        )

    # ---------- Calcular score ----------
    def compute_score(
        self,
        db: Session,
        user_id: int,
        quiz_id: int,
        answers: List[int],
    ):
        qz = self.get(db, user_id, quiz_id)
        if not qz:
            raise ValueError("Quiz not found")

        qs = list(qz.questions)
        total = len(qs)

        score = 0
        correct_flags: List[bool] = []
        for i, q in enumerate(qs):
            given = answers[i] if i < len(answers) else None
            ok = (given == q.answer_index)
            correct_flags.append(ok)
            if ok:
                score += 1

        return score, total, correct_flags
    
    def check_answers_detailed(
        self,
        db: Session,
        user_id: int,
        quiz_id: int,
        answers: List[int],
    ) -> tuple[int, int, List[Dict[str, Any]]]:
        """
        Versión detallada de corrección:
        - score y total
        - lista de resultados por pregunta con explicación incluida.
        """
        qz = self.get(db, user_id, quiz_id)
        if not qz:
            raise RuntimeError("Quiz not found or not owned by user")

        qs = list(qz.questions)
        total = len(qs)
        score = 0
        results: List[Dict[str, Any]] = []

        for i, q in enumerate(qs):
            given = answers[i] if i < len(answers) else None
            ok = (given == q.answer_index)
            if ok:
                score += 1

            results.append(
                {
                    "question_id": q.id,
                    "given": given,
                    "correct_index": q.answer_index,
                    "is_correct": ok,
                    "explanation": q.explanation,
                }
            )

        return score, total, results
