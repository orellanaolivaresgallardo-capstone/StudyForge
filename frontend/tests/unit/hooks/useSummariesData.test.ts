import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useSummariesData } from '@/hooks/useSummariesData'
import * as apiModule from '@/services/api'
import type {
  SummaryResponse,
  SummaryListResponse,
  DocumentResponse,
  DocumentListResponse,
  StudySpaceResponse,
  StudySpaceListResponse,
} from '@/types'

vi.mock('@/services/api', () => ({
  listSummaries: vi.fn(),
  listDocuments: vi.fn(),
  listStudySpaces: vi.fn(),
}))

describe('useSummariesData', () => {
  const mockSummary1: SummaryResponse = {
    id: 'summary-1',
    user_id: 'user-1',
    document_id: 'doc-1',
    study_space_id: 'space-1',
    title: 'Resumen de Matemáticas',
    content: { summary: 'Contenido del resumen' },
    expertise_level: 'medio',
    topics: ['álgebra', 'cálculo'],
    key_concepts: [{ concept: 'Derivadas', description: 'Concepto fundamental' }],
    source_document_title: 'documento1.pdf',
    source_document_filename: 'documento1.pdf',
    document_state: 'active_in_space',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockSummary2: SummaryResponse = {
    id: 'summary-2',
    user_id: 'user-1',
    document_id: 'doc-2',
    study_space_id: 'space-1',
    title: 'Resumen de Historia',
    content: { summary: 'Otro contenido' },
    expertise_level: 'basico',
    topics: ['guerra', 'paz'],
    key_concepts: [{ concept: 'Revolución', description: 'Cambio radical' }],
    source_document_title: 'documento2.pdf',
    source_document_filename: 'documento2.pdf',
    document_state: 'active_in_space',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  }

  const mockDocument1: DocumentResponse = {
    id: 'doc-1',
    user_id: 'user-1',
    title: 'Documento 1',
    file_name: 'documento1.pdf',
    file_type: 'application/pdf',
    file_size_bytes: 1024,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    study_space_names: ['Matemáticas'],
  }

  const mockDocument2: DocumentResponse = {
    id: 'doc-2',
    user_id: 'user-1',
    title: 'Documento 2',
    file_name: 'documento2.pdf',
    file_type: 'application/pdf',
    file_size_bytes: 2048,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    study_space_names: ['Historia'],
  }

  const mockSpace1: StudySpaceResponse = {
    id: 'space-1',
    user_id: 'user-1',
    name: 'Matemáticas',
    description: 'Espacio de matemáticas',
    color: '#3B82F6',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockSpace2: StudySpaceResponse = {
    id: 'space-2',
    user_id: 'user-1',
    name: 'Historia',
    description: 'Espacio de historia',
    color: '#10B981',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  }

  const mockSummariesResponse: SummaryListResponse = {
    items: [mockSummary1, mockSummary2],
    total: 2,
    skip: 0,
    limit: 100,
  }

  const mockDocumentsResponse: DocumentListResponse = {
    items: [mockDocument1, mockDocument2],
    total: 2,
    skip: 0,
    limit: 100,
  }

  const mockSpacesResponse: StudySpaceListResponse = {
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
      vi.mocked(apiModule.listSummaries).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { result } = renderHook(() => useSummariesData())

      expect(result.current.summaries).toEqual([])
      expect(result.current.documents).toEqual([])
      expect(result.current.studySpaces).toEqual([])
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeNull()
      expect(result.current.refreshSummaries).toBeInstanceOf(Function)
      expect(result.current.loadDocumentsAndSpaces).toBeInstanceOf(Function)
      expect(result.current.removeSummary).toBeInstanceOf(Function)
    })

    it('debe cargar summaries automáticamente al montar', async () => {
      vi.mocked(apiModule.listSummaries).mockResolvedValue(mockSummariesResponse)

      const { result } = renderHook(() => useSummariesData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(apiModule.listSummaries).toHaveBeenCalledTimes(1)
      expect(result.current.summaries).toEqual([mockSummary1, mockSummary2])
      expect(result.current.error).toBeNull()
    })

    it('debe mostrar isLoading=true durante la carga inicial', async () => {
      let resolvePromise: (value: SummaryListResponse) => void
      const promise = new Promise<SummaryListResponse>((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(apiModule.listSummaries).mockReturnValue(promise)

      const { result } = renderHook(() => useSummariesData())

      // Durante la carga
      expect(result.current.isLoading).toBe(true)
      expect(result.current.summaries).toEqual([])

      // Resolver la promesa
      act(() => {
        resolvePromise!(mockSummariesResponse)
      })

      // Después de la carga
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.summaries).toEqual([mockSummary1, mockSummary2])
      })
    })
  })

  describe('refreshSummaries - Caso exitoso', () => {
    it('debe recargar summaries cuando se llama a refreshSummaries', async () => {
      const initialResponse: SummaryListResponse = {
        ...mockSummariesResponse,
        items: [mockSummary1],
        total: 1,
      }

      const updatedResponse: SummaryListResponse = mockSummariesResponse

      vi.mocked(apiModule.listSummaries)
        .mockResolvedValueOnce(initialResponse)
        .mockResolvedValueOnce(updatedResponse)

      const { result } = renderHook(() => useSummariesData())

      // Esperar carga inicial
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.summaries).toEqual([mockSummary1])

      // Refresh manual
      await act(async () => {
        await result.current.refreshSummaries()
      })

      await waitFor(() => {
        expect(result.current.summaries).toEqual([mockSummary1, mockSummary2])
      })

      expect(apiModule.listSummaries).toHaveBeenCalledTimes(2)
    })

    it('debe establecer isLoading=true durante refreshSummaries', async () => {
      vi.mocked(apiModule.listSummaries).mockResolvedValue(mockSummariesResponse)

      const { result } = renderHook(() => useSummariesData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let resolvePromise: (value: SummaryListResponse) => void
      const promise = new Promise<SummaryListResponse>((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(apiModule.listSummaries).mockReturnValue(promise)

      // Iniciar refresh
      act(() => {
        result.current.refreshSummaries()
      })

      // Durante refresh
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Resolver
      act(() => {
        resolvePromise!(mockSummariesResponse)
      })

      // Después de refresh
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('debe limpiar error anterior en refresh exitoso', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Primera carga: error
      vi.mocked(apiModule.listSummaries).mockRejectedValueOnce(
        new Error('Network error')
      )

      const { result } = renderHook(() => useSummariesData())

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })

      // Segunda carga: éxito
      vi.mocked(apiModule.listSummaries).mockResolvedValueOnce(mockSummariesResponse)

      await act(async () => {
        await result.current.refreshSummaries()
      })

      await waitFor(() => {
        expect(result.current.error).toBeNull()
        expect(result.current.summaries).toEqual([mockSummary1, mockSummary2])
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('refreshSummaries - Caso de error', () => {
    it('debe manejar errores de la API', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(apiModule.listSummaries).mockRejectedValue(
        new Error('Network error')
      )

      const { result } = renderHook(() => useSummariesData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBe('Error al cargar los resúmenes')
        expect(result.current.summaries).toEqual([])
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading summaries:',
        expect.any(Error)
      )

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

      vi.mocked(apiModule.listSummaries).mockRejectedValue(customError)

      const { result } = renderHook(() => useSummariesData())

      await waitFor(() => {
        expect(result.current.error).toBe('Error personalizado del servidor')
      })

      consoleErrorSpy.mockRestore()
    })

    it('debe mantener datos anteriores si hay error en refresh', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Primera carga: éxito
      vi.mocked(apiModule.listSummaries).mockResolvedValueOnce(mockSummariesResponse)

      const { result } = renderHook(() => useSummariesData())

      await waitFor(() => {
        expect(result.current.summaries).toEqual([mockSummary1, mockSummary2])
      })

      // Segunda carga: error
      vi.mocked(apiModule.listSummaries).mockRejectedValueOnce(
        new Error('Network error')
      )

      await act(async () => {
        await result.current.refreshSummaries()
      })

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
        // Datos anteriores se mantienen
        expect(result.current.summaries).toEqual([mockSummary1, mockSummary2])
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('loadDocumentsAndSpaces - Caso exitoso', () => {
    it('debe cargar documents y spaces en paralelo', async () => {
      vi.mocked(apiModule.listSummaries).mockResolvedValue(mockSummariesResponse)
      vi.mocked(apiModule.listDocuments).mockResolvedValue(mockDocumentsResponse)
      vi.mocked(apiModule.listStudySpaces).mockResolvedValue(mockSpacesResponse)

      const { result } = renderHook(() => useSummariesData())

      // Esperar carga inicial de summaries
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Cargar documents y spaces
      await act(async () => {
        await result.current.loadDocumentsAndSpaces()
      })

      expect(apiModule.listDocuments).toHaveBeenCalledTimes(1)
      expect(apiModule.listStudySpaces).toHaveBeenCalledTimes(1)
      expect(result.current.documents).toEqual([mockDocument1, mockDocument2])
      expect(result.current.studySpaces).toEqual([mockSpace1, mockSpace2])
      expect(result.current.error).toBeNull()
    })

    it('debe llamar listDocuments y listStudySpaces con Promise.all', async () => {
      vi.mocked(apiModule.listSummaries).mockResolvedValue(mockSummariesResponse)
      vi.mocked(apiModule.listDocuments).mockResolvedValue(mockDocumentsResponse)
      vi.mocked(apiModule.listStudySpaces).mockResolvedValue(mockSpacesResponse)

      const { result } = renderHook(() => useSummariesData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const startTime = Date.now()

      await act(async () => {
        await result.current.loadDocumentsAndSpaces()
      })

      // Si fuera secuencial, tomaría más tiempo
      // Promise.all ejecuta en paralelo
      expect(result.current.documents).toEqual([mockDocument1, mockDocument2])
      expect(result.current.studySpaces).toEqual([mockSpace1, mockSpace2])
    })

    it('debe poder llamar loadDocumentsAndSpaces múltiples veces', async () => {
      vi.mocked(apiModule.listSummaries).mockResolvedValue(mockSummariesResponse)

      const firstDocsResponse: DocumentListResponse = {
        items: [mockDocument1],
        total: 1,
        skip: 0,
        limit: 100,
      }

      const secondDocsResponse: DocumentListResponse = mockDocumentsResponse

      vi.mocked(apiModule.listDocuments)
        .mockResolvedValueOnce(firstDocsResponse)
        .mockResolvedValueOnce(secondDocsResponse)

      vi.mocked(apiModule.listStudySpaces).mockResolvedValue(mockSpacesResponse)

      const { result } = renderHook(() => useSummariesData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Primera carga
      await act(async () => {
        await result.current.loadDocumentsAndSpaces()
      })

      expect(result.current.documents).toEqual([mockDocument1])

      // Segunda carga
      await act(async () => {
        await result.current.loadDocumentsAndSpaces()
      })

      expect(result.current.documents).toEqual([mockDocument1, mockDocument2])
      expect(apiModule.listDocuments).toHaveBeenCalledTimes(2)
    })
  })

  describe('loadDocumentsAndSpaces - Caso de error', () => {
    it('debe manejar error si listDocuments falla', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(apiModule.listSummaries).mockResolvedValue(mockSummariesResponse)
      vi.mocked(apiModule.listDocuments).mockRejectedValue(new Error('Docs error'))
      vi.mocked(apiModule.listStudySpaces).mockResolvedValue(mockSpacesResponse)

      const { result } = renderHook(() => useSummariesData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.loadDocumentsAndSpaces()
      })

      expect(result.current.error).toBe('Error al cargar documentos y espacios')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading documents and spaces:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })

    it('debe manejar error si listStudySpaces falla', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(apiModule.listSummaries).mockResolvedValue(mockSummariesResponse)
      vi.mocked(apiModule.listDocuments).mockResolvedValue(mockDocumentsResponse)
      vi.mocked(apiModule.listStudySpaces).mockRejectedValue(new Error('Spaces error'))

      const { result } = renderHook(() => useSummariesData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.loadDocumentsAndSpaces()
      })

      expect(result.current.error).toBe('Error al cargar documentos y espacios')

      consoleErrorSpy.mockRestore()
    })

    it('debe usar mensaje personalizado de error.response.data.detail si existe', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(apiModule.listSummaries).mockResolvedValue(mockSummariesResponse)

      const customError = {
        response: {
          data: {
            detail: 'Error personalizado al cargar datos',
          },
        },
      }

      vi.mocked(apiModule.listDocuments).mockRejectedValue(customError)
      vi.mocked(apiModule.listStudySpaces).mockResolvedValue(mockSpacesResponse)

      const { result } = renderHook(() => useSummariesData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.loadDocumentsAndSpaces()
      })

      expect(result.current.error).toBe('Error personalizado al cargar datos')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('removeSummary - Actualización optimista', () => {
    it('debe remover un resumen de la lista por ID', async () => {
      vi.mocked(apiModule.listSummaries).mockResolvedValue(mockSummariesResponse)

      const { result } = renderHook(() => useSummariesData())

      await waitFor(() => {
        expect(result.current.summaries).toEqual([mockSummary1, mockSummary2])
      })

      // Remover primer resumen
      act(() => {
        result.current.removeSummary('summary-1')
      })

      expect(result.current.summaries).toEqual([mockSummary2])
    })

    it('debe remover múltiples resúmenes correctamente', async () => {
      vi.mocked(apiModule.listSummaries).mockResolvedValue(mockSummariesResponse)

      const { result } = renderHook(() => useSummariesData())

      await waitFor(() => {
        expect(result.current.summaries).toEqual([mockSummary1, mockSummary2])
      })

      // Remover primer resumen
      act(() => {
        result.current.removeSummary('summary-1')
      })

      expect(result.current.summaries).toEqual([mockSummary2])

      // Remover segundo resumen
      act(() => {
        result.current.removeSummary('summary-2')
      })

      expect(result.current.summaries).toEqual([])
    })

    it('NO debe afectar la lista si el ID no existe', async () => {
      vi.mocked(apiModule.listSummaries).mockResolvedValue(mockSummariesResponse)

      const { result } = renderHook(() => useSummariesData())

      await waitFor(() => {
        expect(result.current.summaries).toEqual([mockSummary1, mockSummary2])
      })

      // Intentar remover ID inexistente
      act(() => {
        result.current.removeSummary('non-existent-id')
      })

      // Lista sin cambios
      expect(result.current.summaries).toEqual([mockSummary1, mockSummary2])
    })
  })

  describe('Integración completa', () => {
    it('debe manejar carga completa: summaries + documents + spaces', async () => {
      vi.mocked(apiModule.listSummaries).mockResolvedValue(mockSummariesResponse)
      vi.mocked(apiModule.listDocuments).mockResolvedValue(mockDocumentsResponse)
      vi.mocked(apiModule.listStudySpaces).mockResolvedValue(mockSpacesResponse)

      const { result } = renderHook(() => useSummariesData())

      // Esperar carga automática de summaries
      await waitFor(() => {
        expect(result.current.summaries).toEqual([mockSummary1, mockSummary2])
      })

      // Cargar documents y spaces
      await act(async () => {
        await result.current.loadDocumentsAndSpaces()
      })

      // Verificar que todo está cargado
      expect(result.current.summaries).toEqual([mockSummary1, mockSummary2])
      expect(result.current.documents).toEqual([mockDocument1, mockDocument2])
      expect(result.current.studySpaces).toEqual([mockSpace1, mockSpace2])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('debe manejar refresh después de removeSummary', async () => {
      vi.mocked(apiModule.listSummaries).mockResolvedValue(mockSummariesResponse)

      const { result } = renderHook(() => useSummariesData())

      await waitFor(() => {
        expect(result.current.summaries).toEqual([mockSummary1, mockSummary2])
      })

      // Remover resumen
      act(() => {
        result.current.removeSummary('summary-1')
      })

      expect(result.current.summaries).toEqual([mockSummary2])

      // Refresh (restaura todos los resúmenes desde API)
      await act(async () => {
        await result.current.refreshSummaries()
      })

      await waitFor(() => {
        expect(result.current.summaries).toEqual([mockSummary1, mockSummary2])
      })
    })
  })
})
