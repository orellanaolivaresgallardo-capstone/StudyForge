"""
Test E2E completo del sistema StudyForge.
Verifica el flujo completo desde registro hasta visualización de estadísticas.
"""
import pytest
from unittest.mock import patch


class TestCompleteE2EFlow:
    """Test del happy path completo del sistema"""

    def test_complete_user_journey(self, client, sample_text_file):
        """
        Test E2E que simula el recorrido completo de un usuario:

        1. Registro de usuario
        2. Login
        3. Crear espacio de estudio
        4. Subir documento al espacio
        5. Generar resumen desde documento
        6. Crear quiz desde resumen
        7. Tomar quiz (iniciar intento)
        8. Responder preguntas
        9. Completar quiz
        10. Ver estadísticas del espacio
        11. Ver estadísticas globales del usuario
        """

        # 1. REGISTRO DE USUARIO
        user_data = {
            "email": "estudiante@university.edu",
            "username": "estudiante123",
            "password": "MiPassword123!"
        }

        register_response = client.post("/auth/register", json=user_data)
        assert register_response.status_code == 201
        user = register_response.json()
        user_id = user["id"]

        # 2. LOGIN
        login_response = client.post("/auth/login", json={
            "email": user_data["email"],
            "password": user_data["password"]
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}

        # 3. CREAR ESPACIO DE ESTUDIO
        space_response = client.post(
            "/study-spaces/",
            headers=headers,
            json={
                "name": "Cálculo I",
                "description": "Espacio para estudiar cálculo diferencial e integral",
                "color": "#8B5CF6"
            }
        )
        assert space_response.status_code == 201
        space = space_response.json()
        space_id = space["id"]
        assert space["name"] == "Cálculo I"

        # 4. SUBIR DOCUMENTO AL ESPACIO
        filename, content, content_type = sample_text_file

        upload_response = client.post(
            "/documents/",
            headers=headers,
            files={"file": (filename, content, content_type)},
            data={"study_space_ids": str(space_id)}
        )
        assert upload_response.status_code == 201
        document = upload_response.json()
        document_id = document["id"]
        assert document["file_type"] == "txt"
        assert len(document["extracted_text"]) > 0

        # 5. GENERAR RESUMEN DESDE DOCUMENTO
        mock_summary_content = {
            "summary": "Este resumen cubre los conceptos fundamentales del cálculo diferencial e integral.",
            "key_points": [
                "Derivadas miden tasas de cambio instantáneas",
                "Integrales calculan áreas bajo curvas",
                "El teorema fundamental conecta derivadas e integrales"
            ],
            "detailed_sections": [
                {
                    "title": "Cálculo Diferencial",
                    "content": "Las derivadas representan la tasa de cambio instantánea de una función."
                },
                {
                    "title": "Cálculo Integral",
                    "content": "Las integrales permiten calcular áreas, volúmenes y acumulaciones."
                }
            ]
        }

        with patch('app.services.openai_service.OpenAIService.generate_summary') as mock_openai_summary:
            mock_openai_summary.return_value = mock_summary_content

            summary_response = client.post(
                "/summaries/from-documents",
                headers=headers,
                json={
                    "document_id": document_id,
                    "study_space_id": space_id,
                    "expertise_level": "medio"
                }
            )
            assert summary_response.status_code == 201
            summary = summary_response.json()
            summary_id = summary["id"]
            assert summary["expertise_level"] == "medio"

        # 6. CREAR QUIZ DESDE RESUMEN
        mock_quiz_questions = [
            {
                "question": "¿Qué miden las derivadas?",
                "options": {
                    "correct": "Tasas de cambio instantáneas",
                    "semi-correct": "Cambios promedio",
                    "incorrect1": "Áreas bajo curvas",
                    "incorrect2": "Volúmenes"
                },
                "explanation": "Las derivadas representan la tasa de cambio instantánea de una función en un punto."
            },
            {
                "question": "¿Qué permiten calcular las integrales?",
                "options": {
                    "correct": "Áreas bajo curvas",
                    "semi-correct": "Sumas infinitas",
                    "incorrect1": "Pendientes",
                    "incorrect2": "Límites"
                },
                "explanation": "Las integrales calculan el área bajo la curva de una función."
            },
            {
                "question": "¿Qué establece el teorema fundamental del cálculo?",
                "options": {
                    "correct": "La relación entre derivadas e integrales",
                    "semi-correct": "Que toda función es derivable",
                    "incorrect1": "Que las funciones son continuas",
                    "incorrect2": "Que los límites existen"
                },
                "explanation": "El teorema fundamental conecta los conceptos de derivación e integración."
            },
            {
                "question": "¿Cuál es la derivada de x²?",
                "options": {
                    "correct": "2x",
                    "semi-correct": "x",
                    "incorrect1": "x²",
                    "incorrect2": "2"
                },
                "explanation": "Usando la regla de potencias: d/dx(x²) = 2x"
            },
            {
                "question": "¿Qué es un punto crítico?",
                "options": {
                    "correct": "Donde la derivada es cero o no existe",
                    "semi-correct": "Donde la función es cero",
                    "incorrect1": "Donde la función es continua",
                    "incorrect2": "Donde hay un límite"
                },
                "explanation": "Los puntos críticos son donde f'(x) = 0 o f'(x) no existe."
            }
        ]

        with patch('app.services.openai_service.OpenAIService.generate_quiz') as mock_openai_quiz:
            mock_openai_quiz.return_value = mock_quiz_questions

            quiz_response = client.post(
                f"/quizzes/generate-from-summary/{summary_id}",
                headers=headers,
                data={"max_questions": "5"}  # Form data, no JSON
            )
            assert quiz_response.status_code == 201
            quiz = quiz_response.json()
            quiz_id = quiz["id"]
            assert len(quiz["questions"]) == 5
            assert quiz["difficulty_level"] == 2  # Nivel por defecto (sin historial)

        # 7. TOMAR QUIZ (INICIAR INTENTO)
        attempt_response = client.post(
            "/quiz-attempts",  # Endpoint correcto
            headers=headers,
            json={"quiz_id": quiz_id}  # JSON body con quiz_id
        )
        assert attempt_response.status_code == 201
        attempt = attempt_response.json()
        attempt_id = attempt["id"]
        assert attempt["quiz_id"] == quiz_id
        assert attempt["completed_at"] is None

        randomized_questions = attempt["randomized_questions"]
        assert len(randomized_questions) == 5

        # 8. RESPONDER PREGUNTAS (una por una)
        # Para simplificar, respondemos con las primeras opciones disponibles
        for i, question in enumerate(randomized_questions):
            first_option = list(question["options"].keys())[0]
            client.post(
                f"/quiz-attempts/{attempt_id}/answer",
                headers=headers,
                json={"question_index": i, "selected_option": first_option}
            )

        # 9. COMPLETAR QUIZ
        complete_response = client.post(
            f"/quiz-attempts/{attempt_id}/complete",
            headers=headers
        )
        assert complete_response.status_code == 200
        completed_attempt = complete_response.json()
        assert completed_attempt["completed_at"] is not None
        assert "score" in completed_attempt
        final_score = completed_attempt["score"]
        assert 0 <= final_score <= 100

        # 10. VER ESTADÍSTICAS DEL ESPACIO
        space_stats_response = client.get(
            f"/study-spaces/{space_id}/stats",
            headers=headers
        )
        assert space_stats_response.status_code == 200
        space_stats = space_stats_response.json()
        # Los campos del schema son: num_documents, num_summaries, num_quizzes, total_attempts, avg_score
        assert space_stats["num_documents"] == 1
        assert space_stats["num_summaries"] == 1
        assert space_stats["num_quizzes"] == 1
        assert space_stats["total_attempts"] == 1
        assert "avg_score" in space_stats

        # 11. VER ESTADÍSTICAS GLOBALES DEL USUARIO
        global_stats_response = client.get(
            "/stats/summary",  # Endpoint correcto
            headers=headers
        )
        assert global_stats_response.status_code == 200
        global_stats = global_stats_response.json()

        # Campos del endpoint /stats/summary: total_summaries, total_quizzes, total_completed_attempts, avg_score, best_score, unique_spaces_studied
        assert global_stats["total_summaries"] == 1
        assert global_stats["total_quizzes"] == 1
        assert global_stats["total_completed_attempts"] == 1
        assert global_stats["unique_spaces_studied"] == 1
        assert "avg_score" in global_stats
        assert "best_score" in global_stats

        # SUCCESS: Usuario completó todo el flujo exitosamente
        print("\n✅ TEST E2E COMPLETO EXITOSO")
        print(f"   Usuario: {user_data['username']}")
        print(f"   Espacio: {space['name']}")
        print(f"   Documento: {document['title']}")
        print(f"   Resumen: {summary['title']}")
        print(f"   Quiz: {quiz['title']}")
        print(f"   Score final: {final_score}%")

    def test_multiple_spaces_isolation(self, client, sample_text_file):
        """
        Verifica que los datos están correctamente aislados por espacio:
        - Crear 2 espacios
        - Subir documentos a cada espacio
        - Verificar que cada espacio solo muestra sus propios recursos
        """
        # Setup: Registro y login
        user_data = {
            "email": "test@example.com",
            "username": "testuser",
            "password": "Password123!"
        }
        client.post("/auth/register", json=user_data)
        login = client.post("/auth/login", json={
            "email": user_data["email"],
            "password": user_data["password"]
        })
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        # Crear dos espacios
        space1 = client.post(
            "/study-spaces/",
            headers=headers,
            json={"name": "Matemáticas", "description": "Math", "color": "#FF0000"}
        ).json()

        space2 = client.post(
            "/study-spaces/",
            headers=headers,
            json={"name": "Física", "description": "Physics", "color": "#00FF00"}
        ).json()

        # Subir documento a espacio 1
        filename, content, content_type = sample_text_file
        client.post(
            "/documents/",
            headers=headers,
            files={"file": ("math.txt", content, content_type)},
            data={"study_space_ids": str(space1['id'])}
        )

        # Subir documento a espacio 2
        client.post(
            "/documents/",
            headers=headers,
            files={"file": ("physics.txt", content, content_type)},
            data={"study_space_ids": str(space2['id'])}
        )

        # Verificar aislamiento
        space1_detail = client.get(
            f"/study-spaces/{space1['id']}",
            headers=headers
        ).json()

        space2_detail = client.get(
            f"/study-spaces/{space2['id']}",
            headers=headers
        ).json()

        # Cada espacio debe tener solo su propio documento
        assert len(space1_detail["documents"]) == 1
        assert space1_detail["documents"][0]["title"] == "math"

        assert len(space2_detail["documents"]) == 1
        assert space2_detail["documents"][0]["title"] == "physics"
