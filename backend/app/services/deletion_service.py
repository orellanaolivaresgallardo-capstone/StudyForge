# app/services/deletion_service.py
"""
Servicio para manejar eliminaciones con denormalización de datos.
"""
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_
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
        Elimina un documento después de denormalizar su información en resúmenes asociados.

        Args:
            db: Sesión de base de datos
            document_id: ID del documento a eliminar

        Returns:
            True si se eliminó correctamente, False si no se encontró
        """
        # Obtener el documento con sus resúmenes asociados
        document = DocumentRepository.get_by_id(db, document_id)
        if not document:
            return False

        # Preparar info del documento para denormalización
        doc_info = {
            "id": str(document.id),
            "title": document.title,
            "file_name": document.file_name
        }

        # Para cada resumen asociado, agregar la info del documento eliminado
        for summary in document.summaries:
            # Obtener la lista actual de documentos eliminados (o crear una nueva)
            deleted_docs_info = summary.deleted_documents_info or []

            # Agregar info del documento actual
            deleted_docs_info.append(doc_info)

            # Actualizar el resumen
            summary.deleted_documents_info = deleted_docs_info

        # Commit de los cambios en resúmenes
        db.commit()

        # Ahora sí eliminar el documento (hard delete)
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
        Los quiz_attempts se preservan automáticamente (no hay CASCADE).

        Args:
            db: Sesión de base de datos
            quiz_id: ID del quiz a eliminar

        Returns:
            True si se eliminó correctamente
        """
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            return False

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

        IMPORTANTE: Esta operación elimina:
        - El espacio de estudio
        - Todos los quizzes del espacio (CASCADE)
        - Todos los quiz_attempts de esos quizzes (manual)
        - Todas las relaciones con documentos y summaries (CASCADE en junction tables)

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

        # 1. Obtener todos los quizzes del espacio
        quizzes = QuizRepository.get_quizzes_by_space(
            db, space_id, user_id, skip=0, limit=10000
        )
        quiz_ids = [quiz.id for quiz in quizzes]

        # 2. Eliminar manualmente todos los quiz_attempts asociados a esos quizzes
        if quiz_ids:
            db.query(QuizAttempt).filter(
                QuizAttempt.quiz_id.in_(quiz_ids)
            ).delete(synchronize_session=False)
            db.commit()

        # 3. Ahora eliminar el espacio (CASCADE eliminará quizzes y junction table entries)
        StudySpaceRepository.delete(db, space)

        return True
