# app/models/summary.py
"""
Modelo de Resumen.
"""
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from app.db import Base

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
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studyforge.documents.id"), index=True)
    study_space_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studyforge.study_spaces.id"), index=True)

    # Campos propios del resumen
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[dict] = mapped_column(JSONB, nullable=False)  # Contenido estructurado del resumen
    expertise_level: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # 'basico', 'medio', 'avanzado'
    topics: Mapped[dict] = mapped_column(JSONB, nullable=False, default=list)  # Lista de temas identificados
    key_concepts: Mapped[dict] = mapped_column(JSONB, nullable=False, default=list)  # Conceptos clave

    # Denormalización: caché de metadatos del documento (actualizado por triggers + service layer)
    document_title: Mapped[str] = mapped_column(String(255), nullable=False, default="Untitled Document")
    document_file_name: Mapped[str] = mapped_column(String(255), nullable=False, default="unknown.pdf")
    document_state: Mapped[str] = mapped_column(String(20), nullable=False, default="active")  # 'active' | 'removed'

    # Denormalización: caché de metadatos del espacio de estudio (actualizado por triggers + service layer)
    study_space_name: Mapped[str] = mapped_column(String(100), nullable=False, default="Untitled Space")
    study_space_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#8B5CF6")

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relaciones (1-N, sin M-N)
    user: Mapped["User"] = relationship("User", back_populates="summaries")
    document: Mapped["Document"] = relationship("Document", back_populates="summaries")
    study_space: Mapped["StudySpace"] = relationship("StudySpace", back_populates="summaries")
    quizzes: Mapped[list["Quiz"]] = relationship("Quiz", back_populates="summary", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Summary {self.title} - {self.expertise_level}>"
