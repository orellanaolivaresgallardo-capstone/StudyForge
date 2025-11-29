"""
Tests de integración E2E para flujo de documentos y resúmenes.
Verifica el flujo completo: Crear espacio → Subir documento → Generar resumen
"""
import pytest
from unittest.mock import patch, Mock


class TestDocumentsAndSummariesFlow:
    """Suite de tests para flujo completo de documentos y resúmenes"""

    def test_complete_document_summary_flow(
        self, authenticated_client, sample_text_file
    ):
        """
        Test E2E completo del flujo de documentos y resúmenes:
        1. Crear espacio de estudio
        2. Subir documento al espacio
        3. Verificar extracción de texto
        4. Generar resumen desde documento (mockeando OpenAI)
        5. Verificar resumen en el espacio
        """
        client = authenticated_client

        # 1. Crear espacio de estudio
        space_response = client.post("/study-spaces/", json={
            "name": "Matemáticas",
            "description": "Espacio para estudiar cálculo",
            "color": "#8B5CF6"
        })

        assert space_response.status_code == 201
        space = space_response.json()
        space_id = space["id"]
        assert space["name"] == "Matemáticas"

        # 2. Subir documento al espacio
        filename, file_content, content_type = sample_text_file

        upload_response = client.post(
            f"/documents/?study_space_id={space_id}",
            files={"file": (filename, file_content, content_type)}
        )

        assert upload_response.status_code == 201
        document = upload_response.json()
        document_id = document["id"]
        assert document["title"] == "test_document"
        assert document["file_type"] == "txt"
        assert len(document["extracted_text"]) > 0

        # 3. Verificar que el documento está en el espacio
        space_detail_response = client.get(f"/study-spaces/{space_id}")
        assert space_detail_response.status_code == 200
        space_detail = space_detail_response.json()
        assert len(space_detail["documents"]) == 1
        assert space_detail["documents"][0]["id"] == document_id

        # 4. Generar resumen desde documento (mockeando OpenAI)
        mock_summary_content = {
            "summary": "Resumen sobre matemáticas y cálculo",
            "key_points": ["Derivadas", "Integrales", "Teorema fundamental"],
            "detailed_sections": [
                {
                    "title": "Cálculo Diferencial",
                    "content": "Las derivadas miden tasas de cambio"
                }
            ]
        }

        with patch('app.services.openai_service.OpenAIService.generate_summary') as mock_openai:
            mock_openai.return_value = mock_summary_content

            summary_response = client.post(
                f"/summaries/from-documents?study_space_id={space_id}",
                json={
                    "title": "Resumen de Cálculo",
                    "document_ids": [document_id],
                    "expertise_level": "medio"
                }
            )

            assert summary_response.status_code == 201
            summary = summary_response.json()
            assert summary["title"] == "Resumen de Cálculo"
            assert summary["expertise_level"] == "medio"
            assert summary["study_space_id"] == space_id
            assert "content" in summary
            mock_openai.assert_called_once()

        # 5. Verificar que el resumen aparece en el espacio
        space_detail_response2 = client.get(f"/study-spaces/{space_id}")
        space_detail2 = space_detail_response2.json()
        assert len(space_detail2["summaries"]) == 1
        assert space_detail2["summaries"][0]["title"] == "Resumen de Cálculo"

    def test_create_summary_from_multiple_documents(
        self, authenticated_client, sample_text_file
    ):
        """Debe crear resumen combinando múltiples documentos"""
        client = authenticated_client

        # Crear espacio
        space_response = client.post("/study-spaces/", json={
            "name": "Física",
            "description": "Espacio de física",
            "color": "#10B981"
        })
        space_id = space_response.json()["id"]

        # Subir dos documentos
        filename1, content1, content_type = sample_text_file
        upload1 = client.post(
            f"/documents/?study_space_id={space_id}",
            files={"file": ("doc1.txt", content1, content_type)}
        )
        doc1_id = upload1.json()["id"]

        upload2 = client.post(
            f"/documents/?study_space_id={space_id}",
            files={"file": ("doc2.txt", content1, content_type)}
        )
        doc2_id = upload2.json()["id"]

        # Crear resumen desde ambos documentos
        mock_summary = {
            "summary": "Resumen combinado de ambos documentos",
            "key_points": ["Punto 1", "Punto 2"]
        }

        with patch('app.services.openai_service.OpenAIService.generate_summary') as mock_openai:
            mock_openai.return_value = mock_summary

            summary_response = client.post(
                f"/summaries/from-documents?study_space_id={space_id}",
                json={
                    "title": "Resumen Combinado",
                    "document_ids": [doc1_id, doc2_id],
                    "expertise_level": "avanzado"
                }
            )

            assert summary_response.status_code == 201
            summary = summary_response.json()
            assert summary["expertise_level"] == "avanzado"

            # Verificar que OpenAI recibió texto combinado
            call_args = mock_openai.call_args
            combined_text = call_args[1]["text"]
            # El texto debe incluir contenido de ambos documentos
            assert len(combined_text) > len(content1.decode())

    def test_upload_document_without_space_fails(
        self, authenticated_client, sample_text_file
    ):
        """Debe fallar al subir documento sin especificar espacio"""
        client = authenticated_client
        filename, content, content_type = sample_text_file

        response = client.post(
            "/documents/",  # Sin study_space_id
            files={"file": (filename, content, content_type)}
        )

        # Debe requerir study_space_id
        assert response.status_code == 422

    def test_generate_summary_with_invalid_document_id_fails(
        self, authenticated_client
    ):
        """Debe fallar al generar resumen con ID de documento inválido"""
        client = authenticated_client

        # Crear espacio
        space_response = client.post("/study-spaces/", json={
            "name": "Test Space",
            "description": "Test",
            "color": "#000000"
        })
        space_id = space_response.json()["id"]

        # Intentar crear resumen con UUID inexistente
        fake_uuid = "00000000-0000-0000-0000-000000000000"

        response = client.post(
            f"/summaries/from-documents?study_space_id={space_id}",
            json={
                "title": "Resumen Fake",
                "document_ids": [fake_uuid],
                "expertise_level": "basico"
            }
        )

        assert response.status_code == 404

    def test_generate_summary_with_empty_document_list_fails(
        self, authenticated_client
    ):
        """Debe rechazar lista vacía de documentos"""
        client = authenticated_client

        # Crear espacio
        space_response = client.post("/study-spaces/", json={
            "name": "Test Space",
            "description": "Test",
            "color": "#000000"
        })
        space_id = space_response.json()["id"]

        response = client.post(
            f"/summaries/from-documents?study_space_id={space_id}",
            json={
                "title": "Resumen Vacío",
                "document_ids": [],
                "expertise_level": "basico"
            }
        )

        # Validación de Pydantic debe rechazar lista vacía
        assert response.status_code == 422

    def test_list_documents_shows_only_user_documents(
        self, client, test_user_data, sample_text_file
    ):
        """Los documentos deben estar aislados por usuario"""
        # Crear y autenticar primer usuario
        client.post("/auth/register", json=test_user_data)
        login1 = client.post("/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })
        token1 = login1.json()["access_token"]

        # Crear espacio y subir documento como usuario 1
        space1 = client.post(
            "/study-spaces/",
            headers={"Authorization": f"Bearer {token1}"},
            json={"name": "Space User 1", "description": "Test", "color": "#FF0000"}
        )
        space1_id = space1.json()["id"]

        filename, content, content_type = sample_text_file
        client.post(
            f"/documents/?study_space_id={space1_id}",
            headers={"Authorization": f"Bearer {token1}"},
            files={"file": (filename, content, content_type)}
        )

        # Crear segundo usuario
        user2_data = {
            "email": "user2@example.com",
            "username": "user2",
            "password": "Password123!"
        }
        client.post("/auth/register", json=user2_data)
        login2 = client.post("/auth/login", json={
            "email": user2_data["email"],
            "password": user2_data["password"]
        })
        token2 = login2.json()["access_token"]

        # Usuario 2 no debe ver documentos de usuario 1
        docs_response = client.get(
            "/documents/",
            headers={"Authorization": f"Bearer {token2}"}
        )

        assert docs_response.status_code == 200
        docs = docs_response.json()
        assert docs["total"] == 0
        assert len(docs["items"]) == 0
