import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import apiClient from '@/services/api/client'
import {
  createQuizAttempt,
  answerQuestion,
  completeQuizAttempt,
  getQuizAttemptResults,
} from '@/services/api/quiz-attempts.api'
import type {
  QuizAttemptWithQuestionsResponse,
  QuizAttemptAnswerFeedback,
  QuizAttemptResponse,
  QuizResultResponse,
} from '@/types'

describe('quiz-attempts.api', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(apiClient)
  })

  afterEach(() => {
    mock.restore()
  })

  describe('createQuizAttempt', () => {
    it('debe crear un nuevo intento de quiz', async () => {
      const data = {
        quiz_id: 'quiz1',
      }

      const mockResponse: QuizAttemptWithQuestionsResponse = {
        id: 'attempt1',
        quiz_id: 'quiz1',
        user_id: 1,
        started_at: '2024-01-01T00:00:00Z',
        completed_at: null,
        score: null,
        questions: [
          {
            id: 'q1',
            question: '¿Cuál es la capital de Francia?',
            options: ['París', 'Londres', 'Madrid', 'Roma'],
          },
        ],
      }

      mock.onPost('/quiz-attempts', data).reply(200, mockResponse)

      const result = await createQuizAttempt(data)

      expect(result).toEqual(mockResponse)
      expect(result.quiz_id).toBe('quiz1')
      expect(result.completed_at).toBeNull()
      expect(result.questions).toHaveLength(1)
    })

    it('debe fallar si el quiz no existe', async () => {
      const data = {
        quiz_id: 'nonexistent',
      }

      mock.onPost('/quiz-attempts').reply(404, {
        detail: 'Quiz not found',
      })

      await expect(createQuizAttempt(data)).rejects.toThrow()
    })

    it('debe fallar si el quiz no pertenece al usuario', async () => {
      const data = {
        quiz_id: 'quiz1',
      }

      mock.onPost('/quiz-attempts').reply(403, {
        detail: 'Not authorized',
      })

      await expect(createQuizAttempt(data)).rejects.toThrow()
    })

    it('debe crear intento con preguntas del quiz', async () => {
      const data = { quiz_id: 'quiz1' }

      const mockResponse: QuizAttemptWithQuestionsResponse = {
        id: 'attempt1',
        quiz_id: 'quiz1',
        user_id: 1,
        started_at: '2024-01-01T00:00:00Z',
        completed_at: null,
        score: null,
        questions: [
          {
            id: 'q1',
            question: 'Pregunta 1',
            options: ['A', 'B', 'C', 'D'],
          },
          {
            id: 'q2',
            question: 'Pregunta 2',
            options: ['A', 'B', 'C', 'D'],
          },
        ],
      }

      mock.onPost('/quiz-attempts').reply(200, mockResponse)

      const result = await createQuizAttempt(data)

      expect(result.questions).toHaveLength(2)
      expect(result.questions[0]).not.toHaveProperty('correct_answer')
    })
  })

  describe('answerQuestion', () => {
    it('debe enviar respuesta y recibir feedback', async () => {
      const attemptId = 'attempt1'
      const data = {
        question_id: 'q1',
        selected_answer: 'París',
      }

      const mockResponse: QuizAttemptAnswerFeedback = {
        is_correct: true,
        correct_answer: 'París',
        explanation: 'París es la capital de Francia',
      }

      mock
        .onPost(`/quiz-attempts/${attemptId}/answer`, data)
        .reply(200, mockResponse)

      const result = await answerQuestion(attemptId, data)

      expect(result).toEqual(mockResponse)
      expect(result.is_correct).toBe(true)
    })

    it('debe recibir feedback para respuesta incorrecta', async () => {
      const attemptId = 'attempt1'
      const data = {
        question_id: 'q1',
        selected_answer: 'Londres',
      }

      const mockResponse: QuizAttemptAnswerFeedback = {
        is_correct: false,
        correct_answer: 'París',
        explanation: 'La respuesta correcta es París, la capital de Francia',
      }

      mock
        .onPost(`/quiz-attempts/${attemptId}/answer`)
        .reply(200, mockResponse)

      const result = await answerQuestion(attemptId, data)

      expect(result.is_correct).toBe(false)
      expect(result.correct_answer).toBe('París')
      expect(result.explanation).toBeDefined()
    })

    it('debe fallar si el intento no existe', async () => {
      const data = {
        question_id: 'q1',
        selected_answer: 'París',
      }

      mock.onPost('/quiz-attempts/nonexistent/answer').reply(404, {
        detail: 'Quiz attempt not found',
      })

      await expect(answerQuestion('nonexistent', data)).rejects.toThrow()
    })

    it('debe fallar si el intento ya fue completado', async () => {
      const data = {
        question_id: 'q1',
        selected_answer: 'París',
      }

      mock.onPost('/quiz-attempts/attempt1/answer').reply(400, {
        detail: 'Quiz attempt already completed',
      })

      await expect(answerQuestion('attempt1', data)).rejects.toThrow()
    })

    it('debe fallar si la pregunta no pertenece al quiz', async () => {
      const data = {
        question_id: 'invalid_q',
        selected_answer: 'París',
      }

      mock.onPost('/quiz-attempts/attempt1/answer').reply(400, {
        detail: 'Question not found in quiz',
      })

      await expect(answerQuestion('attempt1', data)).rejects.toThrow()
    })

    it('debe incluir explicación en el feedback', async () => {
      const data = {
        question_id: 'q1',
        selected_answer: 'París',
      }

      const mockResponse: QuizAttemptAnswerFeedback = {
        is_correct: true,
        correct_answer: 'París',
        explanation: 'Explicación detallada de la respuesta',
      }

      mock.onPost('/quiz-attempts/attempt1/answer').reply(200, mockResponse)

      const result = await answerQuestion('attempt1', data)

      expect(result.explanation).toBe('Explicación detallada de la respuesta')
    })
  })

  describe('completeQuizAttempt', () => {
    it('debe completar un intento de quiz correctamente', async () => {
      const attemptId = 'attempt1'

      const mockResponse: QuizAttemptResponse = {
        id: 'attempt1',
        quiz_id: 'quiz1',
        user_id: 1,
        started_at: '2024-01-01T00:00:00Z',
        completed_at: '2024-01-01T00:10:00Z',
        score: 85.5,
      }

      mock
        .onPost(`/quiz-attempts/${attemptId}/complete`)
        .reply(200, mockResponse)

      const result = await completeQuizAttempt(attemptId)

      expect(result).toEqual(mockResponse)
      expect(result.completed_at).not.toBeNull()
      expect(result.score).toBe(85.5)
    })

    it('debe fallar si el intento no existe', async () => {
      mock.onPost('/quiz-attempts/nonexistent/complete').reply(404, {
        detail: 'Quiz attempt not found',
      })

      await expect(completeQuizAttempt('nonexistent')).rejects.toThrow()
    })

    it('debe fallar si el intento ya fue completado', async () => {
      mock.onPost('/quiz-attempts/attempt1/complete').reply(400, {
        detail: 'Quiz attempt already completed',
      })

      await expect(completeQuizAttempt('attempt1')).rejects.toThrow()
    })

    it('debe calcular score basado en respuestas correctas', async () => {
      const mockResponse: QuizAttemptResponse = {
        id: 'attempt1',
        quiz_id: 'quiz1',
        user_id: 1,
        started_at: '2024-01-01T00:00:00Z',
        completed_at: '2024-01-01T00:10:00Z',
        score: 75.0,
      }

      mock.onPost('/quiz-attempts/attempt1/complete').reply(200, mockResponse)

      const result = await completeQuizAttempt('attempt1')

      expect(result.score).toBe(75.0)
    })
  })

  describe('getQuizAttemptResults', () => {
    it('debe obtener resultados detallados del intento', async () => {
      const attemptId = 'attempt1'

      const mockResponse: QuizResultResponse = {
        attempt_id: 'attempt1',
        quiz_id: 'quiz1',
        score: 80.0,
        total_questions: 10,
        correct_answers: 8,
        completed_at: '2024-01-01T00:10:00Z',
        time_taken: 600,
        answers: [
          {
            question_id: 'q1',
            question: '¿Cuál es la capital de Francia?',
            selected_answer: 'París',
            correct_answer: 'París',
            is_correct: true,
          },
          {
            question_id: 'q2',
            question: '¿Cuál es la capital de España?',
            selected_answer: 'Barcelona',
            correct_answer: 'Madrid',
            is_correct: false,
          },
        ],
      }

      mock
        .onGet(`/quiz-attempts/${attemptId}/results`)
        .reply(200, mockResponse)

      const result = await getQuizAttemptResults(attemptId)

      expect(result).toEqual(mockResponse)
      expect(result.score).toBe(80.0)
      expect(result.total_questions).toBe(10)
      expect(result.correct_answers).toBe(8)
      expect(result.answers).toHaveLength(2)
    })

    it('debe fallar si el intento no existe', async () => {
      mock.onGet('/quiz-attempts/nonexistent/results').reply(404, {
        detail: 'Quiz attempt not found',
      })

      await expect(getQuizAttemptResults('nonexistent')).rejects.toThrow()
    })

    it('debe fallar si el intento no fue completado', async () => {
      mock.onGet('/quiz-attempts/attempt1/results').reply(400, {
        detail: 'Quiz attempt not completed yet',
      })

      await expect(getQuizAttemptResults('attempt1')).rejects.toThrow()
    })

    it('debe fallar si el intento no pertenece al usuario', async () => {
      mock.onGet('/quiz-attempts/attempt1/results').reply(403, {
        detail: 'Not authorized',
      })

      await expect(getQuizAttemptResults('attempt1')).rejects.toThrow()
    })

    it('debe incluir todas las respuestas con detalles', async () => {
      const mockResponse: QuizResultResponse = {
        attempt_id: 'attempt1',
        quiz_id: 'quiz1',
        score: 100.0,
        total_questions: 3,
        correct_answers: 3,
        completed_at: '2024-01-01T00:10:00Z',
        time_taken: 300,
        answers: [
          {
            question_id: 'q1',
            question: 'Pregunta 1',
            selected_answer: 'A',
            correct_answer: 'A',
            is_correct: true,
          },
          {
            question_id: 'q2',
            question: 'Pregunta 2',
            selected_answer: 'B',
            correct_answer: 'B',
            is_correct: true,
          },
          {
            question_id: 'q3',
            question: 'Pregunta 3',
            selected_answer: 'C',
            correct_answer: 'C',
            is_correct: true,
          },
        ],
      }

      mock.onGet('/quiz-attempts/attempt1/results').reply(200, mockResponse)

      const result = await getQuizAttemptResults('attempt1')

      expect(result.answers).toHaveLength(3)
      expect(result.score).toBe(100.0)
      result.answers.forEach((answer) => {
        expect(answer).toHaveProperty('question')
        expect(answer).toHaveProperty('selected_answer')
        expect(answer).toHaveProperty('correct_answer')
        expect(answer).toHaveProperty('is_correct')
      })
    })

    it('debe incluir tiempo tomado en segundos', async () => {
      const mockResponse: QuizResultResponse = {
        attempt_id: 'attempt1',
        quiz_id: 'quiz1',
        score: 90.0,
        total_questions: 5,
        correct_answers: 4,
        completed_at: '2024-01-01T00:10:00Z',
        time_taken: 450,
        answers: [],
      }

      mock.onGet('/quiz-attempts/attempt1/results').reply(200, mockResponse)

      const result = await getQuizAttemptResults('attempt1')

      expect(result.time_taken).toBe(450)
    })
  })
})
