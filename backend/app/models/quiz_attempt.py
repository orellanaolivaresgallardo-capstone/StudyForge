# app/models/quiz_attempt.py
"""
Modelo de Intento de Cuestionario.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db import Base


class QuizAttempt(Base):
    """Modelo de intento de cuestionario."""

    __tablename__ = "quiz_attempts"
    __table_args__ = {"schema": "studyforge"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("studyforge.quizzes.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("studyforge.users.id"), nullable=False, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    score = Column(Float, nullable=True)  # Porcentaje 0-100

    # Relaciones
    quiz = relationship("Quiz", back_populates="attempts")
    user = relationship("User", back_populates="quiz_attempts")
    answers = relationship("Answer", back_populates="attempt", cascade="all, delete-orphan")

    def __repr__(self):
        status = "completado" if self.completed_at else "en progreso"
        return f"<QuizAttempt {status} - Score: {self.score}>"
