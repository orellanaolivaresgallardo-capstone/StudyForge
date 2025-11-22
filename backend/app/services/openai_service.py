# app/services/openai_service.py
"""
Service para interactuar con la API de OpenAI.
"""
import json
from typing import List, Dict, Any
from openai import OpenAI
from fastapi import HTTPException, status
from app.config import settings


class OpenAIService:
    """Service para generar resúmenes y cuestionarios usando OpenAI."""

    def __init__(self):
        """Inicializa el cliente de OpenAI."""
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY no está configurada")

        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL

    def generate_summary(
        self, text: str, expertise_level: str, max_tokens: int = 2000
    ) -> Dict[str, Any]:
        """
        Genera un resumen del texto según el nivel de expertise.

        Args:
            text: Texto a resumir
            expertise_level: Nivel de expertise (basico, medio, avanzado)
            max_tokens: Máximo de tokens para la respuesta

        Returns:
            Diccionario con:
                - title: Título del resumen
                - summary: Resumen del texto
                - topics: Lista de temas principales
                - key_concepts: Lista de conceptos clave

        Raises:
            HTTPException: Si hay error con OpenAI
        """
        # Definir el prompt según el nivel de expertise
        level_prompts = {
            "basico": "lenguaje simple y accesible, enfocándote en conceptos fundamentales",
            "medio": "balance entre claridad y profundidad, con términos técnicos explicados",
            "avanzado": "análisis técnico y detallado, asumiendo conocimientos previos del tema",
        }

        level_instruction = level_prompts.get(expertise_level, level_prompts["medio"])

        system_prompt = f"""Eres un asistente experto en crear resúmenes educativos.
Debes generar un resumen del texto proporcionado con {level_instruction}.

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{{
    "title": "Título conciso del tema (máximo 10 palabras)",
    "summary": "Resumen del contenido (200-500 palabras)",
    "topics": ["tema1", "tema2", "tema3"],
    "key_concepts": ["concepto1", "concepto2", "concepto3"]
}}"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Texto a resumir:\n\n{text[:8000]}"}  # Limitar a ~8k caracteres
                ],
                max_tokens=max_tokens,
                temperature=0.7,
                response_format={"type": "json_object"}
            )

            # Validar que la respuesta no sea None
            content = response.choices[0].message.content
            if content is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="El mensaje en la respuesta de OpenIA estaba vacío"
                )

            # Parsear respuesta JSON
            result = json.loads(content)

            return result

        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al parsear respuesta de OpenAI: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al generar resumen: {str(e)}"
            )

    def generate_quiz(
        self,
        text: str,
        topic: str,
        difficulty_level: int,
        num_questions: int,
    ) -> List[Dict[str, Any]]:
        """
        Genera un cuestionario de opción múltiple a partir del texto.

        Args:
            text: Texto base para generar preguntas
            topic: Tema específico o "general"
            difficulty_level: Nivel de dificultad (1-5)
            num_questions: Número de preguntas a generar

        Returns:
            Lista de preguntas, cada una con:
                - question: Texto de la pregunta
                - options: Dict con opciones A, B, C, D
                - correct: Opción correcta (A, B, C, D)
                - explanation: Explicación de la respuesta

        Raises:
            HTTPException: Si hay error con OpenAI
        """
        difficulty_desc = {
            1: "muy fácil, conceptos básicos",
            2: "fácil, recordar información directa",
            3: "medio, requiere comprensión",
            4: "difícil, requiere análisis",
            5: "muy difícil, requiere síntesis y evaluación",
        }

        difficulty_instruction = difficulty_desc.get(difficulty_level, difficulty_desc[3])
        topic_instruction = f"sobre el tema '{topic}'" if topic != "general" else "que cubran el contenido general"

        system_prompt = f"""Eres un experto en crear preguntas educativas de opción múltiple.
Genera {num_questions} preguntas {topic_instruction} con nivel de dificultad {difficulty_instruction}.

IMPORTANTE:
- Cada pregunta debe tener 4 opciones (A, B, C, D)
- Solo una opción es correcta
- Las opciones incorrectas deben ser plausibles
- Incluye una explicación detallada de por qué la respuesta es correcta

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{{
    "questions": [
        {{
            "question": "Texto de la pregunta",
            "options": {{
                "correct": "alternativa correcta",
                "semi-correct": "alternativa casi correcta",
                "incorrect1": "alternativa que puede confundir",
                "incorrect2": "otra alternativa que puede confundir"
            }},
            "explanation": "Explicación detallada de por qué la respuesta correcta es correcta y no las otras"
        }}
    ]
}}"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Contenido:\n\n{text[:8000]}"}
                ],
                max_tokens=3000,
                temperature=0.8,
                response_format={"type": "json_object"}
            )

            # Validar que la respuesta no sea None
            content = response.choices[0].message.content
            if content is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="El mensaje en la respuesta de OpenIA estaba vacío"
                )

            # Parsear respuesta JSON
            result = json.loads(content)

            return result.get("questions", [])

        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al parsear respuesta de OpenAI: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al generar cuestionario: {str(e)}"
            )
