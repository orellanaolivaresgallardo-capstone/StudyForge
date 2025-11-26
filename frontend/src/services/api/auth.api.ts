// frontend/src/services/api/auth.api.ts
/**
 * Endpoints de autenticación y gestión de usuarios.
 */
import apiClient from './client';
import type { UserCreate, UserLogin, Token, UserDetailResponse } from '@/types';

export async function register(data: UserCreate): Promise<UserDetailResponse> {
  const response = await apiClient.post<UserDetailResponse>(
    '/auth/register',
    data
  );
  return response.data;
}

export async function login(credentials: UserLogin): Promise<Token> {
  const response = await apiClient.post<Token>('/auth/login', credentials);
  return response.data;
}

export async function getCurrentUser(): Promise<UserDetailResponse> {
  const response = await apiClient.get<UserDetailResponse>('/auth/me');
  return response.data;
}
