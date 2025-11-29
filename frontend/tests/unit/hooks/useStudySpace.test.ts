import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useStudySpace } from '@/hooks/useStudySpace'
import * as apiModule from '@/services/api'
import type {
  StudySpaceDetailResponse,
  StudySpaceStatsResponse,
  QuizResponse,
  QuizListResponse,
  UserPerformance,
  RecentAttempt,
} from '@/types'

vi.mock('@/services/api', () => ({
  getStudySpace: vi.fn(),
  getStudySpaceStats: vi.fn(),
  getStudySpaceQuizzes: vi.fn(),
  getUserPerformance: vi.fn(),
}))

describe('useStudySpace', () => {
  const mockSpaceDetail: StudySpaceDetailResponse = {
    id: 'space-1',
    user_id: 'user-1',
    name: 'Matemáticas',
    description: 'Espacio de matemáticas',
    color: '#3B82F6',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    summaries: [],
    documents: [],
  }

  const mockStats: StudySpaceStatsResponse = {
    space_id: 'space-1',
    space_name: 'Matemáticas',
    num_documents: 5,
    num_summaries: 3,
    num_quizzes: 2,
    total_attempts: 10,
    avg_score: 85.5,
    best_score: 95.0,
  }

  const mockQuiz1: QuizResponse = {
    id: 'quiz-1',
    user_id: 'user-1',
    study_space_id: 'space-1',
    title: 'Quiz de Álgebra',
    difficulty_level: 2,
    num_questions: 10,
    num_attempts: 5,
    source_type: 'document',
    source_document_id: 'doc-1',
    source_summary_id: null,
    source_names: { document: 'algebra.pdf' },
    source_metadata: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockQuiz2: QuizResponse = {
    id: 'quiz-2',
    user_id: 'user-1',
    study_space_id: 'space-1',
    title: 'Quiz de Cálculo',
    difficulty_level: 3,
    num_questions: 15,
    num_attempts: 3,
    source_type: 'summary',
    source_document_id: null,
    source_summary_id: 'summary-1',
    source_names: { summary: 'Resumen de Cálculo' },
    source_metadata: null,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  }

  const mockQuizzesResponse: QuizListResponse = {
    items: [mockQuiz1, mockQuiz2],
    total: 2,
  }

  const mockRecentAttempt: RecentAttempt = {
    attempt_id: 'attempt-1',
    quiz_id: 'quiz-1',
    quiz_title: 'Quiz de Álgebra',
    difficulty_level: 2,
    score: 85.0,
    completed_at: '2024-01-15T10:00:00Z',
    study_space_id: 'space-1',
  }

  const mockPerformance: UserPerformance = {
    recent_attempts: [mockRecentAttempt],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Estado inicial', () => {
    it('debe tener estado inicial correcto con spaceId undefined', () => {
      const { result } = renderHook(() => useStudySpace(undefined))

      expect(result.current.space).toBeNull()
      expect(result.current.stats).toBeNull()
      expect(result.current.quizzes).toEqual([])
      expect(result.current.performance).toBeNull()
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeNull()
      expect(result.current.refreshSpace).toBeInstanceOf(Function)
      expect(result.current.refreshStats).toBeInstanceOf(Function)
      expect(result.current.refreshQuizzes).toBeInstanceOf(Function)
      expect(result.current.refreshAll).toBeInstanceOf(Function)
    })

    it('NO debe cargar datos si spaceId es undefined', async () => {
      renderHook(() => useStudySpace(undefined))

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(apiModule.getStudySpace).not.toHaveBeenCalled()
      expect(apiModule.getStudySpaceStats).not.toHaveBeenCalled()
      expect(apiModule.getStudySpaceQuizzes).not.toHaveBeenCalled()
      expect(apiModule.getUserPerformance).not.toHaveBeenCalled()
    })
  })

  describe('Carga automática con spaceId', () => {
    it('debe cargar todos los datos al montar con spaceId válido', async () => {
      vi.mocked(apiModule.getStudySpace).mockResolvedValue(mockSpaceDetail)
      vi.mocked(apiModule.getStudySpaceStats).mockResolvedValue(mockStats)
      vi.mocked(apiModule.getStudySpaceQuizzes).mockResolvedValue(mockQuizzesResponse)
      vi.mocked(apiModule.getUserPerformance).mockResolvedValue(mockPerformance)

      const { result } = renderHook(() => useStudySpace('space-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(apiModule.getStudySpace).toHaveBeenCalledWith('space-1')
      expect(apiModule.getStudySpaceStats).toHaveBeenCalledWith('space-1')
      expect(apiModule.getStudySpaceQuizzes).toHaveBeenCalledWith('space-1')
      expect(apiModule.getUserPerformance).toHaveBeenCalledWith(10)

      expect(result.current.space).toEqual(mockSpaceDetail)
      expect(result.current.stats).toEqual(mockStats)
      expect(result.current.quizzes).toEqual([mockQuiz1, mockQuiz2])
      expect(result.current.performance).toEqual(mockPerformance)
      expect(result.current.error).toBeNull()
    })

    it('debe llamar las 4 APIs en paralelo con Promise.all', async () => {
      vi.mocked(apiModule.getStudySpace).mockResolvedValue(mockSpaceDetail)
      vi.mocked(apiModule.getStudySpaceStats).mockResolvedValue(mockStats)
      vi.mocked(apiModule.getStudySpaceQuizzes).mockResolvedValue(mockQuizzesResponse)
      vi.mocked(apiModule.getUserPerformance).mockResolvedValue(mockPerformance)

      renderHook(() => useStudySpace('space-1'))

      await waitFor(() => {
        expect(apiModule.getStudySpace).toHaveBeenCalled()
      })

      // Todas deben ser llamadas en paralelo
      expect(apiModule.getStudySpace).toHaveBeenCalledTimes(1)
      expect(apiModule.getStudySpaceStats).toHaveBeenCalledTimes(1)
      expect(apiModule.getStudySpaceQuizzes).toHaveBeenCalledTimes(1)
      expect(apiModule.getUserPerformance).toHaveBeenCalledTimes(1)
    })

    it('debe establecer isLoading=true durante la carga', async () => {
      let resolveSpace: (value: StudySpaceDetailResponse) => void
      const spacePromise = new Promise<StudySpaceDetailResponse>((resolve) => {
        resolveSpace = resolve
      })

      vi.mocked(apiModule.getStudySpace).mockReturnValue(spacePromise)
      vi.mocked(apiModule.getStudySpaceStats).mockResolvedValue(mockStats)
      vi.mocked(apiModule.getStudySpaceQuizzes).mockResolvedValue(mockQuizzesResponse)
      vi.mocked(apiModule.getUserPerformance).mockResolvedValue(mockPerformance)

      const { result } = renderHook(() => useStudySpace('space-1'))

      // Durante la carga
      expect(result.current.isLoading).toBe(true)

      // Resolver
      act(() => {
        resolveSpace!(mockSpaceDetail)
      })

      // Después de la carga
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('Manejo de errores', () => {
    it('debe manejar error en getStudySpace y establecer error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Suppress unhandled promise rejection from loadSpace throwing error
      const unhandledRejectionHandler = () => {}
      process.on('unhandledRejection', unhandledRejectionHandler)

      vi.mocked(apiModule.getStudySpace).mockRejectedValue(new Error('Space not found'))
      vi.mocked(apiModule.getStudySpaceStats).mockResolvedValue(mockStats)
      vi.mocked(apiModule.getStudySpaceQuizzes).mockResolvedValue(mockQuizzesResponse)
      vi.mocked(apiModule.getUserPerformance).mockResolvedValue(mockPerformance)

      const { result } = renderHook(() => useStudySpace('space-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('No se pudo cargar el espacio de estudio')
      expect(result.current.space).toBeNull()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading study space:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
      process.off('unhandledRejection', unhandledRejectionHandler)
    })

    it('debe manejar error en getStudySpaceStats sin establecer error global', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(apiModule.getStudySpace).mockResolvedValue(mockSpaceDetail)
      vi.mocked(apiModule.getStudySpaceStats).mockRejectedValue(new Error('Stats error'))
      vi.mocked(apiModule.getStudySpaceQuizzes).mockResolvedValue(mockQuizzesResponse)
      vi.mocked(apiModule.getUserPerformance).mockResolvedValue(mockPerformance)

      const { result } = renderHook(() => useStudySpace('space-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Stats falló pero no establece error global
      expect(result.current.error).toBeNull()
      expect(result.current.stats).toBeNull()
      // Otros datos se cargan normalmente
      expect(result.current.space).toEqual(mockSpaceDetail)
      expect(result.current.quizzes).toEqual([mockQuiz1, mockQuiz2])

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading stats:', expect.any(Error))

      consoleErrorSpy.mockRestore()
    })

    it('debe manejar error en getStudySpaceQuizzes sin establecer error global', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(apiModule.getStudySpace).mockResolvedValue(mockSpaceDetail)
      vi.mocked(apiModule.getStudySpaceStats).mockResolvedValue(mockStats)
      vi.mocked(apiModule.getStudySpaceQuizzes).mockRejectedValue(new Error('Quizzes error'))
      vi.mocked(apiModule.getUserPerformance).mockResolvedValue(mockPerformance)

      const { result } = renderHook(() => useStudySpace('space-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeNull()
      expect(result.current.quizzes).toEqual([])
      expect(result.current.space).toEqual(mockSpaceDetail)
      expect(result.current.stats).toEqual(mockStats)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading quizzes:', expect.any(Error))

      consoleErrorSpy.mockRestore()
    })

    it('debe manejar error en getUserPerformance sin establecer error global', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(apiModule.getStudySpace).mockResolvedValue(mockSpaceDetail)
      vi.mocked(apiModule.getStudySpaceStats).mockResolvedValue(mockStats)
      vi.mocked(apiModule.getStudySpaceQuizzes).mockResolvedValue(mockQuizzesResponse)
      vi.mocked(apiModule.getUserPerformance).mockRejectedValue(
        new Error('Performance error')
      )

      const { result } = renderHook(() => useStudySpace('space-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeNull()
      expect(result.current.performance).toBeNull()
      expect(result.current.space).toEqual(mockSpaceDetail)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading performance:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('refreshSpace', () => {
    it('debe recargar solo el espacio de estudio', async () => {
      vi.mocked(apiModule.getStudySpace).mockResolvedValue(mockSpaceDetail)
      vi.mocked(apiModule.getStudySpaceStats).mockResolvedValue(mockStats)
      vi.mocked(apiModule.getStudySpaceQuizzes).mockResolvedValue(mockQuizzesResponse)
      vi.mocked(apiModule.getUserPerformance).mockResolvedValue(mockPerformance)

      const { result } = renderHook(() => useStudySpace('space-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      vi.clearAllMocks()

      const updatedSpace = { ...mockSpaceDetail, name: 'Matemáticas Avanzadas' }
      vi.mocked(apiModule.getStudySpace).mockResolvedValue(updatedSpace)

      await act(async () => {
        await result.current.refreshSpace()
      })

      expect(apiModule.getStudySpace).toHaveBeenCalledWith('space-1')
      expect(apiModule.getStudySpace).toHaveBeenCalledTimes(1)
      // Otras APIs NO deben ser llamadas
      expect(apiModule.getStudySpaceStats).not.toHaveBeenCalled()
      expect(apiModule.getStudySpaceQuizzes).not.toHaveBeenCalled()
      expect(apiModule.getUserPerformance).not.toHaveBeenCalled()

      expect(result.current.space).toEqual(updatedSpace)
    })

    it('NO debe hacer nada si spaceId es undefined', async () => {
      const { result } = renderHook(() => useStudySpace(undefined))

      await act(async () => {
        await result.current.refreshSpace()
      })

      expect(apiModule.getStudySpace).not.toHaveBeenCalled()
    })
  })

  describe('refreshStats', () => {
    it('debe recargar solo las estadísticas', async () => {
      vi.mocked(apiModule.getStudySpace).mockResolvedValue(mockSpaceDetail)
      vi.mocked(apiModule.getStudySpaceStats).mockResolvedValue(mockStats)
      vi.mocked(apiModule.getStudySpaceQuizzes).mockResolvedValue(mockQuizzesResponse)
      vi.mocked(apiModule.getUserPerformance).mockResolvedValue(mockPerformance)

      const { result } = renderHook(() => useStudySpace('space-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      vi.clearAllMocks()

      const updatedStats = { ...mockStats, avg_score: 90.0 }
      vi.mocked(apiModule.getStudySpaceStats).mockResolvedValue(updatedStats)

      await act(async () => {
        await result.current.refreshStats()
      })

      expect(apiModule.getStudySpaceStats).toHaveBeenCalledWith('space-1')
      expect(apiModule.getStudySpaceStats).toHaveBeenCalledTimes(1)
      expect(apiModule.getStudySpace).not.toHaveBeenCalled()
      expect(apiModule.getStudySpaceQuizzes).not.toHaveBeenCalled()
      expect(apiModule.getUserPerformance).not.toHaveBeenCalled()

      expect(result.current.stats).toEqual(updatedStats)
    })

    it('NO debe hacer nada si spaceId es undefined', async () => {
      const { result } = renderHook(() => useStudySpace(undefined))

      await act(async () => {
        await result.current.refreshStats()
      })

      expect(apiModule.getStudySpaceStats).not.toHaveBeenCalled()
    })
  })

  describe('refreshQuizzes', () => {
    it('debe recargar solo los quizzes', async () => {
      vi.mocked(apiModule.getStudySpace).mockResolvedValue(mockSpaceDetail)
      vi.mocked(apiModule.getStudySpaceStats).mockResolvedValue(mockStats)
      vi.mocked(apiModule.getStudySpaceQuizzes).mockResolvedValue(mockQuizzesResponse)
      vi.mocked(apiModule.getUserPerformance).mockResolvedValue(mockPerformance)

      const { result } = renderHook(() => useStudySpace('space-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      vi.clearAllMocks()

      const updatedQuizzesResponse: QuizListResponse = {
        items: [mockQuiz1],
        total: 1,
      }
      vi.mocked(apiModule.getStudySpaceQuizzes).mockResolvedValue(updatedQuizzesResponse)

      await act(async () => {
        await result.current.refreshQuizzes()
      })

      expect(apiModule.getStudySpaceQuizzes).toHaveBeenCalledWith('space-1')
      expect(apiModule.getStudySpaceQuizzes).toHaveBeenCalledTimes(1)
      expect(apiModule.getStudySpace).not.toHaveBeenCalled()
      expect(apiModule.getStudySpaceStats).not.toHaveBeenCalled()
      expect(apiModule.getUserPerformance).not.toHaveBeenCalled()

      expect(result.current.quizzes).toEqual([mockQuiz1])
    })

    it('NO debe hacer nada si spaceId es undefined', async () => {
      const { result } = renderHook(() => useStudySpace(undefined))

      await act(async () => {
        await result.current.refreshQuizzes()
      })

      expect(apiModule.getStudySpaceQuizzes).not.toHaveBeenCalled()
    })
  })

  describe('refreshAll', () => {
    it('debe recargar todos los datos', async () => {
      vi.mocked(apiModule.getStudySpace).mockResolvedValue(mockSpaceDetail)
      vi.mocked(apiModule.getStudySpaceStats).mockResolvedValue(mockStats)
      vi.mocked(apiModule.getStudySpaceQuizzes).mockResolvedValue(mockQuizzesResponse)
      vi.mocked(apiModule.getUserPerformance).mockResolvedValue(mockPerformance)

      const { result } = renderHook(() => useStudySpace('space-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      vi.clearAllMocks()

      const updatedSpace = { ...mockSpaceDetail, name: 'Física' }
      const updatedStats = { ...mockStats, avg_score: 95.0 }

      vi.mocked(apiModule.getStudySpace).mockResolvedValue(updatedSpace)
      vi.mocked(apiModule.getStudySpaceStats).mockResolvedValue(updatedStats)
      vi.mocked(apiModule.getStudySpaceQuizzes).mockResolvedValue(mockQuizzesResponse)
      vi.mocked(apiModule.getUserPerformance).mockResolvedValue(mockPerformance)

      await act(async () => {
        await result.current.refreshAll()
      })

      // Todas las APIs deben ser llamadas
      expect(apiModule.getStudySpace).toHaveBeenCalledWith('space-1')
      expect(apiModule.getStudySpaceStats).toHaveBeenCalledWith('space-1')
      expect(apiModule.getStudySpaceQuizzes).toHaveBeenCalledWith('space-1')
      expect(apiModule.getUserPerformance).toHaveBeenCalledWith(10)

      expect(result.current.space).toEqual(updatedSpace)
      expect(result.current.stats).toEqual(updatedStats)
    })

    it('debe establecer isLoading=true durante refreshAll', async () => {
      vi.mocked(apiModule.getStudySpace).mockResolvedValue(mockSpaceDetail)
      vi.mocked(apiModule.getStudySpaceStats).mockResolvedValue(mockStats)
      vi.mocked(apiModule.getStudySpaceQuizzes).mockResolvedValue(mockQuizzesResponse)
      vi.mocked(apiModule.getUserPerformance).mockResolvedValue(mockPerformance)

      const { result } = renderHook(() => useStudySpace('space-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let resolveSpace: (value: StudySpaceDetailResponse) => void
      const spacePromise = new Promise<StudySpaceDetailResponse>((resolve) => {
        resolveSpace = resolve
      })

      vi.mocked(apiModule.getStudySpace).mockReturnValue(spacePromise)
      vi.mocked(apiModule.getStudySpaceStats).mockResolvedValue(mockStats)
      vi.mocked(apiModule.getStudySpaceQuizzes).mockResolvedValue(mockQuizzesResponse)
      vi.mocked(apiModule.getUserPerformance).mockResolvedValue(mockPerformance)

      // Iniciar refreshAll
      act(() => {
        result.current.refreshAll()
      })

      // Durante refresh
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Resolver
      act(() => {
        resolveSpace!(mockSpaceDetail)
      })

      // Después de refresh
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('NO debe hacer nada si spaceId es undefined', async () => {
      const { result } = renderHook(() => useStudySpace(undefined))

      await act(async () => {
        await result.current.refreshAll()
      })

      expect(apiModule.getStudySpace).not.toHaveBeenCalled()
      expect(apiModule.getStudySpaceStats).not.toHaveBeenCalled()
      expect(apiModule.getStudySpaceQuizzes).not.toHaveBeenCalled()
      expect(apiModule.getUserPerformance).not.toHaveBeenCalled()
    })
  })

  describe('Cambio de spaceId', () => {
    it('debe recargar datos cuando spaceId cambia', async () => {
      vi.mocked(apiModule.getStudySpace).mockResolvedValue(mockSpaceDetail)
      vi.mocked(apiModule.getStudySpaceStats).mockResolvedValue(mockStats)
      vi.mocked(apiModule.getStudySpaceQuizzes).mockResolvedValue(mockQuizzesResponse)
      vi.mocked(apiModule.getUserPerformance).mockResolvedValue(mockPerformance)

      const { result, rerender } = renderHook(
        ({ id }) => useStudySpace(id),
        { initialProps: { id: 'space-1' } }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(apiModule.getStudySpace).toHaveBeenCalledWith('space-1')
      vi.clearAllMocks()

      const newSpace = { ...mockSpaceDetail, id: 'space-2', name: 'Historia' }
      vi.mocked(apiModule.getStudySpace).mockResolvedValue(newSpace)

      // Cambiar spaceId
      rerender({ id: 'space-2' })

      await waitFor(() => {
        expect(apiModule.getStudySpace).toHaveBeenCalledWith('space-2')
      })

      await waitFor(() => {
        expect(result.current.space).toEqual(newSpace)
      })
    })

    it('debe limpiar error al cambiar a spaceId válido después de error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Suppress unhandled promise rejection from loadSpace throwing error
      const unhandledRejectionHandler = () => {}
      process.on('unhandledRejection', unhandledRejectionHandler)

      // Primera carga: error
      vi.mocked(apiModule.getStudySpace).mockRejectedValue(new Error('Not found'))
      vi.mocked(apiModule.getStudySpaceStats).mockResolvedValue(mockStats)
      vi.mocked(apiModule.getStudySpaceQuizzes).mockResolvedValue(mockQuizzesResponse)
      vi.mocked(apiModule.getUserPerformance).mockResolvedValue(mockPerformance)

      const { result, rerender } = renderHook(
        ({ id }) => useStudySpace(id),
        { initialProps: { id: 'invalid-id' } }
      )

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })

      // Cambiar a spaceId válido
      vi.mocked(apiModule.getStudySpace).mockResolvedValue(mockSpaceDetail)

      rerender({ id: 'space-1' })

      await waitFor(() => {
        expect(result.current.error).toBeNull()
        expect(result.current.space).toEqual(mockSpaceDetail)
      })

      consoleErrorSpy.mockRestore()
      process.off('unhandledRejection', unhandledRejectionHandler)
    })
  })

  describe('useCallback estabilidad', () => {
    it('debe mantener la misma referencia de funciones entre renders', async () => {
      vi.mocked(apiModule.getStudySpace).mockResolvedValue(mockSpaceDetail)
      vi.mocked(apiModule.getStudySpaceStats).mockResolvedValue(mockStats)
      vi.mocked(apiModule.getStudySpaceQuizzes).mockResolvedValue(mockQuizzesResponse)
      vi.mocked(apiModule.getUserPerformance).mockResolvedValue(mockPerformance)

      const { result, rerender } = renderHook(() => useStudySpace('space-1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const firstRefreshSpace = result.current.refreshSpace
      const firstRefreshStats = result.current.refreshStats
      const firstRefreshQuizzes = result.current.refreshQuizzes
      const firstRefreshAll = result.current.refreshAll

      // Forzar re-render
      rerender()

      // Las funciones deben ser las mismas
      expect(result.current.refreshSpace).toBe(firstRefreshSpace)
      expect(result.current.refreshStats).toBe(firstRefreshStats)
      expect(result.current.refreshQuizzes).toBe(firstRefreshQuizzes)
      expect(result.current.refreshAll).toBe(firstRefreshAll)
    })
  })
})
