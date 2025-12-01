/**
 * Tipos relacionados con intentos de cuestionarios
 */

import type { CorrectOption, QuestionWithRandomizedOptions } from './quiz.types';

export interface QuizSnapshotData {
  id: string;
  title: string;
  difficulty_level: number;
}

export interface StudySpaceSnapshotData {
  id: string;
  name: string;
  color: string;
}

export interface QuizAttemptResponse {
  id: string;
  quiz_id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  correct_answers: string[]; // ["A", "B", "C", ...] - Respuestas correctas aleatorizadas
  user_answers: string[]; // ["A", "C", "B", ...] - Respuestas del usuario
  quiz_snapshot?: QuizSnapshotData | null;
  study_space_snapshot?: StudySpaceSnapshotData | null;
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
  study_space_snapshot?: StudySpaceSnapshotData | null;
}
