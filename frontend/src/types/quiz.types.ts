/**
 * Tipos relacionados con cuestionarios
 */

export type CorrectOption = "A" | "B" | "C" | "D";

// Opciones de pregunta en formato original (OpenAI)
export interface QuestionOptionsData {
  correct: string;
  "semi-correct": string;
  incorrect1: string;
  incorrect2: string;
}

// Pregunta en formato JSON (almacenado en BD)
export interface QuestionData {
  question: string;
  options: QuestionOptionsData;
  explanation: string;
}

// Pregunta con opciones aleatorizadas (A, B, C, D)
export interface QuestionWithRandomizedOptions {
  question: string;
  options: Record<string, string>; // {'A': '...', 'B': '...', 'C': '...', 'D': '...'}
  explanation: string;
}

// Tipo de fuente del quiz
export type QuizSourceType = "document" | "summary" | "study_space";

export interface QuizResponse {
  id: string;
  user_id: string;
  study_space_id: string; // Required FK (NOT NULL)
  source_type: QuizSourceType; // Tipo de fuente: 'document', 'summary', 'study_space'
  title: string;
  difficulty_level: number; // 1-5
  created_at: string;
  questions: QuestionData[]; // Preguntas en formato JSON
  // Source tracking fields (nullable, SET NULL on delete)
  source_document_id: string | null; // FK singular al documento fuente
  source_summary_id: string | null; // FK singular al resumen fuente
  // Denormalized cache fields (JSONB)
  source_names: Record<string, string> | null; // e.g., {"summary": "My Summary", "space": "My Space"}
  source_metadata: Record<string, unknown> | null; // e.g., {"summary_count": 2}
  // Computed fields
  study_space_name: string | null; // Computed from relationship
  num_questions: number; // Número de preguntas
  num_attempts: number; // Número de intentos del usuario
}

export interface QuizListResponse {
  items: QuizResponse[];
  total: number;
}

export interface QuizCreateFromFile {
  file: File;
  study_space_id: string; // Required: espacio de estudio donde se creará el quiz
  max_questions?: number;
  difficulty_level?: number;
}

export interface QuizCreateFromSummary {
  summary_id: string;
  study_space_id: string; // Required: espacio de estudio donde se creará el quiz
  max_questions?: number;
}

export interface QuizCreateFromSpace {
  max_questions?: number; // study_space_id viene del parámetro de ruta
}
