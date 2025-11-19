# app/models/user.py
"""
Modelo de Usuario.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db import Base


class User(Base):
    """Modelo de usuario del sistema."""

    __tablename__ = "users"
    __table_args__ = {"schema": "studyforge"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Configuración de cuotas y límites (configurables por usuario)
    storage_quota_bytes = Column(BigInteger, nullable=False, default=5_368_709_120)  # 5 GB en bytes
    storage_used_bytes = Column(BigInteger, nullable=False, default=0)  # Espacio usado actualmente
    max_documents_per_summary = Column(Integer, nullable=False, default=2)  # Máx documentos por resumen
    max_file_size_bytes = Column(BigInteger, nullable=False, default=52_428_800)  # 50 MB por archivo

    # Relaciones
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="user", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.username} ({self.email})>"

    @property
    def storage_available_bytes(self) -> int:
        """Calcula el espacio de almacenamiento disponible."""
        return max(0, self.storage_quota_bytes - self.storage_used_bytes)

    @property
    def storage_usage_percentage(self) -> float:
        """Calcula el porcentaje de almacenamiento usado."""
        if self.storage_quota_bytes == 0:
            return 0.0
        return (self.storage_used_bytes / self.storage_quota_bytes) * 100
