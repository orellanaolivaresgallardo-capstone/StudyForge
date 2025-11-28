# app/models/study_space.py
"""
Modelo para espacios de estudio.
"""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, DateTime, ForeignKey, Table, Column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.summary import Summary
    from app.models.document import Document
    from app.models.quiz import Quiz


class StudySpace(Base):
    """Modelo para espacios de estudio donde usuarios organizan recursos."""
    __tablename__ = "study_spaces"
    __table_args__ = {"schema": "studyforge"}

    # Claves primaria y foráneas
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studyforge.users.id"), nullable=False, index=True)

    # Campos del espacio de estudio
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)  # Optional text field
    color: Mapped[str] = mapped_column(String(7), nullable=True, default="#8B5CF6")  # Optional hex color para UI

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relaciones
    user: Mapped["User"] = relationship(back_populates="study_spaces")
    # Relación 1-N con Summary (un espacio tiene muchos resúmenes)
    summaries: Mapped[list["Summary"]] = relationship(back_populates="study_space")
    # Relación muchos-a-muchos con documentos
    documents: Mapped[list["Document"]] = relationship(secondary="studyforge.study_space_documents", back_populates="study_spaces")
    # Relación 1-N con quizzes
    quizzes: Mapped[list["Quiz"]] = relationship(back_populates="study_space")

    def __repr__(self):
        return f"<StudySpace {self.name}>"


# Tabla junction: study_space_documents
study_space_documents = Table(
    'study_space_documents',
    Base.metadata,
    Column('study_space_id', UUID(as_uuid=True), ForeignKey('studyforge.study_spaces.id'), primary_key=True),
    Column('document_id', UUID(as_uuid=True), ForeignKey('studyforge.documents.id'), primary_key=True),
    schema='studyforge'
)
