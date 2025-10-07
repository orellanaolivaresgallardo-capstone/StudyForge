from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db import Base

SCHEMA = "studyforge"

class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": SCHEMA}

    id = Column(Integer, primary_key=True)
    # Nota: la unicidad efectiva se hace con el índice único en BD por lower(email)
    email = Column(String(255), nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    name = Column(String(100), nullable=True)

    created_at = Column(DateTime(timezone=True),
                        server_default=func.now(),
                        nullable=False)

    documents = relationship(
        "Document",
        back_populates="owner",
        cascade="all, delete-orphan"
    )

class Document(Base):
    __tablename__ = "documents"
    __table_args__ = {"schema": SCHEMA}

    id = Column(Integer, primary_key=True)
    # NOT NULL y FK al schema correcto; index para filtrar por usuario
    user_id = Column(
        Integer,
        ForeignKey(f"{SCHEMA}.users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(String(200), nullable=False)
    description = Column(String(300), nullable=True)
    content = Column(Text, nullable=False)

    # timestamps manejados por la BD (server_default) y actualización
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # relaciones
    owner = relationship("User", back_populates="documents")
    summaries = relationship("Summary", back_populates="document")
    quizzes = relationship("Quiz", back_populates="document")

class Summary(Base):
    __tablename__ = "summaries"
    __table_args__ = {"schema": "studyforge"}

    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("studyforge.documents.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now())

    document = relationship("Document", back_populates="summaries")

class Quiz(Base):
    __tablename__ = "quizzes"
    __table_args__ = {"schema": "studyforge"}

    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("studyforge.documents.id"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    options = Column(JSON)        # respuestas alternativas
    difficulty = Column(String(20))
    created_at = Column(DateTime(timezone=True), default=func.now())

    document = relationship("Document", back_populates="quizzes")

