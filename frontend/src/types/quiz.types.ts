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

export interface QuizResponse {
  id: string;
  user_id: string;
  summary_id: string | null;
  study_space_id: string | null;
  study_space_name: string | null;
  summary_title: string | null;
  document_names: string[];
  source_type: string; // "file" | "summary" | "space"
  title: string;
  topic: string;
  difficulty_level: number; // 1-5
  created_at: string;
  questions: QuestionData[]; // Preguntas en formato JSON
  num_questions: number;
  num_attempts: number;
}

export interface QuizListResponse {
  items: QuizResponse[];
  total: number;
}

export interface QuizCreateFromFile {
  file: File;
  topic: string;
  max_questions?: number;
  difficulty_level?: number;
}

export interface QuizCreateFromSummary {
  summary_id: string;
  topic?: string;
  max_questions?: number;
}
