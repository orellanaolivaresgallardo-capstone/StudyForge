/**
 * Tipos relacionados con documentos
 */

export interface DocumentResponse {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  created_at: string;
  updated_at: string;
  study_space_names: string[];
}

export interface DocumentDetailResponse extends DocumentResponse {
  file_content: string; // base64
  extracted_text: string | null;
}

export interface DocumentListResponse {
  items: DocumentResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface DocumentUpdateTitle {
  title: string;
}

export interface StorageInfo {
  storage_quota_bytes: number;
  storage_used_bytes: number;
  storage_available_bytes: number;
  storage_usage_percentage: number;
  total_documents: number;
}
