# app/models/summary_document.py
"""
Tabla de asociación entre Summary y Document (muchos a muchos).
"""
from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from app.db import Base

# Tabla de asociación muchos-a-muchos
summary_documents = Table(
    'summary_documents',
    Base.metadata,
    Column('summary_id', UUID(as_uuid=True), ForeignKey('studyforge.summaries.id'), primary_key=True),
    Column('document_id', UUID(as_uuid=True), ForeignKey('studyforge.documents.id'), primary_key=True),
    schema='studyforge'
)
