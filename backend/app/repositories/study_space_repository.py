# app/repositories/study_space_repository.py
"""
Repository para operaciones de base de datos relacionadas con espacios de estudio.
"""
from typing import List, Optional, Tuple, Dict, Any
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.study_space import StudySpace, study_space_documents


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
        stmt = (
            select(StudySpace)
            .options(joinedload(StudySpace.summaries), joinedload(StudySpace.documents))
            .where(StudySpace.id == space_id)
        )
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def get_by_user(
        db: Session,
        user_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> List[StudySpace]:
        """Obtener todos los espacios de estudio de un usuario."""
        stmt = (
            select(StudySpace)
            .where(StudySpace.user_id == user_id)
            .order_by(StudySpace.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(db.execute(stmt).scalars().all())

    @staticmethod
    def count_by_user(db: Session, user_id: UUID) -> int:
        """Contar espacios de estudio de un usuario."""
        stmt = select(func.count()).select_from(StudySpace).where(StudySpace.user_id == user_id)
        return db.execute(stmt).scalar() or 0

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

    @staticmethod
    def get_by_user_with_stats(
        db: Session,
        user_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Obtiene espacios con estadísticas agregadas.

        Returns:
            Tupla de (lista_espacios_con_stats, total_count)
            Cada dict contiene: {
                'space': StudySpace object,
                'num_documents': int,
                'num_summaries': int,
                'num_quizzes': int,
                'avg_score': float
            }
        """
        from sqlalchemy.orm import joinedload
        from app.repositories.quiz_attempt_repository import QuizAttemptRepository
        from app.models import Quiz

        # 1. Contar total (sin paginación)
        count_stmt = select(func.count()).select_from(StudySpace).where(StudySpace.user_id == user_id)
        total = db.execute(count_stmt).scalar() or 0

        # 2. Obtener espacios con paginación y relaciones cargadas
        spaces_stmt = (
            select(StudySpace)
            .options(
                joinedload(StudySpace.documents),
                joinedload(StudySpace.summaries)
            )
            .where(StudySpace.user_id == user_id)
            .order_by(StudySpace.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        spaces = list(db.execute(spaces_stmt).scalars().all())

        # 3. Para cada espacio, calcular stats
        result = []
        for space in spaces:
            # Contar quizzes del espacio
            quiz_count_stmt = select(func.count()).select_from(Quiz).where(Quiz.study_space_id == space.id)
            num_quizzes = db.execute(quiz_count_stmt).scalar() or 0

            # Calcular promedio usando mismo método que adaptive difficulty
            recent_attempts = QuizAttemptRepository.get_recent_attempts_by_space(
                db, user_id, space.id, limit=5
            )
            scores = [a.score for a in recent_attempts if a.score is not None]
            avg_score = round(sum(scores) / len(scores), 2) if scores else 0.0

            result.append({
                'space': space,
                'num_documents': len(space.documents),
                'num_summaries': len(space.summaries),
                'num_quizzes': num_quizzes,
                'avg_score': avg_score
            })

        return result, total
