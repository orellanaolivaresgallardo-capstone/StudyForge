import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useStudySpacesData } from '@/hooks/useStudySpacesData'
import * as apiModule from '@/services/api'
import type { StudySpaceWithStatsResponse, StudySpaceListWithStatsResponse } from '@/types'

vi.mock('@/services/api', () => ({
  listStudySpacesWithStats: vi.fn(),
}))

describe('useStudySpacesData', () => {
  const mockSpace1: StudySpaceWithStatsResponse = {
    id: 'space-1',
    user_id: 'user-1',
    name: 'Matemáticas',
    description: 'Espacio de matemáticas',
    color: '#3B82F6',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    num_documents: 5,
    num_summaries: 3,
    num_quizzes: 2,
    avg_score: 85.5,
  }

  const mockSpace2: StudySpaceWithStatsResponse = {
    id: 'space-2',
    user_id: 'user-1',
    name: 'Historia',
    description: 'Espacio de historia',
    color: '#10B981',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    num_documents: 8,
    num_summaries: 5,
    num_quizzes: 4,
    avg_score: 92.0,
  }

  const mockResponse: StudySpaceListWithStatsResponse = {
    items: [mockSpace1, mockSpace2],
    total: 2,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Estado inicial y carga automática', () => {
    it('debe tener estado inicial correcto antes de cargar', () => {
      vi.mocked(apiModule.listStudySpacesWithStats).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { result } = renderHook(() => useStudySpacesData())

      expect(result.current.spaces).toEqual([])
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeNull()
      expect(result.current.refreshSpaces).toBeInstanceOf(Function)
      expect(result.current.removeSpace).toBeInstanceOf(Function)
    })

    it('debe cargar datos automáticamente al montar', async () => {
      vi.mocked(apiModule.listStudySpacesWithStats).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useStudySpacesData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(apiModule.listStudySpacesWithStats).toHaveBeenCalledTimes(1)
      expect(result.current.spaces).toEqual([mockSpace1, mockSpace2])
      expect(result.current.error).toBeNull()
    })

    it('debe mostrar isLoading=true durante la carga inicial', async () => {
      let resolvePromise: (value: StudySpaceListWithStatsResponse) => void
      const promise = new Promise<StudySpaceListWithStatsResponse>((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(apiModule.listStudySpacesWithStats).mockReturnValue(promise)

      const { result } = renderHook(() => useStudySpacesData())

      // Durante la carga
      expect(result.current.isLoading).toBe(true)
      expect(result.current.spaces).toEqual([])

      // Resolver la promesa
      act(() => {
        resolvePromise!(mockResponse)
      })

      // Después de la carga
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.spaces).toEqual([mockSpace1, mockSpace2])
      })
    })
  })

  describe('refreshSpaces - Caso exitoso', () => {
    it('debe recargar datos cuando se llama a refreshSpaces', async () => {
      const initialResponse: StudySpaceListWithStatsResponse = {
        items: [mockSpace1],
        total: 1,
      }

      const updatedResponse: StudySpaceListWithStatsResponse = {
        items: [mockSpace1, mockSpace2],
        total: 2,
      }

      vi.mocked(apiModule.listStudySpacesWithStats)
        .mockResolvedValueOnce(initialResponse)
        .mockResolvedValueOnce(updatedResponse)

      const { result } = renderHook(() => useStudySpacesData())

      // Esperar carga inicial
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.spaces).toEqual([mockSpace1])

      // Refresh manual
      await act(async () => {
        await result.current.refreshSpaces()
      })

      await waitFor(() => {
        expect(result.current.spaces).toEqual([mockSpace1, mockSpace2])
      })

      expect(apiModule.listStudySpacesWithStats).toHaveBeenCalledTimes(2)
    })

    it('debe establecer isLoading=true durante refreshSpaces', async () => {
      vi.mocked(apiModule.listStudySpacesWithStats).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useStudySpacesData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let resolvePromise: (value: StudySpaceListWithStatsResponse) => void
      const promise = new Promise<StudySpaceListWithStatsResponse>((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(apiModule.listStudySpacesWithStats).mockReturnValue(promise)

      // Iniciar refresh
      act(() => {
        result.current.refreshSpaces()
      })

      // Durante refresh
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Resolver
      act(() => {
        resolvePromise!(mockResponse)
      })

      // Después de refresh
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('debe limpiar error anterior en refresh exitoso', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Primera carga: error
      vi.mocked(apiModule.listStudySpacesWithStats).mockRejectedValueOnce(
        new Error('Network error')
      )

      const { result } = renderHook(() => useStudySpacesData())

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })

      // Segunda carga: éxito
      vi.mocked(apiModule.listStudySpacesWithStats).mockResolvedValueOnce(mockResponse)

      await act(async () => {
        await result.current.refreshSpaces()
      })

      await waitFor(() => {
        expect(result.current.error).toBeNull()
        expect(result.current.spaces).toEqual([mockSpace1, mockSpace2])
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('refreshSpaces - Caso de error', () => {
    it('debe manejar errores de la API', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(apiModule.listStudySpacesWithStats).mockRejectedValue(
        new Error('Network error')
      )

      const { result } = renderHook(() => useStudySpacesData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBe('No se pudieron cargar los espacios de estudio')
        expect(result.current.spaces).toEqual([])
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading study spaces:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })

    it('debe establecer isLoading=false después de error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(apiModule.listStudySpacesWithStats).mockRejectedValue(
        new Error('Server error')
      )

      const { result } = renderHook(() => useStudySpacesData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      consoleErrorSpy.mockRestore()
    })

    it('debe usar mensaje personalizado de error.response.data.detail si existe', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const customError = {
        response: {
          data: {
            detail: 'Error personalizado del servidor',
          },
        },
      }

      vi.mocked(apiModule.listStudySpacesWithStats).mockRejectedValue(customError)

      const { result } = renderHook(() => useStudySpacesData())

      await waitFor(() => {
        expect(result.current.error).toBe('Error personalizado del servidor')
      })

      consoleErrorSpy.mockRestore()
    })

    it('debe mantener datos anteriores si hay error en refresh', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Primera carga: éxito
      vi.mocked(apiModule.listStudySpacesWithStats).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useStudySpacesData())

      await waitFor(() => {
        expect(result.current.spaces).toEqual([mockSpace1, mockSpace2])
      })

      // Segunda carga: error
      vi.mocked(apiModule.listStudySpacesWithStats).mockRejectedValueOnce(
        new Error('Network error')
      )

      await act(async () => {
        await result.current.refreshSpaces()
      })

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
        // Datos anteriores se mantienen
        expect(result.current.spaces).toEqual([mockSpace1, mockSpace2])
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('removeSpace - Actualización optimista', () => {
    it('debe remover un espacio de la lista por ID', async () => {
      vi.mocked(apiModule.listStudySpacesWithStats).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useStudySpacesData())

      await waitFor(() => {
        expect(result.current.spaces).toEqual([mockSpace1, mockSpace2])
      })

      // Remover primer espacio
      act(() => {
        result.current.removeSpace('space-1')
      })

      expect(result.current.spaces).toEqual([mockSpace2])
    })

    it('debe remover múltiples espacios correctamente', async () => {
      vi.mocked(apiModule.listStudySpacesWithStats).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useStudySpacesData())

      await waitFor(() => {
        expect(result.current.spaces).toEqual([mockSpace1, mockSpace2])
      })

      // Remover primer espacio
      act(() => {
        result.current.removeSpace('space-1')
      })

      expect(result.current.spaces).toEqual([mockSpace2])

      // Remover segundo espacio
      act(() => {
        result.current.removeSpace('space-2')
      })

      expect(result.current.spaces).toEqual([])
    })

    it('NO debe afectar la lista si el ID no existe', async () => {
      vi.mocked(apiModule.listStudySpacesWithStats).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useStudySpacesData())

      await waitFor(() => {
        expect(result.current.spaces).toEqual([mockSpace1, mockSpace2])
      })

      // Intentar remover ID inexistente
      act(() => {
        result.current.removeSpace('non-existent-id')
      })

      // Lista sin cambios
      expect(result.current.spaces).toEqual([mockSpace1, mockSpace2])
    })

    it('debe funcionar correctamente con lista vacía', async () => {
      const emptyResponse: StudySpaceListWithStatsResponse = {
        items: [],
        total: 0,
      }

      vi.mocked(apiModule.listStudySpacesWithStats).mockResolvedValue(emptyResponse)

      const { result } = renderHook(() => useStudySpacesData())

      await waitFor(() => {
        expect(result.current.spaces).toEqual([])
      })

      // Intentar remover de lista vacía
      act(() => {
        result.current.removeSpace('some-id')
      })

      expect(result.current.spaces).toEqual([])
    })
  })

  describe('Integración completa', () => {
    it('debe manejar ciclo completo: carga → error → recuperación', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Carga inicial: éxito
      vi.mocked(apiModule.listStudySpacesWithStats).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useStudySpacesData())

      await waitFor(() => {
        expect(result.current.spaces).toEqual([mockSpace1, mockSpace2])
        expect(result.current.error).toBeNull()
      })

      // Refresh: error
      vi.mocked(apiModule.listStudySpacesWithStats).mockRejectedValueOnce(
        new Error('Temporary error')
      )

      await act(async () => {
        await result.current.refreshSpaces()
      })

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
        expect(result.current.spaces).toEqual([mockSpace1, mockSpace2])
      })

      // Refresh: recuperación exitosa
      const updatedSpace1 = { ...mockSpace1, num_quizzes: 5 }
      const updatedResponse: StudySpaceListWithStatsResponse = {
        items: [updatedSpace1, mockSpace2],
        total: 2,
      }

      vi.mocked(apiModule.listStudySpacesWithStats).mockResolvedValueOnce(updatedResponse)

      await act(async () => {
        await result.current.refreshSpaces()
      })

      await waitFor(() => {
        expect(result.current.error).toBeNull()
        expect(result.current.spaces).toEqual([updatedSpace1, mockSpace2])
      })

      consoleErrorSpy.mockRestore()
    })

    it('debe manejar refresh después de removeSpace', async () => {
      vi.mocked(apiModule.listStudySpacesWithStats).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useStudySpacesData())

      await waitFor(() => {
        expect(result.current.spaces).toEqual([mockSpace1, mockSpace2])
      })

      // Remover espacio
      act(() => {
        result.current.removeSpace('space-1')
      })

      expect(result.current.spaces).toEqual([mockSpace2])

      // Refresh (restaura todos los espacios desde API)
      await act(async () => {
        await result.current.refreshSpaces()
      })

      await waitFor(() => {
        expect(result.current.spaces).toEqual([mockSpace1, mockSpace2])
      })
    })
  })
})
