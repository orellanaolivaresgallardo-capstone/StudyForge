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
        return db.execute(stmt).unique().scalar_one_or_none()

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
        from sqlalchemy import case, desc
        from app.models import Quiz, QuizAttempt

        # 1. Contar total (sin paginación)
        count_stmt = select(func.count()).select_from(StudySpace).where(StudySpace.user_id == user_id)
        total = db.execute(count_stmt).scalar() or 0

        # 2. Obtener espacios con paginación y relaciones cargadas
        # IMPORTANT: Solo cargamos metadatos, NO el contenido pesado (file_content, extracted_text, content)
        from sqlalchemy.orm import load_only
        from app.models import Document, Summary

        spaces_stmt = (
            select(StudySpace)
            .options(
                # Documentos: solo metadatos (excluimos file_content y extracted_text)
                joinedload(StudySpace.documents).load_only(
                    Document.id,
                    Document.user_id,
                    Document.title,
                    Document.file_name,
                    Document.file_type,
                    Document.file_size_bytes,
                    Document.created_at,
                    Document.updated_at
                ),
                # Resúmenes: solo metadatos (excluimos content, topics, key_concepts)
                joinedload(StudySpace.summaries).load_only(
                    Summary.id,
                    Summary.user_id,
                    Summary.study_space_id,
                    Summary.title,
                    Summary.expertise_level,
                    Summary.created_at,
                    Summary.updated_at
                )
            )
            .where(StudySpace.user_id == user_id)
            .order_by(StudySpace.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        # NOTE: .unique() is required when using joinedload() with collections
        spaces = list(db.execute(spaces_stmt).unique().scalars().all())

        if not spaces:
            return [], total

        # 3. Obtener IDs de los espacios paginados
        space_ids = [space.id for space in spaces]

        # 4. Query optimizada: Obtener TODAS las stats de TODOS los espacios en UNA SOLA QUERY
        # Subconsulta para los últimos 5 intentos por espacio
        recent_attempts_subq = (
            select(
                Quiz.study_space_id,
                QuizAttempt.score,
                func.row_number().over(
                    partition_by=Quiz.study_space_id,
                    order_by=desc(QuizAttempt.completed_at)
                ).label('rn')
            )
            .select_from(QuizAttempt)
            .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
            .where(
                QuizAttempt.user_id == user_id,
                Quiz.study_space_id.in_(space_ids),
                QuizAttempt.completed_at.isnot(None)
            )
        ).subquery()

        # Query principal con agregaciones
        stats_stmt = (
            select(
                Quiz.study_space_id,
                func.count(func.distinct(Quiz.id)).label('num_quizzes'),
                func.avg(
                    case(
                        (recent_attempts_subq.c.rn <= 5, recent_attempts_subq.c.score),
                        else_=None
                    )
                ).label('avg_score')
            )
            .select_from(Quiz)
            .outerjoin(
                recent_attempts_subq,
                Quiz.study_space_id == recent_attempts_subq.c.study_space_id
            )
            .where(Quiz.study_space_id.in_(space_ids))
            .group_by(Quiz.study_space_id)
        )

        stats_result = db.execute(stats_stmt).all()

        # 5. Crear lookup dict para stats por space_id
        stats_by_space = {
            row.study_space_id: {
                'num_quizzes': row.num_quizzes or 0,
                'avg_score': round(row.avg_score, 2) if row.avg_score else 0.0
            }
            for row in stats_result
        }

        # 6. Combinar espacios con stats
        result = []
        for space in spaces:
            stats = stats_by_space.get(space.id, {'num_quizzes': 0, 'avg_score': 0.0})

            result.append({
                'space': space,
                'num_documents': len(space.documents),
                'num_summaries': len(space.summaries),
                'num_quizzes': stats['num_quizzes'],
                'avg_score': stats['avg_score']
            })

        return result, total
