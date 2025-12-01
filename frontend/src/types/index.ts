/**
 * Exportaciones centralizadas de tipos
 */

// Auth
export type {
  UserResponse,
  UserDetailResponse,
  UserCreate,
  UserLogin,
  Token,
} from './auth.types';

// Documents
export type {
  DocumentResponse,
  DocumentDetailResponse,
  DocumentListResponse,
  DocumentUpdateTitle,
  StorageInfo,
} from './document.types';

// Summaries
export type {
  ExpertiseLevel,
  KeyConceptItem,
  SummaryResponse,
  SummaryDetailResponse,
  SummaryListResponse,
  SummaryCreateFromDocuments,
} from './summary.types';

// Quizzes
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

// Quiz Attempts
export type {
  QuizSnapshotData,
  StudySpaceSnapshotData,
  QuizAttemptResponse,
  QuizAttemptWithQuestionsResponse,
  QuizAttemptCreate,
  QuizAttemptAnswer,
  QuizAttemptAnswerFeedback,
  QuestionResultDetail,
  QuizResultResponse,
} from './quiz-attempt.types';

// Study Spaces
export type {
  StudySpaceCreate,
  StudySpaceUpdate,
  StudySpaceResponse,
  StudySpaceDetailResponse,
  StudySpaceListResponse,
  StudySpaceWithStatsResponse,
  StudySpaceListWithStatsResponse,
  AddResourceRequest,
  StudySpaceStatsResponse,
} from './study-space.types';

// Stats
export type {
  RecentAttempt,
  UserPerformance,
  StatsSummary,
} from './stats.types';

// Health
export type {
  HealthResponse,
} from './health.types';
