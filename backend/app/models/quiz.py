# app/models/quiz.py
"""
Modelo de Cuestionario.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db import Base


class Quiz(Base):
    """Modelo de cuestionario con preguntas en formato JSON."""

    __tablename__ = "quizzes"
    __table_args__ = {"schema": "studyforge"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("studyforge.users.id"), nullable=False, index=True)
    summary_id = Column(UUID(as_uuid=True), ForeignKey("studyforge.summaries.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    topic = Column(String(255), nullable=False)  # "general" o tema específico
    difficulty_level = Column(Integer, nullable=False, default=1)  # 1-5
    questions = Column(JSONB, nullable=False)  # Array de preguntas con opciones no aleatorizadas
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relaciones
    user = relationship("User", back_populates="quizzes")
    summary = relationship("Summary", back_populates="quizzes")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Quiz {self.title} - Nivel {self.difficulty_level}>"
