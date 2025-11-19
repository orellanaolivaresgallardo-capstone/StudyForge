from typing import Optional, List, Dict, Any

class LlmProvider:
    name: str = "none"

    def summarize_text(self, text: str, *, target_sentences: int, timeout_s: float = 12.0) -> Optional[str]:
        """Resumen en target_sentences; None si falla/timeout."""
        raise NotImplementedError

    def generate_quiz(self, title: str, text: str, *, size: int = 6, timeout_s: float = 20.0) -> Optional[Dict[str, Any]]:
        """
        Devuelve {"questions":[{"question": str, "options":[...], "answer_index": int, "explanation": str}, ...]}
        o None si falla.
        """
        raise NotImplementedError
