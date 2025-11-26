// frontend/src/services/api/client.ts
/**
 * Cliente API base con configuración de axios, interceptors y gestión de tokens.
 */
import axios, { AxiosInstance, AxiosError } from "axios";

// ==================== CONFIGURACIÓN ====================

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE as string | undefined) ||
  "http://localhost:8000";

const TOKEN_STORAGE_KEY = "sf_token";

// ==================== AXIOS INSTANCE ====================

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token JWT a todas las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejo de errores 401 (token expirado)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado, limpiar y redirigir a login
      clearToken();
      // Solo redirigir si no estamos ya en login/signup
      if (
        !window.location.pathname.includes("/login") &&
        !window.location.pathname.includes("/signup")
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ==================== TOKEN MANAGEMENT ====================

export function getToken(): string | null {
  return (
    localStorage.getItem(TOKEN_STORAGE_KEY) ||
    sessionStorage.getItem(TOKEN_STORAGE_KEY)
  );
}

export function setToken(token: string, remember: boolean = true): void {
  if (remember) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } else {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

// ==================== EXPORT ====================

export default apiClient;
