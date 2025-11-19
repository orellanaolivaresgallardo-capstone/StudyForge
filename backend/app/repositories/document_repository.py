# app/repositories/document_repository.py
"""
Repositorio para manejo de documentos.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models import Document


class DocumentRepository:
    """Repositorio para operaciones CRUD de documentos."""

    @staticmethod
    def create(
        db: Session,
        user_id: UUID,
        title: str,
        file_name: str,
        file_type: str,
        file_size_bytes: int,
        file_content: bytes,
        extracted_text: Optional[str] = None
    ) -> Document:
        """
        Crea un nuevo documento.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario propietario
            title: Título del documento
            file_name: Nombre original del archivo
            file_type: Tipo de archivo (pdf, docx, etc.)
            file_size_bytes: Tamaño del archivo en bytes
            file_content: Contenido binario del archivo
            extracted_text: Texto extraído (opcional)

        Returns:
            Documento creado
        """
        document = Document(
            user_id=user_id,
            title=title,
            file_name=file_name,
            file_type=file_type,
            file_size_bytes=file_size_bytes,
            file_content=file_content,
            extracted_text=extracted_text
        )
        db.add(document)
        db.commit()
        db.refresh(document)
        return document

    @staticmethod
    def get_by_id(db: Session, document_id: UUID) -> Optional[Document]:
        """Obtiene un documento por su ID."""
        return db.query(Document).filter(Document.id == document_id).first()

    @staticmethod
    def get_by_user(
        db: Session,
        user_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> List[Document]:
        """
        Obtiene documentos de un usuario con paginación.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario
            skip: Número de documentos a saltar
            limit: Máximo número de documentos a retornar

        Returns:
            Lista de documentos
        """
        return db.query(Document)\
            .filter(Document.user_id == user_id)\
            .order_by(Document.created_at.desc())\
            .offset(skip)\
            .limit(limit)\
            .all()

    @staticmethod
    def count_by_user(db: Session, user_id: UUID) -> int:
        """Cuenta el número total de documentos de un usuario."""
        return db.query(Document).filter(Document.user_id == user_id).count()

    @staticmethod
    def delete(db: Session, document_id: UUID) -> bool:
        """
        Elimina un documento.

        Args:
            db: Sesión de base de datos
            document_id: ID del documento a eliminar

        Returns:
            True si se eliminó, False si no se encontró
        """
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            db.delete(document)
            db.commit()
            return True
        return False

    @staticmethod
    def update_title(db: Session, document_id: UUID, new_title: str) -> Optional[Document]:
        """
        Actualiza el título de un documento.

        Args:
            db: Sesión de base de datos
            document_id: ID del documento
            new_title: Nuevo título

        Returns:
            Documento actualizado o None si no se encontró
        """
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.title = new_title
            db.commit()
            db.refresh(document)
            return document
        return None

    @staticmethod
    def calculate_total_size_by_user(db: Session, user_id: UUID) -> int:
        """
        Calcula el tamaño total de almacenamiento usado por un usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario

        Returns:
            Tamaño total en bytes
        """
        from sqlalchemy import func
        result = db.query(func.sum(Document.file_size_bytes))\
            .filter(Document.user_id == user_id)\
            .scalar()
        return result or 0
