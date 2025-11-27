"""
Tests unitarios para OpenAIService
"""
import pytest
import json
from unittest.mock import Mock, MagicMock, patch
from fastapi import HTTPException
from app.services.openai_service import OpenAIService


# ========================================
# TESTS PARA __init__()
# ========================================

@patch('app.services.openai_service.settings')
def test_init_without_api_key(mock_settings):
    """__init__ debe lanzar ValueError sin API key"""
    mock_settings.OPENAI_API_KEY = None

    with pytest.raises(ValueError, match="OPENAI_API_KEY no está configurada"):
        OpenAIService()


@patch('app.services.openai_service.settings')
@patch('app.services.openai_service.OpenAI')
def test_init_with_api_key(mock_openai_client, mock_settings):
    """__init__ debe inicializar el cliente con API key"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    service = OpenAIService()

    mock_openai_client.assert_called_once_with(api_key="sk-test-key")
    assert service.model == "gpt-4"


# ========================================
# TESTS PARA generate_summary()
# ========================================

@patch('app.services.openai_service.settings')
@patch('app.services.openai_service.OpenAI')
def test_generate_summary_basico(mock_openai_client, mock_settings):
    """generate_summary debe generar resumen nivel básico"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    # Mock de la respuesta de OpenAI
    mock_response = Mock()
    mock_message = Mock()
    mock_message.content = json.dumps({
        "title": "Introducción a Python",
        "summary": "Python es un lenguaje de programación...",
        "topics": ["variables", "funciones"],
        "key_concepts": [
            {"concept": "variable", "definition": "Contenedor de datos"}
        ]
    })
    mock_response.choices = [Mock(message=mock_message)]

    mock_client = Mock()
    mock_client.chat.completions.create.return_value = mock_response
    mock_openai_client.return_value = mock_client

    # Ejecutar
    service = OpenAIService()
    result = service.generate_summary(
        text="Python es un lenguaje de programación...",
        expertise_level="basico"
    )

    # Verificar
    assert result["title"] == "Introducción a Python"
    assert "topics" in result
    assert "key_concepts" in result
    mock_client.chat.completions.create.assert_called_once()

    # Verificar que el prompt incluye "lenguaje simple"
    call_args = mock_client.chat.completions.create.call_args
    assert "simple y accesible" in call_args[1]["messages"][0]["content"]


@patch('app.services.openai_service.settings')
@patch('app.services.openai_service.OpenAI')
def test_generate_summary_avanzado(mock_openai_client, mock_settings):
    """generate_summary debe generar resumen nivel avanzado"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_response = Mock()
    mock_message = Mock()
    mock_message.content = json.dumps({
        "title": "Python Avanzado",
        "summary": "Análisis técnico de Python...",
        "topics": ["metaclasses", "descriptors"],
        "key_concepts": []
    })
    mock_response.choices = [Mock(message=mock_message)]

    mock_client = Mock()
    mock_client.chat.completions.create.return_value = mock_response
    mock_openai_client.return_value = mock_client

    service = OpenAIService()
    result = service.generate_summary(
        text="Advanced Python concepts...",
        expertise_level="avanzado"
    )

    assert result["title"] == "Python Avanzado"
    # Verificar que el prompt incluye "análisis técnico"
    call_args = mock_client.chat.completions.create.call_args
    assert "análisis técnico" in call_args[1]["messages"][0]["content"]


@patch('app.services.openai_service.settings')
@patch('app.services.openai_service.OpenAI')
def test_generate_summary_with_space_context(mock_openai_client, mock_settings):
    """generate_summary debe incluir contexto del espacio"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_response = Mock()
    mock_message = Mock()
    mock_message.content = json.dumps({
        "title": "Test",
        "summary": "Test summary",
        "topics": [],
        "key_concepts": []
    })
    mock_response.choices = [Mock(message=mock_message)]

    mock_client = Mock()
    mock_client.chat.completions.create.return_value = mock_response
    mock_openai_client.return_value = mock_client

    service = OpenAIService()
    service.generate_summary(
        text="Some text",
        expertise_level="medio",
        space_context="Machine Learning"
    )

    # Verificar que el contexto se incluyó en el prompt
    call_args = mock_client.chat.completions.create.call_args
    assert "Machine Learning" in call_args[1]["messages"][0]["content"]
    assert "CONTEXTO" in call_args[1]["messages"][0]["content"]


@patch('app.services.openai_service.settings')
@patch('app.services.openai_service.OpenAI')
def test_generate_summary_text_truncation(mock_openai_client, mock_settings):
    """generate_summary debe truncar texto largo a 8000 caracteres"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_response = Mock()
    mock_message = Mock()
    mock_message.content = json.dumps({"title": "Test", "summary": "Summary", "topics": [], "key_concepts": []})
    mock_response.choices = [Mock(message=mock_message)]

    mock_client = Mock()
    mock_client.chat.completions.create.return_value = mock_response
    mock_openai_client.return_value = mock_client

    service = OpenAIService()
    long_text = "x" * 10000  # 10k caracteres
    service.generate_summary(text=long_text, expertise_level="medio")

    # Verificar que se truncó a 8000
    call_args = mock_client.chat.completions.create.call_args
    user_message = call_args[1]["messages"][1]["content"]
    assert len(user_message) < 10000 + 100  # Aproximadamente 8000 + overhead de texto


@patch('app.services.openai_service.settings')
@patch('app.services.openai_service.OpenAI')
def test_generate_summary_empty_response(mock_openai_client, mock_settings):
    """generate_summary debe lanzar 500 si la respuesta es None"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_response = Mock()
    mock_message = Mock()
    mock_message.content = None  # Contenido vacío
    mock_response.choices = [Mock(message=mock_message)]

    mock_client = Mock()
    mock_client.chat.completions.create.return_value = mock_response
    mock_openai_client.return_value = mock_client

    service = OpenAIService()

    with pytest.raises(HTTPException) as exc_info:
        service.generate_summary(text="Test", expertise_level="medio")

    assert exc_info.value.status_code == 500
    assert "vacío" in exc_info.value.detail


@patch('app.services.openai_service.settings')
@patch('app.services.openai_service.OpenAI')
def test_generate_summary_invalid_json(mock_openai_client, mock_settings):
    """generate_summary debe lanzar 500 si el JSON es inválido"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_response = Mock()
    mock_message = Mock()
    mock_message.content = "invalid json {"  # JSON malformado
    mock_response.choices = [Mock(message=mock_message)]

    mock_client = Mock()
    mock_client.chat.completions.create.return_value = mock_response
    mock_openai_client.return_value = mock_client

    service = OpenAIService()

    with pytest.raises(HTTPException) as exc_info:
        service.generate_summary(text="Test", expertise_level="medio")

    assert exc_info.value.status_code == 500
    assert "parsear" in exc_info.value.detail


@patch('app.services.openai_service.settings')
@patch('app.services.openai_service.OpenAI')
def test_generate_summary_api_error(mock_openai_client, mock_settings):
    """generate_summary debe manejar errores de la API de OpenAI"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_client = Mock()
    mock_client.chat.completions.create.side_effect = Exception("API Error")
    mock_openai_client.return_value = mock_client

    service = OpenAIService()

    with pytest.raises(HTTPException) as exc_info:
        service.generate_summary(text="Test", expertise_level="medio")

    assert exc_info.value.status_code == 500
    assert "generar resumen" in exc_info.value.detail


# ========================================
# TESTS PARA generate_quiz()
# ========================================

@patch('app.services.openai_service.settings')
@patch('app.services.openai_service.OpenAI')
def test_generate_quiz_basic(mock_openai_client, mock_settings):
    """generate_quiz debe generar quiz con preguntas"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_response = Mock()
    mock_message = Mock()
    mock_message.content = json.dumps({
        "questions": [
            {
                "question": "¿Qué es Python?",
                "options": {
                    "correct": "Lenguaje de programación",
                    "semi-correct": "Framework",
                    "incorrect1": "Base de datos",
                    "incorrect2": "Sistema operativo"
                },
                "explanation": "Python es un lenguaje interpretado"
            }
        ]
    })
    mock_response.choices = [Mock(message=mock_message)]

    mock_client = Mock()
    mock_client.chat.completions.create.return_value = mock_response
    mock_openai_client.return_value = mock_client

    service = OpenAIService()
    result = service.generate_quiz(
        text="Python is a programming language",
        difficulty_level=3,
        num_questions=1
    )

    assert len(result) == 1
    assert result[0]["question"] == "¿Qué es Python?"
    assert "options" in result[0]
    assert "explanation" in result[0]


@patch('app.services.openai_service.settings')
@patch('app.services.openai_service.OpenAI')
def test_generate_quiz_difficulty_levels(mock_openai_client, mock_settings):
    """generate_quiz debe usar descripciones de dificultad correctas"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_response = Mock()
    mock_message = Mock()
    mock_message.content = json.dumps({"questions": []})
    mock_response.choices = [Mock(message=mock_message)]

    mock_client = Mock()
    mock_client.chat.completions.create.return_value = mock_response
    mock_openai_client.return_value = mock_client

    service = OpenAIService()

    # Test difficulty 1
    service.generate_quiz(text="Test", difficulty_level=1, num_questions=5)
    call_args = mock_client.chat.completions.create.call_args
    assert "muy fácil" in call_args[1]["messages"][0]["content"]

    # Test difficulty 5
    service.generate_quiz(text="Test", difficulty_level=5, num_questions=5)
    call_args = mock_client.chat.completions.create.call_args
    assert "muy difícil" in call_args[1]["messages"][0]["content"]


@patch('app.services.openai_service.settings')
@patch('app.services.openai_service.OpenAI')
def test_generate_quiz_with_space_context(mock_openai_client, mock_settings):
    """generate_quiz debe incluir contexto del espacio"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_response = Mock()
    mock_message = Mock()
    mock_message.content = json.dumps({"questions": []})
    mock_response.choices = [Mock(message=mock_message)]

    mock_client = Mock()
    mock_client.chat.completions.create.return_value = mock_response
    mock_openai_client.return_value = mock_client

    service = OpenAIService()
    service.generate_quiz(
        text="Test",
        difficulty_level=3,
        num_questions=5,
        space_context="Data Science"
    )

    call_args = mock_client.chat.completions.create.call_args
    assert "Data Science" in call_args[1]["messages"][0]["content"]
    assert "CONTEXTO" in call_args[1]["messages"][0]["content"]


@patch('app.services.openai_service.settings')
@patch('app.services.openai_service.OpenAI')
def test_generate_quiz_empty_response(mock_openai_client, mock_settings):
    """generate_quiz debe lanzar 500 si la respuesta es None"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_response = Mock()
    mock_message = Mock()
    mock_message.content = None
    mock_response.choices = [Mock(message=mock_message)]

    mock_client = Mock()
    mock_client.chat.completions.create.return_value = mock_response
    mock_openai_client.return_value = mock_client

    service = OpenAIService()

    with pytest.raises(HTTPException) as exc_info:
        service.generate_quiz(text="Test", difficulty_level=3, num_questions=5)

    assert exc_info.value.status_code == 500
    assert "vacío" in exc_info.value.detail


@patch('app.services.openai_service.settings')
@patch('app.services.openai_service.OpenAI')
def test_generate_quiz_invalid_json(mock_openai_client, mock_settings):
    """generate_quiz debe lanzar 500 si el JSON es inválido"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_response = Mock()
    mock_message = Mock()
    mock_message.content = "not valid json"
    mock_response.choices = [Mock(message=mock_message)]

    mock_client = Mock()
    mock_client.chat.completions.create.return_value = mock_response
    mock_openai_client.return_value = mock_client

    service = OpenAIService()

    with pytest.raises(HTTPException) as exc_info:
        service.generate_quiz(text="Test", difficulty_level=3, num_questions=5)

    assert exc_info.value.status_code == 500
    assert "parsear" in exc_info.value.detail


@patch('app.services.openai_service.settings')
@patch('app.services.openai_service.OpenAI')
def test_generate_quiz_api_error(mock_openai_client, mock_settings):
    """generate_quiz debe manejar errores de la API"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_client = Mock()
    mock_client.chat.completions.create.side_effect = Exception("Rate limit")
    mock_openai_client.return_value = mock_client

    service = OpenAIService()

    with pytest.raises(HTTPException) as exc_info:
        service.generate_quiz(text="Test", difficulty_level=3, num_questions=5)

    assert exc_info.value.status_code == 500
    assert "generar cuestionario" in exc_info.value.detail


@patch('app.services.openai_service.settings')
@patch('app.services.openai_service.OpenAI')
def test_generate_quiz_multiple_questions(mock_openai_client, mock_settings):
    """generate_quiz debe solicitar el número correcto de preguntas"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_response = Mock()
    mock_message = Mock()
    mock_message.content = json.dumps({
        "questions": [
            {"question": "Q1", "options": {}, "explanation": "E1"},
            {"question": "Q2", "options": {}, "explanation": "E2"},
            {"question": "Q3", "options": {}, "explanation": "E3"},
            {"question": "Q4", "options": {}, "explanation": "E4"},
            {"question": "Q5", "options": {}, "explanation": "E5"},
        ]
    })
    mock_response.choices = [Mock(message=mock_message)]

    mock_client = Mock()
    mock_client.chat.completions.create.return_value = mock_response
    mock_openai_client.return_value = mock_client

    service = OpenAIService()
    result = service.generate_quiz(text="Test", difficulty_level=3, num_questions=5)

    assert len(result) == 5
    # Verificar que el prompt solicita 5 preguntas
    call_args = mock_client.chat.completions.create.call_args
    assert "5 preguntas" in call_args[1]["messages"][0]["content"]
