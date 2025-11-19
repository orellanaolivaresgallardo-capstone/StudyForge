# app/models/summary.py
"""
Modelo de Resumen.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum
from app.db import Base


class ExpertiseLevel(str, enum.Enum):
    """Niveles de expertise para resúmenes."""
    BASICO = "basico"
    MEDIO = "medio"
    AVANZADO = "avanzado"


class Summary(Base):
    """Modelo de resumen generado a partir de uno o más documentos."""

    __tablename__ = "summaries"
    __table_args__ = {"schema": "studyforge"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("studyforge.users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(JSONB, nullable=False)  # Contenido estructurado del resumen
    expertise_level = Column(Enum(ExpertiseLevel), nullable=False, index=True)
    topics = Column(JSONB, nullable=False, default=list)  # Lista de temas identificados
    key_concepts = Column(JSONB, nullable=False, default=list)  # Conceptos clave
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relaciones
    user = relationship("User", back_populates="summaries")
    quizzes = relationship("Quiz", back_populates="summary")
    # Relación muchos-a-muchos con documentos (1-N documentos por resumen)
    documents = relationship("Document", secondary="studyforge.summary_documents", back_populates="summaries")

    def __repr__(self):
        return f"<Summary {self.title} - {self.expertise_level.value}>"
