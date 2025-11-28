# app/models/quiz.py
"""
Modelo de Cuestionario.
"""
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

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
            """
            (source_type = 'summary' AND summary_id IS NOT NULL AND study_space_id IS NULL) OR
            (source_type = 'document' AND summary_id IS NULL AND study_space_id IS NOT NULL) OR
            (source_type = 'study_space' AND summary_id IS NULL AND study_space_id IS NOT NULL)
            """,
            name="ck_quiz_source_xor"
        ),
        {"schema": "studyforge"}
    )

    # Claves primaria y foráneas
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studyforge.users.id"), index=True)
    summary_id = mapped_column(UUID(as_uuid=True), ForeignKey("studyforge.summaries.id"), nullable=True, index=True)  # Optional FK
    study_space_id = mapped_column(UUID(as_uuid=True), ForeignKey("studyforge.study_spaces.id"), nullable=True, index=True)  # Optional FK

    # Campos propios del quiz
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    difficulty_level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)  # 1-5
    questions: Mapped[dict] = mapped_column(JSONB, nullable=False)  # Array de preguntas con opciones no aleatorizadas
    source_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'summary' | 'document' | 'study_space'

    # Denormalización: caché de metadatos de fuente (actualizado por triggers + service layer)
    source_summary_title = mapped_column(String(255), nullable=True)  # Optional cache
    source_document_titles = mapped_column(JSONB, nullable=True)  # Optional cache
    source_study_space_name = mapped_column(String(100), nullable=True)  # Optional cache
    source_study_space_color = mapped_column(String(7), nullable=True)  # Optional cache

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relaciones
    user: Mapped["User"] = relationship("User", back_populates="quizzes")
    summary = relationship("Summary", back_populates="quizzes")  # Optional relationship
    study_space = relationship("StudySpace", back_populates="quizzes")  # Optional relationship
    attempts: Mapped[list["QuizAttempt"]] = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Quiz {self.title} - Nivel {self.difficulty_level}>"
