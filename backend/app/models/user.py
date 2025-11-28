# app/models/user.py
"""
Modelo de Usuario.
"""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, Integer, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

if TYPE_CHECKING:
    from app.models.document import Document
    from app.models.summary import Summary
    from app.models.quiz import Quiz
    from app.models.quiz_attempt import QuizAttempt
    from app.models.study_space import StudySpace


class User(Base):
    """Modelo de usuario del sistema."""

    __tablename__ = "users"
    __table_args__ = {"schema": "studyforge"}

    # Clave primaria e identificación
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Configuración de cuotas y límites (configurables por usuario)
    storage_quota_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False, default=5_368_709_120)  # 5 GB en bytes
    storage_used_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)  # Espacio usado actualmente
    max_documents_per_summary: Mapped[int] = mapped_column(Integer, nullable=False, default=2)  # Máx documentos por resumen
    max_file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False, default=52_428_800)  # 50 MB por archivo

    # Relaciones
    documents: Mapped[list["Document"]] = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    summaries: Mapped[list["Summary"]] = relationship("Summary", back_populates="user", cascade="all, delete-orphan")
    quizzes: Mapped[list["Quiz"]] = relationship("Quiz", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts: Mapped[list["QuizAttempt"]] = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    study_spaces: Mapped[list["StudySpace"]] = relationship("StudySpace", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.username} ({self.email})>"

    @property
    def storage_available_bytes(self) -> int:
        """Calcula el espacio de almacenamiento disponible."""
        return max(0, self.storage_quota_bytes - self.storage_used_bytes)

    @property
    def storage_usage_percentage(self) -> float:
        """Calcula el porcentaje de almacenamiento usado."""
        if self.storage_quota_bytes == 0:  # type: ignore[comparison-overlap]
            return 0.0
        return (self.storage_used_bytes / self.storage_quota_bytes) * 100
