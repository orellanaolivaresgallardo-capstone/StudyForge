/**
 * Tipos relacionados con espacios de estudio
 */

import type { SummaryResponse } from './summary.types';
import type { DocumentResponse } from './document.types';

export interface StudySpaceCreate {
  name: string;
  description?: string | null;
  color?: string; // Hex color format #RRGGBB
}

export interface StudySpaceUpdate {
  name?: string | null;
  description?: string | null;
  color?: string | null; // Hex color format #RRGGBB
}

export interface StudySpaceResponse {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface StudySpaceDetailResponse extends StudySpaceResponse {
  summaries: SummaryResponse[];
  documents: DocumentResponse[];
}

export interface StudySpaceListResponse {
  items: StudySpaceResponse[];
  total: number;
}

export interface StudySpaceWithStatsResponse extends StudySpaceResponse {
  num_documents: number;
  num_summaries: number;
  num_quizzes: number;
  avg_score: number;
}

export interface StudySpaceListWithStatsResponse {
  items: StudySpaceWithStatsResponse[];
  total: number;
}

export interface AddResourceRequest {
  resource_id: string;
}

export interface DeleteSpaceRequest {
  password: string; // Contraseña del usuario para confirmar eliminación
}

export interface StudySpaceStatsResponse {
  space_id: string;
  space_name: string;
  num_documents: number;
  num_summaries: number;
  num_quizzes: number;
  total_attempts: number;
  avg_score: number;
  best_score: number;
}
