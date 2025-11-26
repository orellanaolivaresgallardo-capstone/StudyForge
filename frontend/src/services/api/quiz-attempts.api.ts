// frontend/src/services/api/quiz-attempts.api.ts
/**
 * Endpoints de intentos de quiz.
 */
import apiClient from './client';
import type {
  QuizAttemptResponse,
  QuizAttemptWithQuestionsResponse,
  QuizAttemptCreate,
  QuizAttemptAnswer,
  QuizAttemptAnswerFeedback,
  QuizResultResponse,
} from '@/types';

export async function createQuizAttempt(
  data: QuizAttemptCreate
): Promise<QuizAttemptWithQuestionsResponse> {
  const response = await apiClient.post<QuizAttemptWithQuestionsResponse>(
    '/quiz-attempts',
    data
  );
  return response.data;
}

export async function answerQuestion(
  attemptId: string,
  data: QuizAttemptAnswer
): Promise<QuizAttemptAnswerFeedback> {
  const response = await apiClient.post<QuizAttemptAnswerFeedback>(
    `/quiz-attempts/${attemptId}/answer`,
    data
  );
  return response.data;
}

export async function completeQuizAttempt(
  attemptId: string
): Promise<QuizAttemptResponse> {
  const response = await apiClient.post<QuizAttemptResponse>(
    `/quiz-attempts/${attemptId}/complete`
  );
  return response.data;
}

export async function getQuizAttemptResults(
  attemptId: string
): Promise<QuizResultResponse> {
  const response = await apiClient.get<QuizResultResponse>(
    `/quiz-attempts/${attemptId}/results`
  );
  return response.data;
}
