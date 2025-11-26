/**
 * Utilidad para extraer mensajes de error consistentes de respuestas HTTP
 */

import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  statusCode?: number;
  detail?: string;
}

/**
 * Extrae mensaje de error de una excepción de Axios
 *
 * @param error - Error de Axios
 * @returns Mensaje de error legible para el usuario
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return "Ha ocurrido un error desconocido";
  }

  // Si es un AxiosError
  if (isAxiosError(error)) {
    // 1. Prioridad: mensaje en response.data.detail (backend FastAPI)
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }

    // 2. Mensaje en response.data.message
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    // 3. Mensajes por código de estado
    switch (error.response?.status) {
      case 400:
        return "Solicitud inválida. Verifica los datos ingresados.";
      case 401:
        return "No estás autenticado. Inicia sesión nuevamente.";
      case 403:
        return "No tienes permiso para realizar esta acción.";
      case 404:
        return "El recurso solicitado no fue encontrado.";
      case 409:
        return "Ya existe un recurso con esos datos.";
      case 422:
        return "Datos de validación incorrectos.";
      case 500:
        return "Error del servidor. Intenta nuevamente más tarde.";
      default:
        return error.message || "Error de conexión con el servidor.";
    }
  }

  // Si es un Error estándar
  if (error instanceof Error) {
    return error.message;
  }

  // Fallback
  return "Ha ocurrido un error inesperado";
}

/**
 * Type guard para verificar si un error es AxiosError
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError === true;
}

/**
 * Extrae información detallada del error
 */
export function parseError(error: unknown): ApiError {
  const message = getErrorMessage(error);

  if (isAxiosError(error)) {
    return {
      message,
      statusCode: error.response?.status,
      detail: error.response?.data?.detail
    };
  }

  return { message };
}
