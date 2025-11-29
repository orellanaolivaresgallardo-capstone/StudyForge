# app/models/quiz_attempt.py
"""
Modelo de Intento de Cuestionario.
"""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import Float, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base, get_json_type

if TYPE_CHECKING:
    from app.models.quiz import Quiz
    from app.models.user import User


class QuizAttempt(Base):
    """Modelo de intento de cuestionario con respuestas en formato JSON."""

    __tablename__ = "quiz_attempts"
    __table_args__ = {"schema": "studyforge"}

    # Claves primaria y foráneas
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # CHANGED: quiz_id ahora tiene CASCADE para eliminar intentos cuando se elimina el quiz
    quiz_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("studyforge.quizzes.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studyforge.users.id"), index=True)

    # Campos propios del intento
    started_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = mapped_column(DateTime, nullable=True)  # Optional
    score = mapped_column(Float, nullable=True)  # Porcentaje 0-100, Optional

    # Respuestas en formato JSON
    correct_answers: Mapped[dict] = mapped_column(get_json_type(), nullable=False)  # ["A", "B", "C", "D", "A"] - Respuestas correctas aleatorizadas
    user_answers: Mapped[dict] = mapped_column(get_json_type(), nullable=False, default=list)  # ["A", "C", "C", "D", "A"] - Respuestas del usuario

    # Snapshots para preservar información después de eliminaciones
    quiz_snapshot = mapped_column(get_json_type(), nullable=True)  # {"id": "uuid", "title": "...", "difficulty_level": 3}
    study_space_snapshot = mapped_column(get_json_type(), nullable=True)  # {"id": "uuid", "name": "...", "color": "#8B5CF6"}

    # Denormalización: caché de metadatos del quiz (actualizado automáticamente vía triggers + service layer)
    quiz_title: Mapped[str] = mapped_column(String(255), nullable=False, default="Untitled Quiz")  # Cached from quizzes.title
    quiz_state: Mapped[str] = mapped_column(String(20), nullable=False, default="active")  # 'active' | 'deleted'

    # Relaciones
    quiz: Mapped["Quiz"] = relationship(back_populates="attempts")
    user: Mapped["User"] = relationship(back_populates="quiz_attempts")

    def __repr__(self):
        status = "completado" if self.completed_at else "en progreso"  # type: ignore[truthy-bool]
        return f"<QuizAttempt {status} - Score: {self.score}>"
