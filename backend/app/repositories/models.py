from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from app.db import Base

class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "studyforge"}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(150), unique=True, index=True)
    password_hash = Column(String(200))
    created_at = Column(DateTime(timezone=True), default=func.now())

    documents = relationship("Document", back_populates="owner")

class Document(Base):
    __tablename__ = "documents"
    __table_args__ = {"schema": "studyforge"}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("studyforge.users.id"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(String(300))
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

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

