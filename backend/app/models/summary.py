# app/models/summary.py
"""
Modelo de Resumen.
"""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Optional
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from app.db import Base, get_json_type

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.document import Document
    from app.models.study_space import StudySpace
    from app.models.quiz import Quiz


class ExpertiseLevel(str, enum.Enum):
    """Niveles de expertise para resúmenes."""
    BASICO = "basico"
    MEDIO = "medio"
    AVANZADO = "avanzado"


class Summary(Base):
    """Modelo de resumen generado a partir de un documento en un espacio de estudio."""

    __tablename__ = "summaries"
    __table_args__ = {"schema": "studyforge"}

    # Claves primaria y foráneas
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studyforge.users.id"), index=True)

    # NEW: document_id ahora es opcional (nullable) con SET NULL en caso de borrado
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("studyforge.documents.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # NEW: study_space_id ahora es NOT NULL con CASCADE en caso de borrado del espacio
    study_space_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("studyforge.study_spaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Campos propios del resumen
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[dict] = mapped_column(get_json_type(), nullable=False)  # Contenido estructurado del resumen
    expertise_level: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # 'basico', 'medio', 'avanzado'
    topics: Mapped[dict] = mapped_column(get_json_type(), nullable=False, default=dict)  # Lista de temas identificados
    key_concepts: Mapped[dict] = mapped_column(get_json_type(), nullable=False, default=dict)  # Conceptos clave

    # NEW: Denormalized cache fields - nombres actualizados y tipos ajustados
    source_document_title = mapped_column(String(255), nullable=True)  # Optional cache
    source_document_filename = mapped_column(String(255), nullable=True)  # Optional cache
    document_state: Mapped[str] = mapped_column(String(50), nullable=False, default="active_in_space")  # 'active_in_space' | 'removed_from_space' | 'permanently_deleted'

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relaciones
    user: Mapped["User"] = relationship(back_populates="summaries")
    document: Mapped["Document"] = relationship()  # No back_populates - nullable via FK definition
    study_space: Mapped["StudySpace"] = relationship(back_populates="summaries")
    quizzes: Mapped[list["Quiz"]] = relationship(back_populates="summary")  # No cascade - FK maneja SET NULL automáticamente

    def __repr__(self):
        return f"<Summary {self.title} - {self.expertise_level}>"
