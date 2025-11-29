# app/services/study_space_service.py
"""
Service para lógica de negocio relacionada con espacios de estudio.
"""
from uuid import UUID
from typing import List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status

from app.repositories.study_space_repository import StudySpaceRepository
from app.repositories.summary_repository import SummaryRepository
from app.repositories.document_repository import DocumentRepository
from app.models.study_space import StudySpace
from app.models.user import User
from app.models.quiz import Quiz
from app.models.quiz_attempt import QuizAttempt


class StudySpaceService:
    """Service para operaciones de espacios de estudio."""

    def create_space(
        self,
        db: Session,
        user_id: UUID,
        name: str,
        description: str = None,
        color: str = "#8B5CF6"
    ) -> StudySpace:
        """Crear nuevo espacio de estudio."""
        return StudySpaceRepository.create(db, user_id, name, description, color)

    def get_spaces(
        self,
        db: Session,
        user_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[StudySpace], int]:
        """Obtener espacios del usuario."""
        spaces = StudySpaceRepository.get_by_user(db, user_id, skip, limit)
        total = StudySpaceRepository.count_by_user(db, user_id)
        return spaces, total

    def get_spaces_with_stats(
        self,
        db: Session,
        user_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Obtiene espacios con estadísticas para página de listado."""
        return StudySpaceRepository.get_by_user_with_stats(db, user_id, skip, limit)

    def get_space(self, db: Session, space_id: UUID, user: User) -> StudySpace:
        """Obtener espacio con verificación de ownership."""
        space = StudySpaceRepository.get_by_id(db, space_id)
        if not space:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Study space not found"
            )
        if space.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        return space

    def update_space(
        self,
        db: Session,
        space_id: UUID,
        user: User,
        name: str = None,
        description: str = None,
        color: str = None
    ) -> StudySpace:
        """Actualizar espacio."""
        space = self.get_space(db, space_id, user)
        return StudySpaceRepository.update(db, space, name, description, color)

    def delete_space(self, db: Session, space_id: UUID, user: User) -> None:
        """Eliminar espacio (documentos y resúmenes NO se eliminan)."""
        space = self.get_space(db, space_id, user)
        StudySpaceRepository.delete(db, space)

    def add_document_to_space(
        self,
        db: Session,
        space_id: UUID,
        document_id: UUID,
        user: User
    ) -> None:
        """Agregar documento a espacio."""
        space = self.get_space(db, space_id, user)
        document = DocumentRepository.get_by_id(db, document_id)
        if not document or document.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        StudySpaceRepository.add_document(db, space_id, document_id)

    def remove_document_from_space(
        self,
        db: Session,
        space_id: UUID,
        document_id: UUID,
        user: User
    ) -> None:
        """Remover documento de espacio."""
        self.get_space(db, space_id, user)  # Verificar ownership
        StudySpaceRepository.remove_document(db, space_id, document_id)

    def add_summary_to_space(
        self,
        db: Session,
        space_id: UUID,
        summary_id: UUID,
        user: User
    ) -> None:
        """Agregar resumen a espacio (actualizar study_space_id)."""
        space = self.get_space(db, space_id, user)
        summary = SummaryRepository.get_by_id(db, summary_id)
        if not summary or summary.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Summary not found"
            )
        # Actualizar el study_space_id del resumen
        summary.study_space_id = space_id
        db.commit()

    def remove_summary_from_space(
        self,
        db: Session,
        space_id: UUID,
        summary_id: UUID,
        user: User
    ) -> None:
        """Remover resumen de espacio (elimina el resumen).

        Nota: Como un resumen debe pertenecer a un espacio (FK NOT NULL),
        'remover' un resumen de un espacio significa eliminarlo.
        """
        self.get_space(db, space_id, user)  # Verificar ownership del espacio
        summary = SummaryRepository.get_by_id(db, summary_id)
        if not summary or summary.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Summary not found"
            )
        if summary.study_space_id != space_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Summary does not belong to this study space"
            )
        # Eliminar el resumen
        SummaryRepository.delete(db, summary)

    def get_space_stats(
        self,
        db: Session,
        space_id: UUID,
        user: User
    ) -> Dict[str, Any]:
        """Obtener estadísticas de progreso para un espacio específico."""
        space = self.get_space(db, space_id, user)

        # Contar recursos
        num_documents = len(space.documents)
        num_summaries = len(space.summaries)

        # Obtener quizzes del espacio
        stmt = select(Quiz).where(Quiz.study_space_id == space_id)
        quizzes_in_space = list(db.execute(stmt).scalars().all())
        quiz_ids = [q.id for q in quizzes_in_space]

        # Obtener attempts completados para quizzes del espacio
        if quiz_ids:
            stmt = select(QuizAttempt).where(
                QuizAttempt.quiz_id.in_(quiz_ids),
                QuizAttempt.user_id == user.id,
                QuizAttempt.completed_at.isnot(None)
            )
            attempts = list(db.execute(stmt).scalars().all())

            total_attempts = len(attempts)
            avg_score = (
                sum(a.score for a in attempts if a.score) / total_attempts
                if total_attempts > 0
                else 0
            )
            best_score = max((a.score for a in attempts if a.score), default=0)
        else:
            total_attempts = 0
            avg_score = 0
            best_score = 0

        return {
            "space_id": str(space.id),
            "space_name": space.name,
            "num_documents": num_documents,
            "num_summaries": num_summaries,
            "num_quizzes": len(quizzes_in_space),
            "total_attempts": total_attempts,
            "avg_score": round(avg_score, 2),
            "best_score": round(best_score, 2),
        }
