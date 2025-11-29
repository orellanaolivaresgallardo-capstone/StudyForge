# app/models/quiz.py
"""
Modelo de Cuestionario.
"""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base, get_json_type

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.summary import Summary
    from app.models.study_space import StudySpace
    from app.models.quiz_attempt import QuizAttempt


class Quiz(Base):
    """Modelo de cuestionario con preguntas en formato JSON."""

    __tablename__ = "quizzes"
    __table_args__ = (
        CheckConstraint(
            "(source_type = 'document' AND source_document_id IS NOT NULL AND source_summary_id IS NULL) OR "
            "(source_type = 'summary' AND source_summary_id IS NOT NULL AND source_document_id IS NULL) OR "
            "(source_type = 'study_space' AND source_document_id IS NULL AND source_summary_id IS NULL)",
            name="single_source_type"
        ),
        {"schema": "studyforge"}
    )

    # Claves primaria y foráneas
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studyforge.users.id"), index=True)

    # CHANGED: study_space_id ahora es NOT NULL (requerido) con CASCADE
    study_space_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("studyforge.study_spaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Campos propios del quiz
    source_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'document' | 'summary' | 'study_space'
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    difficulty_level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)  # 1-5
    questions: Mapped[dict] = mapped_column(get_json_type(), nullable=False)  # Array de preguntas con opciones no aleatorizadas

    # NEW: Source tracking con FKs opcionales (sin Mapped[] para evitar problemas con Optional)
    source_document_id = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("studyforge.documents.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    source_summary_id = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("studyforge.summaries.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # NEW: Denormalized cache (JSONB, opcionales)
    source_names = mapped_column(get_json_type(), nullable=True)  # Cache de nombres de sources
    source_metadata = mapped_column(get_json_type(), nullable=True)  # Cache de metadatos y estados

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relaciones
    user: Mapped["User"] = relationship(back_populates="quizzes")
    study_space: Mapped["StudySpace"] = relationship(back_populates="quizzes")
    summary = relationship("Summary", back_populates="quizzes")  # Optional via source_summary_id
    attempts: Mapped[list["QuizAttempt"]] = relationship(back_populates="quiz", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Quiz {self.title} - Nivel {self.difficulty_level}>"
