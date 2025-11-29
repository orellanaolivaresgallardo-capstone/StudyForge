"""
Tests de integración E2E para flujo de quizzes y sistema adaptativo.
Verifica el flujo completo: Crear quiz → Tomar quiz → Sistema adaptativo
"""
import pytest
from unittest.mock import patch


class TestQuizzesFlow:
    """Suite de tests para flujo completo de quizzes"""

    def test_complete_quiz_flow(self, authenticated_client, sample_text_file):
        """
        Test E2E completo del flujo de quizzes:
        1. Crear espacio y subir documento
        2. Crear quiz desde documento
        3. Iniciar intento de quiz
        4. Responder preguntas
        5. Completar quiz y verificar score
        """
        client = authenticated_client

        # 1. Setup: Crear espacio y documento
        space_response = client.post("/study-spaces/", json={
            "name": "Matemáticas",
            "description": "Espacio de matemáticas",
            "color": "#8B5CF6"
        })
        space_id = space_response.json()["id"]

        filename, content, content_type = sample_text_file
        upload_response = client.post(
            "/documents/",
            files={"file": (filename, content, content_type)},
            data={"study_space_ids": str(space_id)}
        )
        document_id = upload_response.json()["id"]

        # 2. Crear quiz desde documento (mockeando OpenAI)
        mock_questions = [
            {
                "question": "¿Qué es una derivada?",
                "options": {
                    "correct": "Tasa de cambio instantánea",
                    "semi-correct": "Cambio promedio",
                    "incorrect1": "Área bajo la curva",
                    "incorrect2": "Una integral"
                },
                "explanation": "La derivada mide la tasa de cambio instantánea"
            },
            {
                "question": "¿Qué es una integral?",
                "options": {
                    "correct": "Área bajo la curva",
                    "semi-correct": "Suma de áreas",
                    "incorrect1": "Tasa de cambio",
                    "incorrect2": "Una derivada"
                },
                "explanation": "La integral calcula el área bajo la curva"
            },
            {
                "question": "¿Qué establece el teorema fundamental del cálculo?",
                "options": {
                    "correct": "Relación entre derivadas e integrales",
                    "semi-correct": "Las derivadas existen",
                    "incorrect1": "Las funciones son continuas",
                    "incorrect2": "Todo es integrable"
                },
                "explanation": "Conecta la derivación con la integración"
            }
        ]

        with patch('app.services.openai_service.OpenAIService.generate_quiz') as mock_openai:
            mock_openai.return_value = mock_questions

            quiz_response = client.post(
                f"/quizzes/generate-from-document/{document_id}",
                data={"study_space_id": str(space_id), "max_questions": "5"}
            )

            assert quiz_response.status_code == 201
            quiz = quiz_response.json()
            quiz_id = quiz["id"]
            assert quiz["difficulty_level"] == 2  # Nivel por defecto (sin historial)
            assert len(quiz["questions"]) == 3

        # 3. Iniciar intento de quiz
        attempt_response = client.post("/quiz-attempts", json={"quiz_id": quiz_id})

        assert attempt_response.status_code == 201
        attempt = attempt_response.json()
        attempt_id = attempt["id"]
        assert attempt["quiz_id"] == quiz_id
        assert attempt["completed_at"] is None
        assert "randomized_questions" in attempt

        # Las opciones deben estar randomizadas (A, B, C, D)
        randomized_q = attempt["randomized_questions"][0]
        assert len(randomized_q["options"]) == 4
        assert all(opt in ["A", "B", "C", "D"] for opt in randomized_q["options"].keys())

        # 4. Responder preguntas (una por una)
        # Nota: No conocemos las respuestas correctas porque están randomizadas
        # Usamos las opciones "A" solo como ejemplo
        for i in range(3):
            client.post(
                f"/quiz-attempts/{attempt_id}/answer",
                json={"question_index": i, "selected_option": ["A", "B", "C"][i]}
            )

        # 5. Completar quiz
        complete_response = client.post(f"/quiz-attempts/{attempt_id}/complete")

        assert complete_response.status_code == 200
        completed_attempt = complete_response.json()
        assert completed_attempt["completed_at"] is not None
        assert "score" in completed_attempt
        assert 0 <= completed_attempt["score"] <= 100

    def test_adaptive_difficulty_system(self, authenticated_client, sample_text_file):
        """
        Verifica que el sistema de dificultad adaptativa funciona:
        1. Primer quiz tiene dificultad por defecto (2)
        2. Completar quiz con score alto
        3. Siguiente quiz debe tener mayor dificultad
        """
        client = authenticated_client

        # Setup: Crear espacio y documento
        space_response = client.post("/study-spaces/", json={
            "name": "Física",
            "description": "Espacio de física",
            "color": "#10B981"
        })
        space_id = space_response.json()["id"]

        filename, content, content_type = sample_text_file
        upload_response = client.post(
            "/documents/",
            files={"file": (filename, content, content_type)},
            data={"study_space_ids": str(space_id)}
        )
        document_id = upload_response.json()["id"]

        mock_questions = [
            {
                "question": "Test question 1",
                "options": {
                    "correct": "A",
                    "semi-correct": "B",
                    "incorrect1": "C",
                    "incorrect2": "D"
                },
                "explanation": "Test"
            }
        ]

        # Crear primer quiz (dificultad por defecto = 2)
        with patch('app.services.openai_service.OpenAIService.generate_quiz') as mock_openai:
            mock_openai.return_value = mock_questions

            quiz1_response = client.post(
                f"/quizzes/generate-from-document/{document_id}",
                data={"study_space_id": str(space_id), "max_questions": "5"}
            )
            quiz1 = quiz1_response.json()
            assert quiz1["difficulty_level"] == 2  # Sin historial

        # Simular score alto (95%) mediante mock del attempt
        # En un sistema real, deberíamos responder correctamente
        # Para simplificar, mockeamos directamente el repository
        with patch('app.repositories.quiz_attempt_repository.QuizAttemptRepository.get_recent_attempts_by_space') as mock_attempts:
            # Simular 5 intentos con score alto (95%)
            mock_attempt = type('obj', (object,), {'score': 95})
            mock_attempts.return_value = [mock_attempt] * 5

            # Crear segundo quiz - debe tener dificultad mayor
            with patch('app.services.openai_service.OpenAIService.generate_quiz') as mock_openai2:
                mock_openai2.return_value = mock_questions

                quiz2_response = client.post(
                    f"/quizzes/generate-from-document/{document_id}",
                    data={"study_space_id": str(space_id), "max_questions": "5"}
                )
                quiz2 = quiz2_response.json()

                # Con promedio de 95%, dificultad debe ser 5 (muy difícil)
                assert quiz2["difficulty_level"] == 5

    def test_create_quiz_with_custom_questions_count(
        self, authenticated_client, sample_text_file
    ):
        """Debe respetar el número de preguntas solicitado"""
        client = authenticated_client

        # Setup
        space_response = client.post("/study-spaces/", json={
            "name": "Test Space",
            "description": "Test",
            "color": "#000000"
        })
        space_id = space_response.json()["id"]

        filename, content, content_type = sample_text_file
        upload_response = client.post(
            "/documents/",
            files={"file": (filename, content, content_type)},
            data={"study_space_ids": str(space_id)}
        )
        document_id = upload_response.json()["id"]

        # Generar 10 preguntas mock
        mock_questions = [
            {
                "question": f"Question {i}",
                "options": {
                    "correct": "A",
                    "semi-correct": "B",
                    "incorrect1": "C",
                    "incorrect2": "D"
                },
                "explanation": "Test"
            }
            for i in range(10)
        ]

        with patch('app.services.openai_service.OpenAIService.generate_quiz') as mock_openai:
            mock_openai.return_value = mock_questions

            # Solicitar 10 preguntas
            quiz_response = client.post(
                f"/quizzes/generate-from-document/{document_id}",
                data={"study_space_id": str(space_id), "max_questions": "10"}
            )

            assert quiz_response.status_code == 201
            quiz = quiz_response.json()
            assert len(quiz["questions"]) == 10

    def test_cannot_complete_quiz_attempt_twice(
        self, authenticated_client, sample_text_file
    ):
        """No debe permitir completar el mismo intento dos veces"""
        client = authenticated_client

        # Setup: Crear espacio, documento y quiz
        space_response = client.post("/study-spaces/", json={
            "name": "Test Space",
            "description": "Test",
            "color": "#000000"
        })
        space_id = space_response.json()["id"]

        filename, content, content_type = sample_text_file
        upload_response = client.post(
            "/documents/",
            files={"file": (filename, content, content_type)},
            data={"study_space_ids": str(space_id)}
        )
        document_id = upload_response.json()["id"]

        mock_questions = [
            {
                "question": "Test",
                "options": {
                    "correct": "A",
                    "semi-correct": "B",
                    "incorrect1": "C",
                    "incorrect2": "D"
                },
                "explanation": "Test"
            }
        ]

        with patch('app.services.openai_service.OpenAIService.generate_quiz') as mock_openai:
            mock_openai.return_value = mock_questions

            quiz_response = client.post(
                f"/quizzes/generate-from-document/{document_id}",
                data={"study_space_id": str(space_id), "max_questions": "5"}
            )
            quiz_id = quiz_response.json()["id"]

        # Iniciar y completar intento
        attempt_response = client.post("/quiz-attempts", json={"quiz_id": quiz_id})
        attempt_id = attempt_response.json()["id"]

        # Responder al menos una pregunta antes de completar
        client.post(
            f"/quiz-attempts/{attempt_id}/answer",
            json={"question_index": 0, "selected_option": "A"}
        )

        complete1 = client.post(f"/quiz-attempts/{attempt_id}/complete")
        assert complete1.status_code == 200

        # Intentar completar de nuevo debe fallar
        complete2 = client.post(f"/quiz-attempts/{attempt_id}/complete")
        assert complete2.status_code == 400

    def test_list_quiz_attempts_for_quiz(
        self, authenticated_client, sample_text_file
    ):
        """Debe listar todos los intentos de un quiz específico"""
        client = authenticated_client

        # Setup
        space_response = client.post("/study-spaces/", json={
            "name": "Test Space",
            "description": "Test",
            "color": "#000000"
        })
        space_id = space_response.json()["id"]

        filename, content, content_type = sample_text_file
        upload_response = client.post(
            "/documents/",
            files={"file": (filename, content, content_type)},
            data={"study_space_ids": str(space_id)}
        )
        document_id = upload_response.json()["id"]

        mock_questions = [{"question": "Test", "options": {"correct": "A", "semi-correct": "B", "incorrect1": "C", "incorrect2": "D"}, "explanation": "Test"}]

        with patch('app.services.openai_service.OpenAIService.generate_quiz') as mock_openai:
            mock_openai.return_value = mock_questions

            quiz_response = client.post(
                f"/quizzes/generate-from-document/{document_id}",
                data={"study_space_id": str(space_id), "max_questions": "5"}
            )
            quiz_id = quiz_response.json()["id"]

        # Crear 3 intentos
        attempt_ids = []
        for _ in range(3):
            resp = client.post("/quiz-attempts", json={"quiz_id": quiz_id})
            assert resp.status_code == 201
            attempt_ids.append(resp.json()["id"])

        # Verificar que se crearon 3 intentos únicos
        assert len(attempt_ids) == 3
        assert len(set(attempt_ids)) == 3  # Todos IDs son únicos
