// frontend/src/services/api/index.ts
/**
 * Barrel export para el cliente API de StudyForge.
 * Re-exporta todas las funciones de los módulos de dominio.
 */

// Client y funciones de token management
export { default } from './client';
export { default as apiClient } from './client';
export { getToken, setToken, clearToken, isAuthenticated } from './client';

// Health
export { health } from './health.api';

// Auth
export { register, login, getCurrentUser } from './auth.api';

// Documents
export {
  uploadDocument,
  listDocuments,
  getDocument,
  updateDocumentTitle,
  deleteDocument,
  getStorageInfo,
} from './documents.api';

// Summaries
export {
  uploadAndCreateSummary,
  createSummaryFromDocuments,
  listSummaries,
  getSummary,
  deleteSummary,
} from './summaries.api';

// Quizzes
export {
  createQuizFromFile,
  createQuizFromSummary,
  createQuizFromDocument,
  listQuizzes,
  getQuiz,
  deleteQuiz,
} from './quizzes.api';

// Quiz Attempts
export {
  createQuizAttempt,
  answerQuestion,
  completeQuizAttempt,
  getQuizAttemptResults,
} from './quiz-attempts.api';

// Stats
export {
  getUserPerformance,
  getStatsSummary,
  getProgressBySpace,
} from './stats.api';

// Study Spaces
export {
  createStudySpace,
  listStudySpaces,
  listStudySpacesWithStats,
  getStudySpace,
  updateStudySpace,
  deleteStudySpace,
  addSummaryToSpace,
  removeSummaryFromSpace,
  addDocumentToSpace,
  removeDocumentFromSpace,
  getStudySpaceStats,
  getStudySpaceQuizzes,
  createQuizFromSpace,
} from './study-spaces.api';
