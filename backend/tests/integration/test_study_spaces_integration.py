"""
Tests de integración E2E para flujo completo de espacios de estudio.
Estos tests verifican que los endpoints existen y responden correctamente.
No usan autenticación real, por lo que esperan 401/403/422 en su mayoría.
"""
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Cliente de test para FastAPI"""
    return TestClient(app)


# TEST 1: Upload de documento con asignación a espacio
def test_upload_document_to_space(client):
    """TEST 1: Verificar endpoint de upload de documento"""
    space_id = str(uuid4())

    # Crear archivo de test
    file_content = b"Test document content for mathematics."

    response = client.post(
        "/documents/",
        files={"file": ("test.txt", file_content, "text/plain")},
        data={"study_space_ids": str(space_id)}
    )

    # Sin autenticación, debe retornar 401/403/422
    assert response.status_code in [401, 403, 422]


# TEST 2: Generación de resumen desde documento
def test_generate_summary_from_document(client):
    """TEST 2: Verificar endpoint de generación de resumen"""
    space_id = str(uuid4())
    doc_id = str(uuid4())

    response = client.post(
        "/summaries/from-documents",
        json={
            "document_id": doc_id,
            "study_space_id": space_id,
            "expertise_level": "medio"
        }
    )

    # Sin autenticación, debe retornar 401/403/422
    assert response.status_code in [401, 403, 422]


# TEST 3: Generación de quiz desde documento
def test_generate_quiz_from_document(client):
    """TEST 3: Verificar endpoint de generación de quiz desde documento"""
    doc_id = str(uuid4())

    response = client.post(
        f"/quizzes/generate-from-document/{doc_id}",
        json={
            "title": "Calculus Quiz",
            "num_questions": 5,
            "difficulty": 3
        }
    )

    # Sin autenticación o documento no encontrado
    assert response.status_code in [401, 403, 404, 422]


# TEST 4: Generación de quiz desde resumen
def test_generate_quiz_from_summary(client):
    """TEST 4: Verificar endpoint de generación de quiz desde resumen"""
    summary_id = str(uuid4())

    response = client.post(
        f"/quizzes/generate-from-summary/{summary_id}",
        json={
            "title": "Calculus Quiz from Summary",
            "num_questions": 10,
            "difficulty": 3
        }
    )

    # Sin autenticación o resumen no encontrado
    assert response.status_code in [401, 403, 404, 422]


# TEST 5: Gráfico de progreso filtrado por espacio
def test_progress_graph_filtered_by_space(client):
    """TEST 5: Verificar endpoint de estadísticas del espacio"""
    space_id = str(uuid4())

    response = client.get(f"/study-spaces/{space_id}/stats")

    # Sin autenticación o espacio no encontrado
    assert response.status_code in [401, 403, 404, 422]


# TEST 6: Verificar creación de espacio
def test_create_study_space(client):
    """TEST 6: Verificar endpoint de creación de espacio"""

    response = client.post(
        "/study-spaces/",
        json={
            "name": "Mathematics",
            "description": "Math study space",
            "color": "#8B5CF6"
        }
    )

    # Sin autenticación, debe retornar 401/403/422
    assert response.status_code in [401, 403, 422]


# TEST EDGE CASE 1: Generar quiz con número de preguntas inválido
def test_generate_quiz_invalid_num_questions(client):
    """EDGE: Intentar generar quiz con más de 30 preguntas (límite)"""
    doc_id = str(uuid4())

    # Request con 50 preguntas (excede el límite de 30)
    response = client.post(
        f"/quizzes/generate-from-document/{doc_id}",
        json={
            "title": "Invalid Quiz",
            "num_questions": 50,
            "difficulty": 3
        }
    )

    # Debe rechazar por auth o validación
    assert response.status_code in [400, 401, 403, 404, 422]


# TEST EDGE CASE 2: Generar resumen sin documentos
def test_generate_summary_no_documents(client):
    """EDGE: Intentar generar resumen sin documentos"""
    space_id = str(uuid4())

    # Request sin document_id (campo requerido)
    response = client.post(
        "/summaries/from-documents",
        json={
            # No incluir document_id
            "study_space_id": space_id,
            "expertise_level": "basico"
        }
    )

    # Debe rechazar por auth o validación (422 por falta de document_id)
    assert response.status_code in [401, 403, 422]


# TEST: Listar espacios sin estadísticas (comportamiento por defecto)
def test_list_study_spaces_without_stats(client):
    """Verificar que endpoint de listado funciona sin include_stats"""
    response = client.get("/study-spaces/")

    # Sin autenticación, debe retornar 401/403
    assert response.status_code in [401, 403]


# TEST: Listar espacios con estadísticas (include_stats=true)
def test_list_study_spaces_with_stats(client):
    """Verificar que endpoint de listado funciona con include_stats=true"""
    response = client.get("/study-spaces/?include_stats=true")

    # Sin autenticación, debe retornar 401/403
    assert response.status_code in [401, 403]


# TEST: Listar espacios con include_stats=false explícito
def test_list_study_spaces_with_stats_false(client):
    """Verificar que endpoint de listado funciona con include_stats=false"""
    response = client.get("/study-spaces/?include_stats=false")

    # Sin autenticación, debe retornar 401/403
    assert response.status_code in [401, 403]
