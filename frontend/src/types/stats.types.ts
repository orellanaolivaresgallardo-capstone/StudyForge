/**
 * Tipos relacionados con estadísticas
 */

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
  unique_topics_studied: number;
}
