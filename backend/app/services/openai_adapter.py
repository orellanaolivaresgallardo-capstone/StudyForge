import os, json, re
from typing import Optional, Dict, Any
from openai import OpenAI
from .llm_provider import LlmProvider

def _strip_code_fences(s: str) -> str:
    return re.sub(r"^```(?:json)?\s*|\s*```$", "", s.strip(), flags=re.DOTALL)

class OpenAiAdapter(LlmProvider):
    name = "openai"

    def __init__(self) -> None:
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.summary_model = os.getenv("OPENAI_SUMMARY_MODEL", "gpt-4o-mini")
        self.quiz_model = os.getenv("OPENAI_QUIZ_MODEL", self.summary_model)
        # Puedes subir o bajar el timeout global del cliente si quieres
        self.client = OpenAI()

    # === RESÚMENES ===
    def summarize_text(self, text: str, *, target_sentences: int, timeout_s: float = 12.0) -> Optional[str]:
        if not self.api_key:
            return None
        prompt = (
            "Resume el siguiente texto en ~{n} frases, tono claro y natural, sin títulos ni bullets.\n\n"
            "=== TEXTO ===\n{t}\n"
        ).format(n=max(1, target_sentences), t=text)
        try:
            resp = self.client.responses.create(
                model=self.summary_model,
                input=prompt,
                temperature=0.2,
                # max_output_tokens opcional: el SDK lo gestiona; puedes fijarlo si hace falta
                timeout=timeout_s,
            )
            out = (resp.output_text or "").strip()
            return out or None
        except Exception:
            return None

    # === QUIZZES ===
    def generate_quiz(
        self,
        title: str,
        text: str,
        *,
        size: int = 6,
        timeout_s: float = 20.0,
    ) -> Optional[Dict[str, Any]]:
        """
        Pide a la IA un quiz en JSON y devuelve un dict YA parseado.
        No lanza KeyError: si algo sale mal → None.
        """
        if not self.api_key:
            return None

        # Creamos cliente en cada llamada para no depender de atributos previos
        client = OpenAI(api_key=self.api_key)

        # Normalizamos tamaño
        try:
            size = int(size)
        except Exception:
            size = 6
        size = max(3, min(size, 10))

        system_msg = (
            "Eres un generador de cuestionarios de opción múltiple. "
            "Debes responder SOLO con JSON válido, sin explicaciones adicionales."
        )

        user_msg = f"""
Genera un cuestionario en ESPAÑOL sobre el siguiente texto.

REQUISITOS:
- Número de preguntas: {size}
- Cada pregunta con EXACTAMENTE 4 opciones (todas distintas).
- 'answer_index' debe ser un entero entre 0 y 3 (0 = primera opción).
- Incluye una breve 'explanation' por pregunta.
- NO incluyas texto fuera del JSON.
- NO añadas comentarios antes o después del JSON.
- ESQUEMA EXACTO:

{{
  "title": "título breve del quiz",
  "questions": [
    {{
      "question": "enunciado de la pregunta",
      "options": [
        "opción A",
        "opción B",
        "opción C",
        "opción D"
      ],
      "answer_index": 0,
      "explanation": "por qué esta opción es correcta"
    }}
  ]
}}

TEXTO BASE:
\"\"\"
{(text or "")[:6000]}
\"\"\"
"""

        try:
            resp = client.chat.completions.create(
                model=self.quiz_model,
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": user_msg},
                ],
                temperature=0.4,
            )
            raw = resp.choices[0].message.content or ""
            raw = _strip_code_fences(raw)

            data = json.loads(raw)
            if not isinstance(data, dict):
                return None

            # 🔧 Normalizamos claves de primer nivel para evitar cosas como ' "questions"'
            norm: Dict[str, Any] = {}
            for k, v in data.items():
                if isinstance(k, str):
                    nk = k.strip().strip('"').strip("'")
                else:
                    nk = k
                norm[nk] = v

            # No hacemos validación estricta aquí; eso lo maneja QuizService
            return norm
        except Exception:
            # Cualquier problema → None (para que el servicio suba 503 limpio)
            return None
