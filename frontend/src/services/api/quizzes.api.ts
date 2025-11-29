// frontend/src/services/api/quizzes.api.ts
/**
 * Endpoints de gestión de quizzes.
 */
import apiClient from './client';
import type {
  QuizResponse,
  QuizListResponse,
  QuizCreateFromSummary,
} from '@/types';

export async function createQuizFromFile(
  file: File,
  maxQuestions: number = 10,
  difficultyLevel?: number
): Promise<QuizResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('max_questions', maxQuestions.toString());
  if (difficultyLevel !== undefined) {
    formData.append('difficulty_level', difficultyLevel.toString());
  }

  const response = await apiClient.post<QuizResponse>(
    '/quizzes/generate-from-file',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

export async function createQuizFromSummary(
  data: QuizCreateFromSummary
): Promise<QuizResponse> {
  const formData = new FormData();
  if (data.max_questions) {
    formData.append('max_questions', data.max_questions.toString());
  }

  const response = await apiClient.post<QuizResponse>(
    `/quizzes/generate-from-summary/${data.summary_id}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

export async function createQuizFromDocument(
  documentId: string,
  studySpaceId: string,
  maxQuestions?: number
): Promise<QuizResponse> {
  const formData = new FormData();
  formData.append('study_space_id', studySpaceId); // NEW: Required field
  if (maxQuestions !== undefined) {
    formData.append('max_questions', maxQuestions.toString());
  }

  const response = await apiClient.post<QuizResponse>(
    `/quizzes/generate-from-document/${documentId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

export async function listQuizzes(
  skip: number = 0,
  limit: number = 100
): Promise<QuizListResponse> {
  const response = await apiClient.get<QuizListResponse>('/quizzes', {
    params: { skip, limit },
  });
  return response.data;
}

export async function getQuiz(quizId: string): Promise<QuizResponse> {
  const response = await apiClient.get<QuizResponse>(
    `/quizzes/${quizId}`
  );
  return response.data;
}

export async function deleteQuiz(quizId: string): Promise<void> {
  await apiClient.delete(`/quizzes/${quizId}`);
}
