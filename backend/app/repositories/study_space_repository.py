# app/repositories/study_space_repository.py
"""
Repository para operaciones de base de datos relacionadas con espacios de estudio.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.study_space import StudySpace, study_space_summaries, study_space_documents


class StudySpaceRepository:
    """Repository para operaciones CRUD de espacios de estudio."""

    @staticmethod
    def create(
        db: Session,
        user_id: UUID,
        name: str,
        description: Optional[str] = None,
        color: str = "#8B5CF6"
    ) -> StudySpace:
        """Crear un nuevo espacio de estudio."""
        space = StudySpace(
            user_id=user_id,
            name=name,
            description=description,
            color=color
        )
        db.add(space)
        db.commit()
        db.refresh(space)
        return space

    @staticmethod
    def get_by_id(db: Session, space_id: UUID) -> Optional[StudySpace]:
        """Obtener espacio de estudio por ID con relaciones cargadas."""
        from sqlalchemy.orm import joinedload
        return (
            db.query(StudySpace)
            .options(joinedload(StudySpace.summaries), joinedload(StudySpace.documents))
            .filter(StudySpace.id == space_id)
            .first()
        )

    @staticmethod
    def get_by_user(
        db: Session,
        user_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> List[StudySpace]:
        """Obtener todos los espacios de estudio de un usuario."""
        return (
            db.query(StudySpace)
            .filter(StudySpace.user_id == user_id)
            .order_by(StudySpace.updated_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def count_by_user(db: Session, user_id: UUID) -> int:
        """Contar espacios de estudio de un usuario."""
        return db.query(StudySpace).filter(StudySpace.user_id == user_id).count()

    @staticmethod
    def update(
        db: Session,
        space: StudySpace,
        name: Optional[str] = None,
        description: Optional[str] = None,
        color: Optional[str] = None
    ) -> StudySpace:
        """Actualizar un espacio de estudio."""
        if name is not None:
            space.name = name
        if description is not None:
            space.description = description
        if color is not None:
            space.color = color

        db.commit()
        db.refresh(space)
        return space

    @staticmethod
    def delete(db: Session, space: StudySpace) -> None:
        """Eliminar un espacio de estudio."""
        db.delete(space)
        db.commit()

    @staticmethod
    def add_summary(db: Session, space_id: UUID, summary_id: UUID) -> None:
        """Agregar un resumen a un espacio de estudio."""
        stmt = study_space_summaries.insert().values(
            study_space_id=space_id,
            summary_id=summary_id
        )
        db.execute(stmt)
        db.commit()

    @staticmethod
    def remove_summary(db: Session, space_id: UUID, summary_id: UUID) -> None:
        """Remover un resumen de un espacio de estudio."""
        stmt = study_space_summaries.delete().where(
            (study_space_summaries.c.study_space_id == space_id) &
            (study_space_summaries.c.summary_id == summary_id)
        )
        db.execute(stmt)
        db.commit()

    @staticmethod
    def add_document(db: Session, space_id: UUID, document_id: UUID) -> None:
        """Agregar un documento a un espacio de estudio."""
        stmt = study_space_documents.insert().values(
            study_space_id=space_id,
            document_id=document_id
        )
        db.execute(stmt)
        db.commit()

    @staticmethod
    def remove_document(db: Session, space_id: UUID, document_id: UUID) -> None:
        """Remover un documento de un espacio de estudio."""
        stmt = study_space_documents.delete().where(
            (study_space_documents.c.study_space_id == space_id) &
            (study_space_documents.c.document_id == document_id)
        )
        db.execute(stmt)
        db.commit()
