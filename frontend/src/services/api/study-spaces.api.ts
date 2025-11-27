// frontend/src/services/api/study-spaces.api.ts
/**
 * Endpoints de gestión de espacios de estudio.
 */
import apiClient from './client';
import type {
  StudySpaceCreate,
  StudySpaceUpdate,
  StudySpaceResponse,
  StudySpaceDetailResponse,
  StudySpaceListResponse,
  StudySpaceListWithStatsResponse,
  AddResourceRequest,
  StudySpaceStatsResponse,
  QuizListResponse,
  QuizResponse,
} from '@/types';

export async function createStudySpace(
  data: StudySpaceCreate
): Promise<StudySpaceResponse> {
  const response = await apiClient.post<StudySpaceResponse>(
    '/study-spaces',
    data
  );
  return response.data;
}

export async function listStudySpaces(
  skip: number = 0,
  limit: number = 100
): Promise<StudySpaceListResponse> {
  const response = await apiClient.get<StudySpaceListResponse>(
    '/study-spaces',
    {
      params: { skip, limit },
    }
  );
  return response.data;
}

export async function listStudySpacesWithStats(
  skip: number = 0,
  limit: number = 100
): Promise<StudySpaceListWithStatsResponse> {
  const response = await apiClient.get<StudySpaceListWithStatsResponse>(
    '/study-spaces',
    {
      params: { skip, limit, include_stats: true },
    }
  );
  return response.data;
}

export async function getStudySpace(
  spaceId: string
): Promise<StudySpaceDetailResponse> {
  const response = await apiClient.get<StudySpaceDetailResponse>(
    `/study-spaces/${spaceId}`
  );
  return response.data;
}

export async function updateStudySpace(
  spaceId: string,
  data: StudySpaceUpdate
): Promise<StudySpaceResponse> {
  const response = await apiClient.put<StudySpaceResponse>(
    `/study-spaces/${spaceId}`,
    data
  );
  return response.data;
}

export async function deleteStudySpace(
  spaceId: string,
  password: string
): Promise<void> {
  await apiClient.delete(`/study-spaces/${spaceId}`, {
    data: { password },
  });
}

export async function addSummaryToSpace(
  spaceId: string,
  data: AddResourceRequest
): Promise<void> {
  await apiClient.post(`/study-spaces/${spaceId}/summaries`, data);
}

export async function removeSummaryFromSpace(
  spaceId: string,
  summaryId: string
): Promise<void> {
  await apiClient.delete(`/study-spaces/${spaceId}/summaries/${summaryId}`);
}

export async function addDocumentToSpace(
  spaceId: string,
  data: AddResourceRequest
): Promise<void> {
  await apiClient.post(`/study-spaces/${spaceId}/documents`, data);
}

export async function removeDocumentFromSpace(
  spaceId: string,
  documentId: string
): Promise<void> {
  await apiClient.delete(`/study-spaces/${spaceId}/documents/${documentId}`);
}

export async function getStudySpaceStats(
  spaceId: string
): Promise<StudySpaceStatsResponse> {
  const response = await apiClient.get<StudySpaceStatsResponse>(
    `/study-spaces/${spaceId}/stats`
  );
  return response.data;
}

export async function getStudySpaceQuizzes(
  spaceId: string,
  skip: number = 0,
  limit: number = 100
): Promise<QuizListResponse> {
  const response = await apiClient.get<QuizListResponse>(
    `/study-spaces/${spaceId}/quizzes`,
    { params: { skip, limit } }
  );
  return response.data;
}

export async function createQuizFromSpace(
  spaceId: string,
  data: { max_questions?: number }
): Promise<QuizResponse> {
  const response = await apiClient.post<QuizResponse>(
    `/study-spaces/${spaceId}/quizzes`,
    data
  );
  return response.data;
}
