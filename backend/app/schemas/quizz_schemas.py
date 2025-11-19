# app/schemas/quizz_schemas.py
from typing import List, Optional
from pydantic import BaseModel

class QuizAnswersIn(BaseModel):
    """Respuestas del usuario, index 0..3 por pregunta en el orden que las envíes."""
    answers: List[int]

class QuestionResult(BaseModel):
    question_id: int
    given: Optional[int]           # índice que marcó el usuario (0..3) o None
    correct_index: int             # índice correcto (0..3)
    is_correct: bool
    explanation: Optional[str]     # por qué la correcta lo es / las otras no

class QuizCheckOut(BaseModel):
    score: int
    total: int
    results: List[QuestionResult]
