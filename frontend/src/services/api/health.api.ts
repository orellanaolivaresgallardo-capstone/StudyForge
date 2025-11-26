// frontend/src/services/api/health.api.ts
/**
 * Endpoints de health check.
 */
import apiClient from './client';
import type { HealthResponse } from '@/types';

export async function health(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
}
