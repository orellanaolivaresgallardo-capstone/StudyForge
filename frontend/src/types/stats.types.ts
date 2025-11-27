/**
 * Tipos relacionados con estadísticas
 */

export interface RecentAttempt {
  attempt_id: string;
  quiz_id: string;
  quiz_title: string;
  difficulty_level: number;
  score: number;
  completed_at: string;
  study_space_id?: string | null;
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
  unique_spaces_studied: number;
}
