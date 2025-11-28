import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import QuizCard from '@/components/features/QuizCard'
import type { QuizResponse } from '@/types'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderQuizCard = (props: any) => {
  return render(
    <BrowserRouter>
      <QuizCard {...props} />
    </BrowserRouter>
  )
}

describe('QuizCard', () => {
  const baseQuiz: QuizResponse = {
    id: 'quiz1',
    user_id: 'user1',
    title: 'Quiz de Matemáticas',
    difficulty_level: 2,
    created_at: '2024-01-15T10:00:00Z',
    questions: [],
    summary_id: null,
    study_space_id: null,
    study_space_name: null,
    summary_title: null,
    document_names: [],
    source_type: 'file',
    num_questions: 10,
    num_attempts: 5,
  }

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering básico', () => {
    it('debe renderizar el título del quiz', () => {
      renderQuizCard({ quiz: baseQuiz })
      expect(screen.getByText('Quiz de Matemáticas')).toBeInTheDocument()
    })

    it('debe renderizar el número de preguntas', () => {
      renderQuizCard({ quiz: baseQuiz })
      expect(screen.getByText('10 preguntas')).toBeInTheDocument()
    })

    it('debe renderizar el número de intentos', () => {
      renderQuizCard({ quiz: baseQuiz })
      expect(screen.getByText('5 intentos')).toBeInTheDocument()
    })

    it('debe renderizar la fecha de creación', () => {
      renderQuizCard({ quiz: baseQuiz })
      expect(screen.getByText('15/1/2024')).toBeInTheDocument()
    })
  })

  describe('Dificultad', () => {
    it('debe mostrar "Fácil" para nivel 1', () => {
      const quiz = { ...baseQuiz, difficulty_level: 1 }
      renderQuizCard({ quiz })
      expect(screen.getByText('Fácil')).toBeInTheDocument()
    })

    it('debe mostrar "Fácil" para nivel 2', () => {
      const quiz = { ...baseQuiz, difficulty_level: 2 }
      renderQuizCard({ quiz })
      expect(screen.getByText('Fácil')).toBeInTheDocument()
    })

    it('debe mostrar "Medio" para nivel 3', () => {
      const quiz = { ...baseQuiz, difficulty_level: 3 }
      renderQuizCard({ quiz })
      expect(screen.getByText('Medio')).toBeInTheDocument()
    })

    it('debe mostrar "Difícil" para nivel 4', () => {
      const quiz = { ...baseQuiz, difficulty_level: 4 }
      renderQuizCard({ quiz })
      expect(screen.getByText('Difícil')).toBeInTheDocument()
    })

    it('debe mostrar "Difícil" para nivel 5', () => {
      const quiz = { ...baseQuiz, difficulty_level: 5 }
      renderQuizCard({ quiz })
      expect(screen.getByText('Difícil')).toBeInTheDocument()
    })

    it('debe aplicar clase text-green-400 para nivel 1', () => {
      const quiz = { ...baseQuiz, difficulty_level: 1 }
      renderQuizCard({ quiz })
      const difficultyElement = screen.getByText('Fácil')
      expect(difficultyElement).toHaveClass('text-green-400')
    })

    it('debe aplicar clase text-yellow-400 para nivel 3', () => {
      const quiz = { ...baseQuiz, difficulty_level: 3 }
      renderQuizCard({ quiz })
      const difficultyElement = screen.getByText('Medio')
      expect(difficultyElement).toHaveClass('text-yellow-400')
    })

    it('debe aplicar clase text-red-400 para nivel 5', () => {
      const quiz = { ...baseQuiz, difficulty_level: 5 }
      renderQuizCard({ quiz })
      const difficultyElement = screen.getByText('Difícil')
      expect(difficultyElement).toHaveClass('text-red-400')
    })
  })

  describe('Tipos de fuente', () => {
    it('debe mostrar información de archivo cuando source_type es "file"', () => {
      const quiz = {
        ...baseQuiz,
        source_type: 'file',
        document_names: ['documento.pdf'],
      }
      renderQuizCard({ quiz })
      expect(screen.getByText(/Desde archivo:/)).toBeInTheDocument()
      expect(screen.getByText('documento.pdf')).toBeInTheDocument()
    })

    it('debe mostrar información de resumen cuando source_type es "summary"', () => {
      const quiz = {
        ...baseQuiz,
        source_type: 'summary',
        summary_title: 'Mi Resumen',
      }
      renderQuizCard({ quiz })
      expect(screen.getByText(/Desde resumen:/)).toBeInTheDocument()
      expect(screen.getByText('Mi Resumen')).toBeInTheDocument()
    })

    it('debe mostrar información de espacio cuando source_type es "space"', () => {
      const quiz = {
        ...baseQuiz,
        source_type: 'space',
        study_space_name: 'Mi Espacio',
      }
      renderQuizCard({ quiz })
      expect(screen.getByText(/Desde espacio:/)).toBeInTheDocument()
      expect(screen.getByText('Mi Espacio')).toBeInTheDocument()
    })

    it('NO debe mostrar información de espacio cuando showSpaceBadge es false', () => {
      const quiz = {
        ...baseQuiz,
        source_type: 'space',
        study_space_name: 'Mi Espacio',
      }
      renderQuizCard({ quiz, showSpaceBadge: false })
      expect(screen.queryByText(/Desde espacio:/)).not.toBeInTheDocument()
    })

    it('debe mostrar información de espacio cuando showSpaceBadge es true (por defecto)', () => {
      const quiz = {
        ...baseQuiz,
        source_type: 'space',
        study_space_name: 'Mi Espacio',
      }
      renderQuizCard({ quiz })
      expect(screen.getByText(/Desde espacio:/)).toBeInTheDocument()
    })
  })

  describe('Navegación', () => {
    it('debe navegar a la página de intento cuando se hace click', async () => {
      const user = userEvent.setup()
      renderQuizCard({ quiz: baseQuiz })

      const card = screen.getByText('Quiz de Matemáticas').closest('div')
      if (!card) throw new Error('Card not found')

      await user.click(card)

      expect(mockNavigate).toHaveBeenCalledWith('/quizzes/quiz1/attempt')
    })

    it('debe navegar con el ID correcto para diferentes quizzes', async () => {
      const user = userEvent.setup()
      const quiz = { ...baseQuiz, id: 'quiz-abc-123' }
      renderQuizCard({ quiz })

      const card = screen.getByText('Quiz de Matemáticas').closest('div')
      if (!card) throw new Error('Card not found')

      await user.click(card)

      expect(mockNavigate).toHaveBeenCalledWith('/quizzes/quiz-abc-123/attempt')
    })
  })

  describe('Estilos y clases', () => {
    it('debe tener clase cursor-pointer para indicar que es clickeable', () => {
      const { container } = renderQuizCard({ quiz: baseQuiz })
      const card = container.querySelector('.cursor-pointer')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('cursor-pointer')
    })

    it('debe tener clases de hover', () => {
      const { container } = renderQuizCard({ quiz: baseQuiz })
      const card = container.querySelector('.hover\\:bg-slate-800\\/70')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('hover:bg-slate-800/70')
    })

    it('debe aplicar clase group para efectos hover en hijos', () => {
      const { container } = renderQuizCard({ quiz: baseQuiz })
      const card = container.querySelector('.group')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('group')
    })
  })

  describe('Casos edge', () => {
    it('debe manejar quiz sin intentos', () => {
      const quiz = { ...baseQuiz, num_attempts: 0 }
      renderQuizCard({ quiz })
      expect(screen.getByText('0 intentos')).toBeInTheDocument()
    })

    it('debe manejar quiz con muchos intentos', () => {
      const quiz = { ...baseQuiz, num_attempts: 999 }
      renderQuizCard({ quiz })
      expect(screen.getByText('999 intentos')).toBeInTheDocument()
    })

    it('debe manejar quiz con título largo', () => {
      const quiz = {
        ...baseQuiz,
        title: 'Este es un título muy largo para un quiz que debería truncarse',
      }
      renderQuizCard({ quiz })
      expect(
        screen.getByText(
          'Este es un título muy largo para un quiz que debería truncarse'
        )
      ).toBeInTheDocument()
    })

    it('debe manejar quiz sin document_names', () => {
      const quiz = {
        ...baseQuiz,
        source_type: 'file',
        document_names: [],
      }
      renderQuizCard({ quiz })
      expect(screen.queryByText(/Desde archivo:/)).not.toBeInTheDocument()
    })

    it('debe manejar quiz sin summary_title', () => {
      const quiz = {
        ...baseQuiz,
        source_type: 'summary',
        summary_title: null,
      }
      renderQuizCard({ quiz })
      expect(screen.queryByText(/Desde resumen:/)).not.toBeInTheDocument()
    })

    it('debe manejar quiz sin study_space_name', () => {
      const quiz = {
        ...baseQuiz,
        source_type: 'space',
        study_space_name: null,
      }
      renderQuizCard({ quiz })
      expect(screen.queryByText(/Desde espacio:/)).not.toBeInTheDocument()
    })
  })

  describe('Iconos SVG', () => {
    it('debe renderizar icono para source_type "file"', () => {
      const quiz = { ...baseQuiz, source_type: 'file' }
      const { container } = renderQuizCard({ quiz })
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })

    it('debe renderizar icono para source_type "summary"', () => {
      const quiz = { ...baseQuiz, source_type: 'summary' }
      const { container } = renderQuizCard({ quiz })
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })

    it('debe renderizar icono para source_type "space"', () => {
      const quiz = { ...baseQuiz, source_type: 'space' }
      const { container } = renderQuizCard({ quiz })
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })
  })
})
