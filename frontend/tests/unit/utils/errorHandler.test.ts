import { describe, it, expect } from 'vitest'
import { getErrorMessage, parseError } from '@/utils/errorHandler'
import { AxiosError } from 'axios'

describe('errorHandler', () => {
  describe('getErrorMessage', () => {
    it('debe retornar mensaje por defecto cuando no hay error', () => {
      expect(getErrorMessage(null)).toBe('Ha ocurrido un error desconocido')
      expect(getErrorMessage(undefined)).toBe('Ha ocurrido un error desconocido')
    })

    it('debe extraer detail de respuesta FastAPI', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: { detail: 'Credenciales inválidas' },
          status: 401,
        },
      } as AxiosError

      expect(getErrorMessage(error)).toBe('Credenciales inválidas')
    })

    it('debe extraer message de respuesta cuando no hay detail', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: { message: 'Usuario no encontrado' },
          status: 404,
        },
      } as AxiosError

      expect(getErrorMessage(error)).toBe('Usuario no encontrado')
    })

    it('debe retornar mensaje genérico para código 400', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {},
          status: 400,
        },
      } as AxiosError

      expect(getErrorMessage(error)).toBe('Solicitud inválida. Verifica los datos ingresados.')
    })

    it('debe retornar mensaje genérico para código 401', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {},
          status: 401,
        },
      } as AxiosError

      expect(getErrorMessage(error)).toBe('No estás autenticado. Inicia sesión nuevamente.')
    })

    it('debe retornar mensaje genérico para código 403', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {},
          status: 403,
        },
      } as AxiosError

      expect(getErrorMessage(error)).toBe('No tienes permiso para realizar esta acción.')
    })

    it('debe retornar mensaje genérico para código 404', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {},
          status: 404,
        },
      } as AxiosError

      expect(getErrorMessage(error)).toBe('El recurso solicitado no fue encontrado.')
    })

    it('debe retornar mensaje genérico para código 409', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {},
          status: 409,
        },
      } as AxiosError

      expect(getErrorMessage(error)).toBe('Ya existe un recurso con esos datos.')
    })

    it('debe retornar mensaje genérico para código 422', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {},
          status: 422,
        },
      } as AxiosError

      expect(getErrorMessage(error)).toBe('Datos de validación incorrectos.')
    })

    it('debe retornar mensaje genérico para código 500', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {},
          status: 500,
        },
      } as AxiosError

      expect(getErrorMessage(error)).toBe('Error del servidor. Intenta nuevamente más tarde.')
    })

    it('debe retornar mensaje de error de Axios cuando no hay respuesta del servidor', () => {
      const error = {
        isAxiosError: true,
        message: 'Network Error',
      } as AxiosError

      expect(getErrorMessage(error)).toBe('Network Error')
    })

    it('debe retornar mensaje por defecto cuando no hay error.message', () => {
      const error = {
        isAxiosError: true,
      } as AxiosError

      expect(getErrorMessage(error)).toBe('Error de conexión con el servidor.')
    })

    it('debe manejar Error estándar de JavaScript', () => {
      const error = new Error('Algo salió mal')
      expect(getErrorMessage(error)).toBe('Algo salió mal')
    })

    it('debe manejar objetos desconocidos', () => {
      const error = { random: 'object' }
      expect(getErrorMessage(error)).toBe('Ha ocurrido un error inesperado')
    })

    it('debe manejar strings como error', () => {
      const error = 'String error'
      expect(getErrorMessage(error)).toBe('Ha ocurrido un error inesperado')
    })

    it('debe priorizar detail sobre message', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {
            detail: 'Mensaje de detail',
            message: 'Mensaje de message',
          },
          status: 400,
        },
      } as AxiosError

      expect(getErrorMessage(error)).toBe('Mensaje de detail')
    })

    it('debe convertir detail a string si no lo es', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {
            detail: 12345,
          },
          status: 400,
        },
      } as AxiosError

      expect(getErrorMessage(error)).toBe('12345')
    })
  })

  describe('parseError', () => {
    it('debe retornar ApiError con mensaje y statusCode para AxiosError', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: { detail: 'Error específico' },
          status: 400,
        },
      } as AxiosError

      const result = parseError(error)

      expect(result).toEqual({
        message: 'Error específico',
        statusCode: 400,
        detail: 'Error específico',
      })
    })

    it('debe retornar ApiError sin statusCode para errores no-Axios', () => {
      const error = new Error('Error genérico')
      const result = parseError(error)

      expect(result).toEqual({
        message: 'Error genérico',
      })
    })

    it('debe retornar detail como undefined cuando no existe', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {},
          status: 500,
        },
      } as AxiosError

      const result = parseError(error)

      expect(result).toEqual({
        message: 'Error del servidor. Intenta nuevamente más tarde.',
        statusCode: 500,
        detail: undefined,
      })
    })

    it('debe manejar null como error', () => {
      const result = parseError(null as any)

      expect(result).toEqual({
        message: 'Ha ocurrido un error desconocido',
      })
    })

    it('debe convertir detail a string en parseError', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: { detail: { nested: 'object' } },
          status: 400,
        },
      } as AxiosError

      const result = parseError(error)

      expect(typeof result.detail).toBe('string')
      expect(result.detail).toBe('[object Object]')
    })
  })
})
