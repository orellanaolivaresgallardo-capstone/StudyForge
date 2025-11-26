/**
 * Tipos relacionados con autenticación y usuarios
 */

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface UserDetailResponse extends UserResponse {
  storage_quota_bytes: number;
  storage_used_bytes: number;
  storage_available_bytes: number;
  storage_usage_percentage: number;
  max_documents_per_summary: number;
  max_file_size_bytes: number;
}

export interface UserCreate {
  email: string;
  username: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}
