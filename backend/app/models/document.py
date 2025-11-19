# app/models/document.py
"""
Modelo de Documento - Almacena archivos cargados por usuarios.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, LargeBinary
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db import Base


class Document(Base):
    """Modelo de documento almacenado."""

    __tablename__ = "documents"
    __table_args__ = {"schema": "studyforge"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("studyforge.users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)  # Nombre del archivo o título personalizado
    file_name = Column(String(255), nullable=False)  # Nombre original del archivo
    file_type = Column(String(10), nullable=False)  # pdf, pptx, docx, txt
    file_size_bytes = Column(Integer, nullable=False)  # Tamaño en bytes
    file_content = Column(LargeBinary, nullable=False)  # Contenido del archivo
    extracted_text = Column(String, nullable=True)  # Texto extraído (cache)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relaciones
    user = relationship("User", back_populates="documents")
    # Relación muchos-a-muchos con Summary a través de tabla intermedia
    summaries = relationship("Summary", secondary="studyforge.summary_documents", back_populates="documents")

    def __repr__(self):
        size_mb = self.file_size_bytes / (1024 * 1024)
        return f"<Document {self.title} ({size_mb:.2f}MB)>"
