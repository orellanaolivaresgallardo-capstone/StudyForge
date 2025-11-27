# app/models/study_space.py
"""
Modelo para espacios de estudio.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db import Base


class StudySpace(Base):
    """Modelo para espacios de estudio donde usuarios organizan recursos."""
    __tablename__ = "study_spaces"
    __table_args__ = {"schema": "studyforge"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("studyforge.users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=True, default="#8B5CF6")  # Hex color para UI
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relaciones
    user = relationship("User", back_populates="study_spaces")
    summaries = relationship("Summary", secondary="studyforge.study_space_summaries", back_populates="study_spaces")
    documents = relationship("Document", secondary="studyforge.study_space_documents", back_populates="study_spaces")
    quizzes = relationship("Quiz", back_populates="study_space")


# Tabla junction: study_space_summaries
study_space_summaries = Table(
    'study_space_summaries',
    Base.metadata,
    Column('study_space_id', UUID(as_uuid=True), ForeignKey('studyforge.study_spaces.id'), primary_key=True),
    Column('summary_id', UUID(as_uuid=True), ForeignKey('studyforge.summaries.id'), primary_key=True),
    schema='studyforge'
)

# Tabla junction: study_space_documents
study_space_documents = Table(
    'study_space_documents',
    Base.metadata,
    Column('study_space_id', UUID(as_uuid=True), ForeignKey('studyforge.study_spaces.id'), primary_key=True),
    Column('document_id', UUID(as_uuid=True), ForeignKey('studyforge.documents.id'), primary_key=True),
    schema='studyforge'
)
