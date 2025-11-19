# app/models/answer.py
"""
Modelo de Respuesta del Usuario.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db import Base
from app.models.question import OptionEnum


class Answer(Base):
    """Modelo de respuesta del usuario a una pregunta."""

    __tablename__ = "answers"
    __table_args__ = {"schema": "studyforge"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attempt_id = Column(UUID(as_uuid=True), ForeignKey("studyforge.quiz_attempts.id"), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("studyforge.questions.id"), nullable=False, index=True)
    selected_option = Column(Enum(OptionEnum), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    answered_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relaciones
    attempt = relationship("QuizAttempt", back_populates="answers")
    question = relationship("Question", back_populates="answers")

    def __repr__(self):
        status = "correcta" if self.is_correct else "incorrecta"
        return f"<Answer {self.selected_option.value} - {status}>"
