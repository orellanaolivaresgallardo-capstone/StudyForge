# app/models/question.py
"""
Modelo de Pregunta de Cuestionario.
"""
import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.db import Base


class OptionEnum(str, enum.Enum):
    """Opciones de respuesta."""
    A = "A"
    B = "B"
    C = "C"
    D = "D"


class Question(Base):
    """Modelo de pregunta de cuestionario."""

    __tablename__ = "questions"
    __table_args__ = {"schema": "studyforge"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("studyforge.quizzes.id"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    option_a = Column(String(500), nullable=False)
    option_b = Column(String(500), nullable=False)
    option_c = Column(String(500), nullable=False)
    option_d = Column(String(500), nullable=False)
    correct_option = Column(Enum(OptionEnum), nullable=False)
    explanation = Column(Text, nullable=False)  # Explicación detallada
    order = Column(Integer, nullable=False)  # Orden de la pregunta en el cuestionario

    # Relaciones
    quiz = relationship("Quiz", back_populates="questions")
    answers = relationship("Answer", back_populates="question")

    def __repr__(self):
        return f"<Question {self.order}: {self.question_text[:50]}...>"
