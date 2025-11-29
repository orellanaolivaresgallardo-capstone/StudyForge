"""
Tests para el router de summaries
"""
import pytest
from uuid import uuid4
from unittest.mock import Mock, patch, AsyncMock
from fastapi import HTTPException

from app.routers.summaries import (
    upload_and_generate_summary,
    generate_summary_from_documents,
    list_summaries,
    get_summary,
    delete_summary,
)
from app.schemas.summary import SummaryFromDocumentsRequest, ExpertiseLevelEnum


class TestUploadAndGenerateSummary:
    """Tests para subir archivo y generar resumen"""

    @pytest.mark.asyncio
    async def test_upload_and_generate_summary_success(self, fake_user, fake_db, fake_summary):
        """Debe generar resumen desde archivo"""
        mock_file = Mock()
        mock_file.filename = "document.pdf"

        with patch('app.services.summary_service.SummaryService.create_summary_from_file', new_callable=AsyncMock) as mock_create:
            mock_create.return_value = fake_summary

            result = await upload_and_generate_summary(
                file=mock_file,
                expertise_level=ExpertiseLevelEnum.BASICO,
                study_space_id=None,
                current_user=fake_user,
                db=fake_db
            )

            assert result == fake_summary
            mock_create.assert_called_once_with(
                db=fake_db,
                user_id=fake_user.id,
                study_space_id=None,
                file=mock_file,
                expertise_level=ExpertiseLevelEnum.BASICO
            )


class TestGenerateSummaryFromDocuments:
    """Tests para generar resumen desde documentos"""

    def test_generate_summary_from_documents_success(self, fake_user, fake_db, fake_summary, fake_document):
        """Debe generar resumen desde documentos existentes"""
        # Note: SummaryFromDocumentsRequest now requires document_id (single) and study_space_id
        from uuid import uuid4
        study_space_id = uuid4()
        request = SummaryFromDocumentsRequest(
            document_id=fake_document.id,
            study_space_id=study_space_id,
            expertise_level=ExpertiseLevelEnum.MEDIO
        )

        with patch('app.services.summary_service.SummaryService.create_summary_from_documents') as mock_create:
            mock_create.return_value = fake_summary

            result = generate_summary_from_documents(request, fake_user, fake_db)

            assert result == fake_summary
            mock_create.assert_called_once_with(
                db=fake_db,
                user=fake_user,
                document_id=fake_document.id,
                study_space_id=study_space_id,
                expertise_level=ExpertiseLevelEnum.MEDIO
            )


class TestListSummaries:
    """Tests para listar resúmenes"""

    def test_list_summaries_success(self, fake_user, fake_db, fake_summary, fake_study_space):
        """Debe listar resúmenes del usuario"""
        from uuid import uuid4

        # Set all denormalized fields (document cache fields only)
        fake_summary.document_id = uuid4()
        fake_summary.source_document_title = "Test Document"  # NEW: Renamed from document_title
        fake_summary.source_document_filename = "test.pdf"  # NEW: Renamed from document_file_name
        fake_summary.document_state = "active_in_space"
        fake_summary.study_space_id = fake_study_space.id
        # NOTE: study_space_name and study_space_color no longer denormalized
        fake_summary.expertise_level = ExpertiseLevelEnum.BASICO

        with patch('app.services.summary_service.SummaryService.get_summaries') as mock_get:
            mock_get.return_value = ([fake_summary], 1)

            result = list_summaries(
                skip=0,
                limit=100,
                current_user=fake_user,
                db=fake_db
            )

            assert result.total == 1
            assert len(result.items) == 1
            assert result.items[0].study_space_id == fake_study_space.id  # NEW: Check FK instead
            mock_get.assert_called_once_with(
                db=fake_db,
                user_id=fake_user.id,
                skip=0,
                limit=100
            )

    def test_list_summaries_empty(self, fake_user, fake_db):
        """Debe retornar lista vacía si no hay resúmenes"""
        with patch('app.services.summary_service.SummaryService.get_summaries') as mock_get:
            mock_get.return_value = ([], 0)

            result = list_summaries(
                current_user=fake_user,
                db=fake_db
            )

            assert result.total == 0
            assert len(result.items) == 0

    def test_list_summaries_pagination(self, fake_user, fake_db):
        """Debe respetar parámetros de paginación"""
        with patch('app.services.summary_service.SummaryService.get_summaries') as mock_get:
            mock_get.return_value = ([], 50)

            list_summaries(
                skip=10,
                limit=20,
                current_user=fake_user,
                db=fake_db
            )

            mock_get.assert_called_once_with(
                db=fake_db,
                user_id=fake_user.id,
                skip=10,
                limit=20
            )


class TestGetSummary:
    """Tests para obtener resumen específico"""

    def test_get_summary_success(self, fake_user, fake_db, fake_summary):
        """Debe obtener resumen con documento"""
        from uuid import uuid4

        # Set all required denormalized fields
        fake_summary.document_id = uuid4()
        fake_summary.source_document_title = "Test Document"  # NEW: Renamed from document_title
        fake_summary.source_document_filename = "test.pdf"  # NEW: Renamed from document_file_name
        fake_summary.document_state = "active_in_space"
        fake_summary.study_space_id = uuid4()
        # NOTE: study_space_name and study_space_color no longer denormalized
        fake_summary.document = None  # Optional relationship
        fake_summary.expertise_level = ExpertiseLevelEnum.MEDIO

        with patch('app.services.summary_service.SummaryService.get_summary') as mock_get:
            mock_get.return_value = fake_summary

            result = get_summary(
                summary_id=fake_summary.id,
                current_user=fake_user,
                db=fake_db
            )

            assert result.id == fake_summary.id
            assert result.title == fake_summary.title
            mock_get.assert_called_once_with(
                db=fake_db,
                summary_id=fake_summary.id,
                user=fake_user
            )

    def test_get_summary_not_found(self, fake_user, fake_db):
        """Debe lanzar excepción si resumen no existe"""
        summary_id = uuid4()

        with patch('app.services.summary_service.SummaryService.get_summary') as mock_get:
            mock_get.side_effect = HTTPException(status_code=404, detail="Not found")

            with pytest.raises(HTTPException) as exc_info:
                get_summary(
                    summary_id=summary_id,
                    current_user=fake_user,
                    db=fake_db
                )

            assert exc_info.value.status_code == 404


class TestDeleteSummary:
    """Tests para eliminar resumen"""

    def test_delete_summary_success(self, fake_user, fake_db, fake_summary):
        """Debe eliminar resumen exitosamente"""
        with patch('app.services.summary_service.SummaryService.delete_summary') as mock_delete:
            mock_delete.return_value = None

            result = delete_summary(
                summary_id=fake_summary.id,
                current_user=fake_user,
                db=fake_db
            )

            assert result is None
            mock_delete.assert_called_once_with(
                db=fake_db,
                summary_id=fake_summary.id,
                user=fake_user
            )

    def test_delete_summary_not_found(self, fake_user, fake_db):
        """Debe lanzar excepción si resumen no existe"""
        summary_id = uuid4()

        with patch('app.services.summary_service.SummaryService.delete_summary') as mock_delete:
            mock_delete.side_effect = HTTPException(status_code=404, detail="Not found")

            with pytest.raises(HTTPException) as exc_info:
                delete_summary(
                    summary_id=summary_id,
                    current_user=fake_user,
                    db=fake_db
                )

            assert exc_info.value.status_code == 404

    def test_delete_summary_not_owner(self, fake_user, fake_db):
        """Debe lanzar excepción si resumen no pertenece al usuario"""
        summary_id = uuid4()

        with patch('app.services.summary_service.SummaryService.delete_summary') as mock_delete:
            mock_delete.side_effect = HTTPException(status_code=403, detail="Forbidden")

            with pytest.raises(HTTPException) as exc_info:
                delete_summary(
                    summary_id=summary_id,
                    current_user=fake_user,
                    db=fake_db
                )

            assert exc_info.value.status_code == 403
