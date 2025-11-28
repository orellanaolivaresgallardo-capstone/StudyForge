# app/models/document.py
"""
Modelo de Documento - Almacena archivos cargados por usuarios.
"""
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, DateTime, ForeignKey, LargeBinary
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.summary import Summary
    from app.models.study_space import StudySpace


class Document(Base):
    """Modelo de documento almacenado."""

    __tablename__ = "documents"
    __table_args__ = {"schema": "studyforge"}

    # Claves primaria y foráneas
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("studyforge.users.id"), index=True)

    # Campos del documento
    title: Mapped[str] = mapped_column(String(255), nullable=False)  # Nombre del archivo o título personalizado
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)  # Nombre original del archivo
    file_type: Mapped[str] = mapped_column(String(10), nullable=False)  # pdf, pptx, docx, txt
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)  # Tamaño en bytes
    file_content: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)  # Contenido del archivo
    extracted_text = mapped_column(String, nullable=True)  # Texto extraído (cache), Optional

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relaciones
    user: Mapped["User"] = relationship(back_populates="documents")
    # Relación muchos-a-muchos con espacios de estudio
    study_spaces: Mapped[list["StudySpace"]] = relationship(secondary="studyforge.study_space_documents", back_populates="documents")

    def __repr__(self):
        size_mb = self.file_size_bytes / (1024 * 1024)
        return f"<Document {self.title} ({size_mb:.2f}MB)>"
