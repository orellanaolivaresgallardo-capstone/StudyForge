// frontend/src/types/api.ts
/**
 * Tipos TypeScript para el API de StudyForge.
 * Coinciden con los schemas Pydantic del backend.
 */

// ==================== AUTH ====================

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface UserDetailResponse extends UserResponse {
  storage_quota_bytes: number;
  storage_used_bytes: number;
  storage_available_bytes: number;
  storage_usage_percentage: number;
  max_documents_per_summary: number;
  max_file_size_bytes: number;
}

export interface UserCreate {
  email: string;
  username: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// ==================== DOCUMENTS ====================

export interface DocumentResponse {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentDetailResponse extends DocumentResponse {
  file_content: string; // base64
  extracted_text: string | null;
}

export interface DocumentListResponse {
  items: DocumentResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface DocumentUpdateTitle {
  title: string;
}

export interface StorageInfo {
  storage_quota_bytes: number;
  storage_used_bytes: number;
  storage_available_bytes: number;
  storage_usage_percentage: number;
  total_documents: number;
}

// ==================== SUMMARIES ====================

export type ExpertiseLevel = "basico" | "medio" | "avanzado";

export interface SummaryResponse {
  id: string;
  user_id: string;
  title: string;
  content: Record<string, any>; // JSONB
  expertise_level: ExpertiseLevel;
  topics: string[];
  key_concepts: string[];
  created_at: string;
  updated_at: string;
}

export interface SummaryDetailResponse extends SummaryResponse {
  documents: DocumentResponse[];
}

export interface SummaryListResponse {
  items: SummaryResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface SummaryCreateFromDocuments {
  document_ids: string[];
  expertise_level: ExpertiseLevel;
  title?: string;
}

// ==================== QUIZZES ====================

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
  title: string;
  topic: string;
  difficulty_level: number; // 1-5
  created_at: string;
  questions: QuestionData[]; // Preguntas en formato JSON
}

export interface QuizListResponse {
  items: QuizResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface QuizCreateFromFile {
  file: File;
  topic: string;
  max_questions?: number;
  difficulty_level?: number;
}

export interface QuizCreateFromSummary {
  summary_id: string;
  max_questions?: number;
}

// ==================== QUIZ ATTEMPTS ====================

export interface QuizAttemptResponse {
  id: string;
  quiz_id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  correct_answers: string[]; // ["A", "B", "C", ...] - Respuestas correctas aleatorizadas
  user_answers: string[]; // ["A", "C", "B", ...] - Respuestas del usuario
}

export interface QuizAttemptWithQuestionsResponse extends QuizAttemptResponse {
  randomized_questions: QuestionWithRandomizedOptions[]; // Preguntas con opciones aleatorizadas
}

export interface QuizAttemptCreate {
  quiz_id: string;
}

export interface QuizAttemptAnswer {
  question_index: number; // Índice de la pregunta (0-based)
  selected_option: CorrectOption;
}

export interface QuizAttemptAnswerFeedback {
  is_correct: boolean;
  correct_option: CorrectOption;
  explanation: string;
  selected_option: CorrectOption;
  score_so_far?: number; // Puntaje acumulado hasta el momento
}

// Detalle de una pregunta en los resultados
export interface QuestionResultDetail {
  question_text: string;
  options: Record<string, string>; // {'A': '...', 'B': '...', 'C': '...', 'D': '...'}
  correct_option: string;
  selected_option: string;
  is_correct: boolean;
  explanation: string;
}

// Resultados completos de un quiz attempt
export interface QuizResultResponse {
  attempt_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  completed_at: string;
  questions: QuestionResultDetail[];
}

// ==================== STATS ====================

export interface ProgressByTopic {
  topic: string;
  total_attempts: number;
  avg_score: number;
  max_score: number;
  min_score: number;
}

export interface UserProgress {
  total_attempts: number;
  avg_score_overall: number;
  progress_by_topic: ProgressByTopic[];
}

export interface RecentAttempt {
  attempt_id: string;
  quiz_id: string;
  quiz_title: string;
  topic: string;
  difficulty_level: number;
  score: number;
  completed_at: string;
}

export interface UserPerformance {
  recent_attempts: RecentAttempt[];
}

export interface StatsSummary {
  total_summaries: number;
  total_quizzes: number;
  total_completed_attempts: number;
  avg_score: number;
  best_score: number;
  unique_topics_studied: number;
}

// ==================== HEALTH ====================

export interface HealthResponse {
  status: string;
}
