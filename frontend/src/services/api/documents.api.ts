// frontend/src/services/api/documents.api.ts
/**
 * Endpoints de gestión de documentos.
 */
import apiClient from './client';
import type {
  DocumentResponse,
  DocumentDetailResponse,
  DocumentListResponse,
  DocumentUpdateTitle,
  StorageInfo,
} from '@/types';

export async function uploadDocument(
  file: File,
  studySpaceIds: string[], // Al menos un espacio requerido
  title?: string
): Promise<DocumentResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('study_space_ids', studySpaceIds.join(','));
  if (title) {
    formData.append('title', title);
  }

  const response = await apiClient.post<DocumentResponse>(
    '/documents',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

export async function listDocuments(
  skip: number = 0,
  limit: number = 100
): Promise<DocumentListResponse> {
  const response = await apiClient.get<DocumentListResponse>('/documents', {
    params: { skip, limit },
  });
  return response.data;
}

export async function getDocument(
  documentId: string
): Promise<DocumentDetailResponse> {
  const response = await apiClient.get<DocumentDetailResponse>(
    `/documents/${documentId}`
  );
  return response.data;
}

export async function updateDocumentTitle(
  documentId: string,
  data: DocumentUpdateTitle
): Promise<DocumentResponse> {
  const response = await apiClient.patch<DocumentResponse>(
    `/documents/${documentId}`,
    data
  );
  return response.data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  await apiClient.delete(`/documents/${documentId}`);
}

export async function getStorageInfo(): Promise<StorageInfo> {
  const response = await apiClient.get<StorageInfo>('/documents/storage');
  return response.data;
}
