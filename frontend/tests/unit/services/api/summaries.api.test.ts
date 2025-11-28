import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import apiClient from '@/services/api/client'
import {
  uploadAndCreateSummary,
  createSummaryFromDocuments,
  listSummaries,
  getSummary,
  deleteSummary,
} from '@/services/api/summaries.api'
import type {
  SummaryResponse,
  SummaryDetailResponse,
  SummaryListResponse,
} from '@/types'

describe('summaries.api', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(apiClient)
  })

  afterEach(() => {
    mock.restore()
  })

  describe('uploadAndCreateSummary', () => {
    it('debe subir archivo y crear resumen con título', async () => {
      const file = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
      })
      const expertiseLevel = 'beginner'
      const title = 'Mi Resumen'

      const mockResponse: SummaryResponse = {
        id: 'summary1',
        title: 'Mi Resumen',
        expertise_level: 'beginner',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 1,
        document_ids: ['doc1'],
      }

      mock.onPost('/summaries/upload').reply((config) => {
        const formData = config.data as FormData
        expect(formData.get('file')).toBeDefined()
        expect(formData.get('expertise_level')).toBe('beginner')
        expect(formData.get('title')).toBe('Mi Resumen')
        return [200, mockResponse]
      })

      const result = await uploadAndCreateSummary(file, expertiseLevel, title)

      expect(result).toEqual(mockResponse)
    })

    it('debe subir archivo sin título', async () => {
      const file = new File(['content'], 'document.pdf')
      const expertiseLevel = 'intermediate'

      const mockResponse: SummaryResponse = {
        id: 'summary1',
        title: 'document.pdf',
        expertise_level: 'intermediate',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 1,
        document_ids: ['doc1'],
      }

      mock.onPost('/summaries/upload').reply((config) => {
        const formData = config.data as FormData
        expect(formData.get('title')).toBeNull()
        return [200, mockResponse]
      })

      const result = await uploadAndCreateSummary(file, expertiseLevel)

      expect(result.title).toBe('document.pdf')
    })

    it('debe manejar diferentes niveles de expertise', async () => {
      const file = new File(['content'], 'test.pdf')

      for (const level of ['beginner', 'intermediate', 'expert']) {
        mock.onPost('/summaries/upload').reply((config) => {
          const formData = config.data as FormData
          expect(formData.get('expertise_level')).toBe(level)
          return [
            200,
            { id: 'summary1', expertise_level: level },
          ]
        })

        await uploadAndCreateSummary(file, level as any)
      }
    })

    it('debe enviar Content-Type multipart/form-data', async () => {
      const file = new File(['content'], 'test.pdf')

      mock.onPost('/summaries/upload').reply((config) => {
        expect(config.headers?.['Content-Type']).toBe('multipart/form-data')
        return [200, { id: 'summary1' }]
      })

      await uploadAndCreateSummary(file, 'beginner')
    })
  })

  describe('createSummaryFromDocuments', () => {
    it('debe crear resumen desde documentos existentes', async () => {
      const data = {
        document_ids: ['doc1', 'doc2'],
        expertise_level: 'intermediate' as const,
        title: 'Resumen Combinado',
      }

      const mockResponse: SummaryResponse = {
        id: 'summary1',
        title: 'Resumen Combinado',
        expertise_level: 'intermediate',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 1,
        document_ids: ['doc1', 'doc2'],
      }

      mock.onPost('/summaries/from-documents', data).reply(200, mockResponse)

      const result = await createSummaryFromDocuments(data)

      expect(result).toEqual(mockResponse)
      expect(result.document_ids).toHaveLength(2)
    })

    it('debe crear resumen desde un solo documento', async () => {
      const data = {
        document_ids: ['doc1'],
        expertise_level: 'beginner' as const,
      }

      mock.onPost('/summaries/from-documents').reply(200, {
        id: 'summary1',
        document_ids: ['doc1'],
      })

      const result = await createSummaryFromDocuments(data)

      expect(result.document_ids).toHaveLength(1)
    })

    it('debe fallar con lista vacía de documentos', async () => {
      const data = {
        document_ids: [],
        expertise_level: 'beginner' as const,
      }

      mock.onPost('/summaries/from-documents').reply(400, {
        detail: 'At least one document required',
      })

      await expect(createSummaryFromDocuments(data)).rejects.toThrow()
    })
  })

  describe('listSummaries', () => {
    it('debe listar resúmenes con paginación por defecto', async () => {
      const mockResponse: SummaryListResponse = {
        items: [
          {
            id: 'summary1',
            title: 'Resumen 1',
            expertise_level: 'beginner',
            created_at: '2024-01-01T00:00:00Z',
            user_id: 1,
            document_ids: ['doc1'],
          },
          {
            id: 'summary2',
            title: 'Resumen 2',
            expertise_level: 'intermediate',
            created_at: '2024-01-02T00:00:00Z',
            user_id: 1,
            document_ids: ['doc2'],
          },
        ],
        total: 2,
        skip: 0,
        limit: 100,
      }

      mock.onGet('/summaries').reply((config) => {
        expect(config.params.skip).toBe(0)
        expect(config.params.limit).toBe(100)
        return [200, mockResponse]
      })

      const result = await listSummaries()

      expect(result).toEqual(mockResponse)
      expect(result.items).toHaveLength(2)
    })

    it('debe listar resúmenes con paginación personalizada', async () => {
      const mockResponse: SummaryListResponse = {
        items: [],
        total: 50,
        skip: 10,
        limit: 20,
      }

      mock.onGet('/summaries').reply((config) => {
        expect(config.params.skip).toBe(10)
        expect(config.params.limit).toBe(20)
        return [200, mockResponse]
      })

      const result = await listSummaries(10, 20)

      expect(result.skip).toBe(10)
      expect(result.limit).toBe(20)
    })

    it('debe retornar lista vacía si no hay resúmenes', async () => {
      const mockResponse: SummaryListResponse = {
        items: [],
        total: 0,
        skip: 0,
        limit: 100,
      }

      mock.onGet('/summaries').reply(200, mockResponse)

      const result = await listSummaries()

      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  describe('getSummary', () => {
    it('debe obtener detalles de un resumen', async () => {
      const mockResponse: SummaryDetailResponse = {
        id: 'summary1',
        title: 'Resumen Detallado',
        expertise_level: 'intermediate',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 1,
        document_ids: ['doc1', 'doc2'],
        content: {
          summary: 'Este es el contenido del resumen generado por IA',
          key_points: ['Punto 1', 'Punto 2', 'Punto 3'],
        },
      }

      mock.onGet('/summaries/summary1').reply(200, mockResponse)

      const result = await getSummary('summary1')

      expect(result).toEqual(mockResponse)
      expect(result.content).toBeDefined()
      expect(result.content.key_points).toHaveLength(3)
    })

    it('debe fallar si el resumen no existe', async () => {
      mock.onGet('/summaries/nonexistent').reply(404, {
        detail: 'Summary not found',
      })

      await expect(getSummary('nonexistent')).rejects.toThrow()
    })

    it('debe fallar si el resumen no pertenece al usuario', async () => {
      mock.onGet('/summaries/summary1').reply(403, {
        detail: 'Not authorized',
      })

      await expect(getSummary('summary1')).rejects.toThrow()
    })
  })

  describe('deleteSummary', () => {
    it('debe eliminar un resumen correctamente', async () => {
      mock.onDelete('/summaries/summary1').reply(204)

      await expect(deleteSummary('summary1')).resolves.toBeUndefined()
    })

    it('debe fallar si el resumen no existe', async () => {
      mock.onDelete('/summaries/nonexistent').reply(404, {
        detail: 'Summary not found',
      })

      await expect(deleteSummary('nonexistent')).rejects.toThrow()
    })

    it('debe fallar si el resumen no pertenece al usuario', async () => {
      mock.onDelete('/summaries/summary1').reply(403, {
        detail: 'Not authorized',
      })

      await expect(deleteSummary('summary1')).rejects.toThrow()
    })
  })
})
