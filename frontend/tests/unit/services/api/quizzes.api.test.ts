import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import apiClient from '@/services/api/client'
import {
  createQuizFromFile,
  createQuizFromSummary,
  createQuizFromDocument,
  listQuizzes,
  getQuiz,
  deleteQuiz,
} from '@/services/api/quizzes.api'
import type {
  QuizResponse,
  QuizListResponse,
} from '@/types'

describe('quizzes.api', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(apiClient)
  })

  afterEach(() => {
    mock.restore()
  })

  describe('createQuizFromFile', () => {
    it('debe crear quiz desde archivo con parámetros por defecto', async () => {
      const file = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
      })

      const mockResponse: QuizResponse = {
        id: 'quiz1',
        title: 'Quiz generado',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 1,
        questions: [],
      }

      mock.onPost('/quizzes/generate-from-file').reply((config) => {
        const formData = config.data as FormData
        expect(formData.get('file')).toBeDefined()
        expect(formData.get('max_questions')).toBe('10')
        expect(formData.get('difficulty_level')).toBeNull()
        expect(config.headers?.['Content-Type']).toBe('multipart/form-data')
        return [200, mockResponse]
      })

      const result = await createQuizFromFile(file)

      expect(result).toEqual(mockResponse)
    })

    it('debe crear quiz con max_questions personalizado', async () => {
      const file = new File(['content'], 'test.pdf')

      mock.onPost('/quizzes/generate-from-file').reply((config) => {
        const formData = config.data as FormData
        expect(formData.get('max_questions')).toBe('20')
        return [200, { id: 'quiz1', questions: [] }]
      })

      await createQuizFromFile(file, 20)
    })

    it('debe crear quiz con difficulty_level', async () => {
      const file = new File(['content'], 'test.pdf')

      mock.onPost('/quizzes/generate-from-file').reply((config) => {
        const formData = config.data as FormData
        expect(formData.get('difficulty_level')).toBe('3')
        return [200, { id: 'quiz1' }]
      })

      await createQuizFromFile(file, 10, 3)
    })

    it('debe manejar diferentes niveles de dificultad', async () => {
      const file = new File(['content'], 'test.pdf')

      for (const level of [1, 2, 3, 4, 5]) {
        mock.onPost('/quizzes/generate-from-file').reply((config) => {
          const formData = config.data as FormData
          expect(formData.get('difficulty_level')).toBe(level.toString())
          return [200, { id: 'quiz1' }]
        })

        await createQuizFromFile(file, 10, level)
      }
    })

    it('debe fallar con archivo no válido', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })

      mock.onPost('/quizzes/generate-from-file').reply(400, {
        detail: 'Invalid file type',
      })

      await expect(createQuizFromFile(file)).rejects.toThrow()
    })
  })

  describe('createQuizFromSummary', () => {
    it('debe crear quiz desde resumen con max_questions', async () => {
      const data = {
        summary_id: 'summary1',
        max_questions: 15,
      }

      const mockResponse: QuizResponse = {
        id: 'quiz1',
        title: 'Quiz de resumen',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 1,
        questions: [],
      }

      mock
        .onPost('/quizzes/generate-from-summary/summary1')
        .reply((config) => {
          const formData = config.data as FormData
          expect(formData.get('max_questions')).toBe('15')
          expect(config.headers?.['Content-Type']).toBe('multipart/form-data')
          return [200, mockResponse]
        })

      const result = await createQuizFromSummary(data)

      expect(result).toEqual(mockResponse)
    })

    it('debe crear quiz sin max_questions especificado', async () => {
      const data = {
        summary_id: 'summary1',
      }

      mock
        .onPost('/quizzes/generate-from-summary/summary1')
        .reply((config) => {
          const formData = config.data as FormData
          expect(formData.get('max_questions')).toBeNull()
          return [200, { id: 'quiz1' }]
        })

      await createQuizFromSummary(data)
    })

    it('debe fallar si el resumen no existe', async () => {
      const data = {
        summary_id: 'nonexistent',
      }

      mock.onPost('/quizzes/generate-from-summary/nonexistent').reply(404, {
        detail: 'Summary not found',
      })

      await expect(createQuizFromSummary(data)).rejects.toThrow()
    })

    it('debe fallar si el resumen no pertenece al usuario', async () => {
      const data = {
        summary_id: 'summary1',
      }

      mock.onPost('/quizzes/generate-from-summary/summary1').reply(403, {
        detail: 'Not authorized',
      })

      await expect(createQuizFromSummary(data)).rejects.toThrow()
    })
  })

  describe('createQuizFromDocument', () => {
    it('debe crear quiz desde documento con max_questions', async () => {
      const mockResponse: QuizResponse = {
        id: 'quiz1',
        title: 'Quiz de documento',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 1,
        questions: [],
      }

      mock
        .onPost('/quizzes/generate-from-document/doc1')
        .reply((config) => {
          const formData = config.data as FormData
          expect(formData.get('study_space_id')).toBe('space1')
          expect(formData.get('max_questions')).toBe('12')
          expect(config.headers?.['Content-Type']).toBe('multipart/form-data')
          return [200, mockResponse]
        })

      const result = await createQuizFromDocument('doc1', 'space1', 12)

      expect(result).toEqual(mockResponse)
    })

    it('debe crear quiz sin max_questions especificado', async () => {
      mock
        .onPost('/quizzes/generate-from-document/doc1')
        .reply((config) => {
          const formData = config.data as FormData
          expect(formData.get('study_space_id')).toBe('space1')
          expect(formData.get('max_questions')).toBeNull()
          return [200, { id: 'quiz1' }]
        })

      await createQuizFromDocument('doc1', 'space1')
    })

    it('debe fallar si el documento no existe', async () => {
      mock.onPost('/quizzes/generate-from-document/nonexistent').reply(404, {
        detail: 'Document not found',
      })

      await expect(
        createQuizFromDocument('nonexistent', 'space1')
      ).rejects.toThrow()
    })

    it('debe fallar si el documento no pertenece al usuario', async () => {
      mock.onPost('/quizzes/generate-from-document/doc1').reply(403, {
        detail: 'Not authorized',
      })

      await expect(createQuizFromDocument('doc1', 'space1')).rejects.toThrow()
    })
  })

  describe('listQuizzes', () => {
    it('debe listar quizzes con paginación por defecto', async () => {
      const mockResponse: QuizListResponse = {
        items: [
          {
            id: 'quiz1',
            title: 'Quiz 1',
            created_at: '2024-01-01T00:00:00Z',
            user_id: 1,
            questions: [],
          },
          {
            id: 'quiz2',
            title: 'Quiz 2',
            created_at: '2024-01-02T00:00:00Z',
            user_id: 1,
            questions: [],
          },
        ],
        total: 2,
        skip: 0,
        limit: 100,
      }

      mock.onGet('/quizzes').reply((config) => {
        expect(config.params.skip).toBe(0)
        expect(config.params.limit).toBe(100)
        return [200, mockResponse]
      })

      const result = await listQuizzes()

      expect(result).toEqual(mockResponse)
      expect(result.items).toHaveLength(2)
    })

    it('debe listar quizzes con paginación personalizada', async () => {
      const mockResponse: QuizListResponse = {
        items: [],
        total: 50,
        skip: 20,
        limit: 10,
      }

      mock.onGet('/quizzes').reply((config) => {
        expect(config.params.skip).toBe(20)
        expect(config.params.limit).toBe(10)
        return [200, mockResponse]
      })

      const result = await listQuizzes(20, 10)

      expect(result.skip).toBe(20)
      expect(result.limit).toBe(10)
    })

    it('debe retornar lista vacía si no hay quizzes', async () => {
      const mockResponse: QuizListResponse = {
        items: [],
        total: 0,
        skip: 0,
        limit: 100,
      }

      mock.onGet('/quizzes').reply(200, mockResponse)

      const result = await listQuizzes()

      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  describe('getQuiz', () => {
    it('debe obtener detalles de un quiz', async () => {
      const mockResponse: QuizResponse = {
        id: 'quiz1',
        title: 'Quiz Detallado',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 1,
        questions: [
          {
            id: 'q1',
            question: '¿Cuál es la capital de Francia?',
            options: ['París', 'Londres', 'Madrid', 'Roma'],
            correct_answer: 'París',
          },
        ],
      }

      mock.onGet('/quizzes/quiz1').reply(200, mockResponse)

      const result = await getQuiz('quiz1')

      expect(result).toEqual(mockResponse)
      expect(result.questions).toHaveLength(1)
    })

    it('debe fallar si el quiz no existe', async () => {
      mock.onGet('/quizzes/nonexistent').reply(404, {
        detail: 'Quiz not found',
      })

      await expect(getQuiz('nonexistent')).rejects.toThrow()
    })

    it('debe fallar si el quiz no pertenece al usuario', async () => {
      mock.onGet('/quizzes/quiz1').reply(403, {
        detail: 'Not authorized',
      })

      await expect(getQuiz('quiz1')).rejects.toThrow()
    })
  })

  describe('deleteQuiz', () => {
    it('debe eliminar un quiz correctamente', async () => {
      mock.onDelete('/quizzes/quiz1').reply(204)

      await expect(deleteQuiz('quiz1')).resolves.toBeUndefined()
    })

    it('debe fallar si el quiz no existe', async () => {
      mock.onDelete('/quizzes/nonexistent').reply(404, {
        detail: 'Quiz not found',
      })

      await expect(deleteQuiz('nonexistent')).rejects.toThrow()
    })

    it('debe fallar si el quiz no pertenece al usuario', async () => {
      mock.onDelete('/quizzes/quiz1').reply(403, {
        detail: 'Not authorized',
      })

      await expect(deleteQuiz('quiz1')).rejects.toThrow()
    })
  })
})
