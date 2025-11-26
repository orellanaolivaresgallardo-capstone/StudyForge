/**
 * Tipos relacionados con resúmenes
 */

import type { DocumentResponse } from './document.types';

export type ExpertiseLevel = "basico" | "medio" | "avanzado";

export interface KeyConceptItem {
  concept: string;
  definition: string;
}

export interface DeletedDocumentInfo {
  id: string;
  title: string;
  file_name: string;
}

export interface SummaryResponse {
  id: string;
  user_id: string;
  title: string;
  content: Record<string, any>; // JSONB
  expertise_level: ExpertiseLevel;
  topics: string[];
  key_concepts: KeyConceptItem[];
  deleted_documents_info?: DeletedDocumentInfo[] | null;
  created_at: string;
  updated_at: string;
  study_space_names: string[];
}

export interface SummaryDetailResponse extends SummaryResponse {
  documents: DocumentResponse[];
}

export interface SummaryListResponse {
  items: SummaryResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface SummaryCreateFromDocuments {
  document_ids: string[];
  expertise_level: ExpertiseLevel;
  title?: string;
}
