/**
 * Tipos relacionados con resúmenes
 */

import type { DocumentResponse } from './document.types';

export type ExpertiseLevel = "basico" | "medio" | "avanzado";

export interface KeyConceptItem {
  concept: string;
  definition: string;
}

// Estado del documento source (para tracking de documentos eliminados)
export type DocumentState = "active_in_space" | "removed_from_space" | "permanently_deleted";

export interface SummaryResponse {
  id: string;
  user_id: string;
  document_id: string | null; // FK al documento (nullable si fue eliminado)
  study_space_id: string; // FK al espacio de estudio (required, NOT NULL)
  title: string;
  content: Record<string, unknown>; // JSONB
  expertise_level: ExpertiseLevel;
  topics: string[];
  key_concepts: KeyConceptItem[];
  // Denormalized cache fields (para preservar info si documento se elimina)
  source_document_title: string | null;
  source_document_filename: string | null;
  document_state: DocumentState | null; // Estado del documento source
  created_at: string;
  updated_at: string;
}

export interface SummaryDetailResponse extends SummaryResponse {
  document: DocumentResponse | null;
}

export interface SummaryListResponse {
  items: SummaryResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface SummaryCreateFromDocuments {
  document_id: string; // Ahora es singular (un documento por resumen)
  study_space_id: string; // Required: espacio de estudio donde se creará el resumen
  expertise_level: ExpertiseLevel;
  title?: string;
}
