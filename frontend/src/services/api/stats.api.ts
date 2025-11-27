// frontend/src/services/api/stats.api.ts
/**
 * Endpoints de estadísticas de usuario.
 */
import apiClient from './client';
import type {
  UserPerformance,
  StatsSummary,
  StudySpaceStatsResponse,
} from '@/types';

export async function getUserPerformance(
  limit: number = 10
): Promise<UserPerformance> {
  const response = await apiClient.get<UserPerformance>('/stats/performance', {
    params: { limit },
  });
  return response.data;
}

export async function getStatsSummary(): Promise<StatsSummary> {
  const response = await apiClient.get<StatsSummary>('/stats/summary');
  return response.data;
}

export async function getProgressBySpace(): Promise<
  StudySpaceStatsResponse[]
> {
  const response = await apiClient.get<StudySpaceStatsResponse[]>(
    '/stats/progress-by-space'
  );
  return response.data;
}
