// frontend/src/types/api.types.ts
/**
 * Re-exportaciones desde archivos de tipos organizados por dominio.
 * Este archivo mantiene compatibilidad hacia atrás con importaciones existentes.
 *
 * Para nuevos archivos, se recomienda importar directamente desde:
 * - import type { ... } from '../types' (usa index.ts)
 * - import type { ... } from '../types/auth.types'
 */

// ==================== AUTH ====================
export type {
  UserResponse,
  UserDetailResponse,
  UserCreate,
  UserLogin,
  Token,
} from './auth.types';

// ==================== DOCUMENTS ====================
export type {
  DocumentResponse,
  DocumentDetailResponse,
  DocumentListResponse,
  DocumentUpdateTitle,
  StorageInfo,
} from './document.types';

// ==================== SUMMARIES ====================
export type {
  ExpertiseLevel,
  KeyConceptItem,
  SummaryResponse,
  SummaryDetailResponse,
  SummaryListResponse,
  SummaryCreateFromDocuments,
} from './summary.types';

// ==================== QUIZZES ====================
export type {
  CorrectOption,
  QuestionOptionsData,
  QuestionData,
  QuestionWithRandomizedOptions,
  QuizResponse,
  QuizListResponse,
  QuizCreateFromFile,
  QuizCreateFromSummary,
} from './quiz.types';

// ==================== QUIZ ATTEMPTS ====================
export type {
  QuizAttemptResponse,
  QuizAttemptWithQuestionsResponse,
  QuizAttemptCreate,
  QuizAttemptAnswer,
  QuizAttemptAnswerFeedback,
  QuestionResultDetail,
  QuizResultResponse,
} from './quiz-attempt.types';

// ==================== STUDY SPACES ====================
export type {
  StudySpaceCreate,
  StudySpaceUpdate,
  StudySpaceResponse,
  StudySpaceDetailResponse,
  StudySpaceListResponse,
  AddResourceRequest,
  DeleteSpaceRequest,
  StudySpaceStatsResponse,
} from './study-space.types';

// ==================== STATS ====================
export type {
  ProgressByTopic,
  UserProgress,
  RecentAttempt,
  UserPerformance,
  StatsSummary,
} from './stats.types';

// ==================== HEALTH ====================
export type {
  HealthResponse,
} from './health.types';
