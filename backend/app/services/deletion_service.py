# app/services/deletion_service.py
"""
Servicio para manejar eliminaciones con denormalización de datos.
"""
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from app.models import Document, Summary, Quiz, QuizAttempt
from app.repositories.document_repository import DocumentRepository
from app.repositories.summary_repository import SummaryRepository
from app.repositories.quiz_repository import QuizRepository
from app.repositories.study_space_repository import StudySpaceRepository
from app.repositories.quiz_attempt_repository import QuizAttemptRepository


class DeletionService:
    """Servicio para manejar eliminaciones con preservación de historia."""

    @staticmethod
    def delete_document_with_denormalization(db: Session, document_id: UUID) -> bool:
        """
        Elimina un documento después de actualizar el estado en resúmenes asociados.

        NOTA: Con la nueva estructura, document_id tiene SET NULL en summaries,
        así que los resúmenes se preservan pero pierden la referencia al documento.
        Actualizamos el estado a "permanently_deleted" antes de eliminar.

        Args:
            db: Sesión de base de datos
            document_id: ID del documento a eliminar

        Returns:
            True si se eliminó correctamente, False si no se encontró
        """
        # Obtener el documento
        document = DocumentRepository.get_by_id(db, document_id)
        if not document:
            return False

        # Buscar todos los resúmenes que referencian este documento
        stmt = select(Summary).where(Summary.document_id == document_id)
        summaries = db.execute(stmt).scalars().all()

        # Para cada resumen asociado, marcar el documento como permanentemente eliminado
        for summary in summaries:
            summary.document_state = "permanently_deleted"

        # Commit de los cambios en resúmenes
        db.commit()

        # Ahora sí eliminar el documento (hard delete)
        # SET NULL hará que document_id se setee a None automáticamente
        return DocumentRepository.delete(db, document_id)

    @staticmethod
    def delete_summary(db: Session, summary: Summary) -> None:
        """
        Elimina un resumen (hard delete).
        Los quizzes asociados se preservan automáticamente.

        Args:
            db: Sesión de base de datos
            summary: Resumen a eliminar
        """
        SummaryRepository.delete(db, summary)

    @staticmethod
    def delete_quiz(db: Session, quiz_id: UUID) -> bool:
        """
        Elimina un quiz (hard delete).

        NOTA: Con la nueva estructura, quiz_attempts tienen CASCADE en quiz_id,
        por lo que se eliminarán automáticamente cuando se elimine el quiz.

        Args:
            db: Sesión de base de datos
            quiz_id: ID del quiz a eliminar

        Returns:
            True si se eliminó correctamente
        """
        stmt = select(Quiz).where(Quiz.id == quiz_id)
        quiz = db.execute(stmt).scalar_one_or_none()
        if not quiz:
            return False

        # CASCADE eliminará automáticamente todos los quiz_attempts
        db.delete(quiz)
        db.commit()
        return True

    @staticmethod
    def delete_study_space_with_cascade(
        db: Session,
        space_id: UUID,
        user_id: UUID
    ) -> bool:
        """
        Elimina un espacio de estudio y todos sus datos relacionados.

        IMPORTANTE: Con la nueva estructura CASCADE, esta operación elimina automáticamente:
        - El espacio de estudio
        - Todos los summaries del espacio (CASCADE en study_space_id)
        - Todos los quizzes del espacio (CASCADE en study_space_id)
        - Todos los quiz_attempts de esos quizzes (CASCADE en quiz_id)
        - Todas las relaciones en study_space_documents junction table (CASCADE)

        Args:
            db: Sesión de base de datos
            space_id: ID del espacio a eliminar
            user_id: ID del usuario (para validación)

        Returns:
            True si se eliminó correctamente, False si no se encontró
        """
        # Obtener el espacio
        space = StudySpaceRepository.get_by_id(db, space_id)
        if not space or space.user_id != user_id:
            return False

        # CASCADE eliminará automáticamente summaries, quizzes, quiz_attempts y junction table entries
        StudySpaceRepository.delete(db, space)

        return True
