// frontend/src/services/api/summaries.api.ts
/**
 * Endpoints de gestión de resúmenes.
 */
import apiClient from './client';
import type {
  SummaryResponse,
  SummaryDetailResponse,
  SummaryListResponse,
  SummaryCreateFromDocuments,
  ExpertiseLevel,
} from '@/types';

export async function uploadAndCreateSummary(
  file: File,
  expertiseLevel: ExpertiseLevel,
  title?: string
): Promise<SummaryResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('expertise_level', expertiseLevel);
  if (title) {
    formData.append('title', title);
  }

  const response = await apiClient.post<SummaryResponse>(
    '/summaries/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

export async function createSummaryFromDocuments(
  data: SummaryCreateFromDocuments
): Promise<SummaryResponse> {
  const response = await apiClient.post<SummaryResponse>(
    '/summaries/from-documents',
    data
  );
  return response.data;
}

export async function listSummaries(
  skip: number = 0,
  limit: number = 100
): Promise<SummaryListResponse> {
  const response = await apiClient.get<SummaryListResponse>('/summaries', {
    params: { skip, limit },
  });
  return response.data;
}

export async function getSummary(
  summaryId: string
): Promise<SummaryDetailResponse> {
  const response = await apiClient.get<SummaryDetailResponse>(
    `/summaries/${summaryId}`
  );
  return response.data;
}

export async function deleteSummary(summaryId: string): Promise<void> {
  await apiClient.delete(`/summaries/${summaryId}`);
}
