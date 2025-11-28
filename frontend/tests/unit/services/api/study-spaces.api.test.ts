import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import apiClient from '@/services/api/client'
import {
  createStudySpace,
  listStudySpaces,
  listStudySpacesWithStats,
  getStudySpace,
  updateStudySpace,
  deleteStudySpace,
  addSummaryToSpace,
  removeSummaryFromSpace,
  addDocumentToSpace,
  removeDocumentFromSpace,
  getStudySpaceStats,
  getStudySpaceQuizzes,
  createQuizFromSpace,
} from '@/services/api/study-spaces.api'
import type {
  StudySpaceResponse,
  StudySpaceDetailResponse,
  StudySpaceListResponse,
  StudySpaceListWithStatsResponse,
  StudySpaceStatsResponse,
  QuizListResponse,
  QuizResponse,
} from '@/types'

describe('study-spaces.api', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(apiClient)
  })

  afterEach(() => {
    mock.restore()
  })

  describe('createStudySpace', () => {
    it('debe crear un espacio de estudio', async () => {
      const data = {
        name: 'Mi Espacio de Estudio',
        description: 'Descripción del espacio',
      }

      const mockResponse: StudySpaceResponse = {
        id: 'space1',
        name: 'Mi Espacio de Estudio',
        description: 'Descripción del espacio',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 1,
      }

      mock.onPost('/study-spaces', data).reply(200, mockResponse)

      const result = await createStudySpace(data)

      expect(result).toEqual(mockResponse)
      expect(result.name).toBe('Mi Espacio de Estudio')
    })

    it('debe crear espacio sin descripción', async () => {
      const data = {
        name: 'Espacio Simple',
      }

      const mockResponse: StudySpaceResponse = {
        id: 'space1',
        name: 'Espacio Simple',
        description: null,
        created_at: '2024-01-01T00:00:00Z',
        user_id: 1,
      }

      mock.onPost('/study-spaces').reply(200, mockResponse)

      const result = await createStudySpace(data)

      expect(result.description).toBeNull()
    })

    it('debe fallar con nombre vacío', async () => {
      const data = {
        name: '',
      }

      mock.onPost('/study-spaces').reply(400, {
        detail: 'Name cannot be empty',
      })

      await expect(createStudySpace(data)).rejects.toThrow()
    })
  })

  describe('listStudySpaces', () => {
    it('debe listar espacios con paginación por defecto', async () => {
      const mockResponse: StudySpaceListResponse = {
        items: [
          {
            id: 'space1',
            name: 'Espacio 1',
            description: 'Desc 1',
            created_at: '2024-01-01T00:00:00Z',
            user_id: 1,
          },
          {
            id: 'space2',
            name: 'Espacio 2',
            description: 'Desc 2',
            created_at: '2024-01-02T00:00:00Z',
            user_id: 1,
          },
        ],
        total: 2,
        skip: 0,
        limit: 100,
      }

      mock.onGet('/study-spaces').reply((config) => {
        expect(config.params.skip).toBe(0)
        expect(config.params.limit).toBe(100)
        expect(config.params.include_stats).toBeUndefined()
        return [200, mockResponse]
      })

      const result = await listStudySpaces()

      expect(result).toEqual(mockResponse)
      expect(result.items).toHaveLength(2)
    })

    it('debe listar espacios con paginación personalizada', async () => {
      const mockResponse: StudySpaceListResponse = {
        items: [],
        total: 50,
        skip: 10,
        limit: 20,
      }

      mock.onGet('/study-spaces').reply((config) => {
        expect(config.params.skip).toBe(10)
        expect(config.params.limit).toBe(20)
        return [200, mockResponse]
      })

      const result = await listStudySpaces(10, 20)

      expect(result.skip).toBe(10)
      expect(result.limit).toBe(20)
    })

    it('debe retornar lista vacía si no hay espacios', async () => {
      const mockResponse: StudySpaceListResponse = {
        items: [],
        total: 0,
        skip: 0,
        limit: 100,
      }

      mock.onGet('/study-spaces').reply(200, mockResponse)

      const result = await listStudySpaces()

      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  describe('listStudySpacesWithStats', () => {
    it('debe listar espacios con estadísticas', async () => {
      const mockResponse: StudySpaceListWithStatsResponse = {
        items: [
          {
            id: 'space1',
            name: 'Espacio 1',
            description: 'Desc 1',
            created_at: '2024-01-01T00:00:00Z',
            user_id: 1,
            stats: {
              total_documents: 5,
              total_summaries: 3,
              total_quizzes: 2,
            },
          },
        ],
        total: 1,
        skip: 0,
        limit: 100,
      }

      mock.onGet('/study-spaces').reply((config) => {
        expect(config.params.include_stats).toBe(true)
        return [200, mockResponse]
      })

      const result = await listStudySpacesWithStats()

      expect(result.items[0].stats).toBeDefined()
      expect(result.items[0].stats?.total_documents).toBe(5)
    })

    it('debe incluir include_stats=true en params', async () => {
      mock.onGet('/study-spaces').reply((config) => {
        expect(config.params.include_stats).toBe(true)
        return [200, { items: [], total: 0, skip: 0, limit: 100 }]
      })

      await listStudySpacesWithStats()
    })
  })

  describe('getStudySpace', () => {
    it('debe obtener detalles de un espacio', async () => {
      const mockResponse: StudySpaceDetailResponse = {
        id: 'space1',
        name: 'Espacio Detallado',
        description: 'Descripción completa',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 1,
        documents: [
          {
            id: 'doc1',
            filename: 'document.pdf',
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        summaries: [
          {
            id: 'sum1',
            title: 'Resumen 1',
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      }

      mock.onGet('/study-spaces/space1').reply(200, mockResponse)

      const result = await getStudySpace('space1')

      expect(result).toEqual(mockResponse)
      expect(result.documents).toHaveLength(1)
      expect(result.summaries).toHaveLength(1)
    })

    it('debe fallar si el espacio no existe', async () => {
      mock.onGet('/study-spaces/nonexistent').reply(404, {
        detail: 'Study space not found',
      })

      await expect(getStudySpace('nonexistent')).rejects.toThrow()
    })

    it('debe fallar si el espacio no pertenece al usuario', async () => {
      mock.onGet('/study-spaces/space1').reply(403, {
        detail: 'Not authorized',
      })

      await expect(getStudySpace('space1')).rejects.toThrow()
    })
  })

  describe('updateStudySpace', () => {
    it('debe actualizar nombre y descripción', async () => {
      const data = {
        name: 'Nombre Actualizado',
        description: 'Nueva descripción',
      }

      const mockResponse: StudySpaceResponse = {
        id: 'space1',
        name: 'Nombre Actualizado',
        description: 'Nueva descripción',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 1,
      }

      mock.onPut('/study-spaces/space1', data).reply(200, mockResponse)

      const result = await updateStudySpace('space1', data)

      expect(result).toEqual(mockResponse)
      expect(result.name).toBe('Nombre Actualizado')
    })

    it('debe actualizar solo el nombre', async () => {
      const data = {
        name: 'Solo Nombre',
      }

      mock.onPut('/study-spaces/space1').reply(200, {
        id: 'space1',
        name: 'Solo Nombre',
        description: 'Descripción anterior',
      })

      const result = await updateStudySpace('space1', data)

      expect(result.name).toBe('Solo Nombre')
    })

    it('debe fallar si el espacio no existe', async () => {
      const data = { name: 'Nuevo nombre' }

      mock.onPut('/study-spaces/nonexistent').reply(404, {
        detail: 'Study space not found',
      })

      await expect(
        updateStudySpace('nonexistent', data)
      ).rejects.toThrow()
    })

    it('debe fallar si el espacio no pertenece al usuario', async () => {
      const data = { name: 'Nuevo nombre' }

      mock.onPut('/study-spaces/space1').reply(403, {
        detail: 'Not authorized',
      })

      await expect(updateStudySpace('space1', data)).rejects.toThrow()
    })
  })

  describe('deleteStudySpace', () => {
    it('debe eliminar un espacio con contraseña', async () => {
      mock.onDelete('/study-spaces/space1').reply((config) => {
        expect(config.data).toBe(JSON.stringify({ password: 'mypassword' }))
        return [204]
      })

      await expect(
        deleteStudySpace('space1', 'mypassword')
      ).resolves.toBeUndefined()
    })

    it('debe fallar si el espacio no existe', async () => {
      mock.onDelete('/study-spaces/nonexistent').reply(404, {
        detail: 'Study space not found',
      })

      await expect(
        deleteStudySpace('nonexistent', 'password')
      ).rejects.toThrow()
    })

    it('debe fallar con contraseña incorrecta', async () => {
      mock.onDelete('/study-spaces/space1').reply(401, {
        detail: 'Invalid password',
      })

      await expect(
        deleteStudySpace('space1', 'wrongpassword')
      ).rejects.toThrow()
    })

    it('debe fallar si el espacio no pertenece al usuario', async () => {
      mock.onDelete('/study-spaces/space1').reply(403, {
        detail: 'Not authorized',
      })

      await expect(
        deleteStudySpace('space1', 'password')
      ).rejects.toThrow()
    })
  })

  describe('addSummaryToSpace', () => {
    it('debe agregar resumen a un espacio', async () => {
      const data = {
        resource_id: 'summary1',
      }

      mock.onPost('/study-spaces/space1/summaries', data).reply(204)

      await expect(
        addSummaryToSpace('space1', data)
      ).resolves.toBeUndefined()
    })

    it('debe fallar si el resumen no existe', async () => {
      const data = { resource_id: 'nonexistent' }

      mock.onPost('/study-spaces/space1/summaries').reply(404, {
        detail: 'Summary not found',
      })

      await expect(addSummaryToSpace('space1', data)).rejects.toThrow()
    })

    it('debe fallar si el resumen ya está en el espacio', async () => {
      const data = { resource_id: 'summary1' }

      mock.onPost('/study-spaces/space1/summaries').reply(400, {
        detail: 'Summary already in space',
      })

      await expect(addSummaryToSpace('space1', data)).rejects.toThrow()
    })
  })

  describe('removeSummaryFromSpace', () => {
    it('debe remover resumen de un espacio', async () => {
      mock
        .onDelete('/study-spaces/space1/summaries/summary1')
        .reply(204)

      await expect(
        removeSummaryFromSpace('space1', 'summary1')
      ).resolves.toBeUndefined()
    })

    it('debe fallar si el resumen no está en el espacio', async () => {
      mock
        .onDelete('/study-spaces/space1/summaries/summary1')
        .reply(404, {
          detail: 'Summary not found in space',
        })

      await expect(
        removeSummaryFromSpace('space1', 'summary1')
      ).rejects.toThrow()
    })
  })

  describe('addDocumentToSpace', () => {
    it('debe agregar documento a un espacio', async () => {
      const data = {
        resource_id: 'doc1',
      }

      mock.onPost('/study-spaces/space1/documents', data).reply(204)

      await expect(
        addDocumentToSpace('space1', data)
      ).resolves.toBeUndefined()
    })

    it('debe fallar si el documento no existe', async () => {
      const data = { resource_id: 'nonexistent' }

      mock.onPost('/study-spaces/space1/documents').reply(404, {
        detail: 'Document not found',
      })

      await expect(addDocumentToSpace('space1', data)).rejects.toThrow()
    })

    it('debe fallar si el documento ya está en el espacio', async () => {
      const data = { resource_id: 'doc1' }

      mock.onPost('/study-spaces/space1/documents').reply(400, {
        detail: 'Document already in space',
      })

      await expect(addDocumentToSpace('space1', data)).rejects.toThrow()
    })
  })

  describe('removeDocumentFromSpace', () => {
    it('debe remover documento de un espacio', async () => {
      mock.onDelete('/study-spaces/space1/documents/doc1').reply(204)

      await expect(
        removeDocumentFromSpace('space1', 'doc1')
      ).resolves.toBeUndefined()
    })

    it('debe fallar si el documento no está en el espacio', async () => {
      mock.onDelete('/study-spaces/space1/documents/doc1').reply(404, {
        detail: 'Document not found in space',
      })

      await expect(
        removeDocumentFromSpace('space1', 'doc1')
      ).rejects.toThrow()
    })
  })

  describe('getStudySpaceStats', () => {
    it('debe obtener estadísticas del espacio', async () => {
      const mockResponse: StudySpaceStatsResponse = {
        total_documents: 10,
        total_summaries: 5,
        total_quizzes: 3,
        average_quiz_score: 82.5,
        total_quiz_attempts: 15,
      }

      mock.onGet('/study-spaces/space1/stats').reply(200, mockResponse)

      const result = await getStudySpaceStats('space1')

      expect(result).toEqual(mockResponse)
      expect(result.total_documents).toBe(10)
      expect(result.average_quiz_score).toBe(82.5)
    })

    it('debe fallar si el espacio no existe', async () => {
      mock.onGet('/study-spaces/nonexistent/stats').reply(404, {
        detail: 'Study space not found',
      })

      await expect(getStudySpaceStats('nonexistent')).rejects.toThrow()
    })

    it('debe retornar estadísticas vacías para espacio sin actividad', async () => {
      const mockResponse: StudySpaceStatsResponse = {
        total_documents: 0,
        total_summaries: 0,
        total_quizzes: 0,
        average_quiz_score: null,
        total_quiz_attempts: 0,
      }

      mock.onGet('/study-spaces/space1/stats').reply(200, mockResponse)

      const result = await getStudySpaceStats('space1')

      expect(result.total_documents).toBe(0)
      expect(result.average_quiz_score).toBeNull()
    })
  })

  describe('getStudySpaceQuizzes', () => {
    it('debe obtener quizzes del espacio con paginación por defecto', async () => {
      const mockResponse: QuizListResponse = {
        items: [
          {
            id: 'quiz1',
            title: 'Quiz 1',
            created_at: '2024-01-01T00:00:00Z',
            user_id: 1,
            questions: [],
          },
        ],
        total: 1,
        skip: 0,
        limit: 100,
      }

      mock.onGet('/study-spaces/space1/quizzes').reply((config) => {
        expect(config.params.skip).toBe(0)
        expect(config.params.limit).toBe(100)
        return [200, mockResponse]
      })

      const result = await getStudySpaceQuizzes('space1')

      expect(result).toEqual(mockResponse)
      expect(result.items).toHaveLength(1)
    })

    it('debe obtener quizzes con paginación personalizada', async () => {
      const mockResponse: QuizListResponse = {
        items: [],
        total: 20,
        skip: 10,
        limit: 5,
      }

      mock.onGet('/study-spaces/space1/quizzes').reply((config) => {
        expect(config.params.skip).toBe(10)
        expect(config.params.limit).toBe(5)
        return [200, mockResponse]
      })

      const result = await getStudySpaceQuizzes('space1', 10, 5)

      expect(result.skip).toBe(10)
      expect(result.limit).toBe(5)
    })

    it('debe fallar si el espacio no existe', async () => {
      mock.onGet('/study-spaces/nonexistent/quizzes').reply(404, {
        detail: 'Study space not found',
      })

      await expect(getStudySpaceQuizzes('nonexistent')).rejects.toThrow()
    })
  })

  describe('createQuizFromSpace', () => {
    it('debe crear quiz desde contenido del espacio con max_questions', async () => {
      const data = {
        max_questions: 15,
      }

      const mockResponse: QuizResponse = {
        id: 'quiz1',
        title: 'Quiz del Espacio',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 1,
        questions: [],
      }

      mock
        .onPost('/study-spaces/space1/quizzes', data)
        .reply(200, mockResponse)

      const result = await createQuizFromSpace('space1', data)

      expect(result).toEqual(mockResponse)
    })

    it('debe crear quiz sin max_questions especificado', async () => {
      const data = {}

      const mockResponse: QuizResponse = {
        id: 'quiz1',
        title: 'Quiz del Espacio',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 1,
        questions: [],
      }

      mock.onPost('/study-spaces/space1/quizzes', data).reply(200, mockResponse)

      const result = await createQuizFromSpace('space1', data)

      expect(result).toEqual(mockResponse)
    })

    it('debe fallar si el espacio no existe', async () => {
      mock.onPost('/study-spaces/nonexistent/quizzes').reply(404, {
        detail: 'Study space not found',
      })

      await expect(
        createQuizFromSpace('nonexistent', {})
      ).rejects.toThrow()
    })

    it('debe fallar si el espacio no tiene contenido', async () => {
      mock.onPost('/study-spaces/space1/quizzes').reply(400, {
        detail: 'Study space has no content',
      })

      await expect(createQuizFromSpace('space1', {})).rejects.toThrow()
    })
  })
})
