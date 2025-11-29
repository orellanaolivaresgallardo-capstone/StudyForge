import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PerformanceChart from '@/components/features/PerformanceChart'
import type { RecentAttempt } from '@/types'

// Mock Recharts para evitar problemas de renderizado SVG en tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children, height }: any) => (
    <div data-testid="responsive-container" data-height={height}>
      {children}
    </div>
  ),
  LineChart: ({ data, children }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke, name }: any) => (
    <div data-testid="line" data-key={dataKey} data-stroke={stroke} data-name={name} />
  ),
  XAxis: ({ dataKey }: any) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: ({ domain, label }: any) => (
    <div data-testid="y-axis" data-domain={JSON.stringify(domain)} data-label={label?.value} />
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: ({ content }: any) => <div data-testid="tooltip">{content}</div>,
  Legend: () => <div data-testid="legend" />,
}))

describe('PerformanceChart', () => {
  const mockAttempts: RecentAttempt[] = [
    {
      attempt_id: 'attempt-1',
      quiz_id: 'quiz-1',
      quiz_title: 'Quiz de Matemáticas',
      difficulty_level: 3,
      score: 85.5,
      completed_at: '2024-01-15T10:00:00Z',
      study_space_id: 'space-1',
    },
    {
      attempt_id: 'attempt-2',
      quiz_id: 'quiz-2',
      quiz_title: 'Quiz de Historia',
      difficulty_level: 2,
      score: 92.3,
      completed_at: '2024-01-16T14:30:00Z',
      study_space_id: 'space-2',
    },
    {
      attempt_id: 'attempt-3',
      quiz_id: 'quiz-3',
      quiz_title: 'Quiz de Ciencias',
      difficulty_level: 4,
      score: 78.9,
      completed_at: '2024-01-17T09:15:00Z',
      study_space_id: 'space-1',
    },
  ]

  describe('Empty state', () => {
    it('debe mostrar mensaje cuando no hay attempts', () => {
      render(<PerformanceChart attempts={[]} />)
      expect(screen.getByText('No performance data available yet.')).toBeInTheDocument()
    })

    it('NO debe renderizar gráfico cuando attempts está vacío', () => {
      render(<PerformanceChart attempts={[]} />)
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
    })

    it('debe mostrar contenedor con estilos correctos en empty state', () => {
      const { container } = render(<PerformanceChart attempts={[]} />)
      const emptyDiv = container.querySelector('.bg-gray-50.rounded-lg')
      expect(emptyDiv).toBeInTheDocument()
      expect(emptyDiv?.className).toContain('h-64')
    })
  })

  describe('Renderizado con datos', () => {
    it('debe renderizar gráfico cuando hay attempts', () => {
      render(<PerformanceChart attempts={mockAttempts} />)
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('NO debe mostrar mensaje de empty state cuando hay datos', () => {
      render(<PerformanceChart attempts={mockAttempts} />)
      expect(screen.queryByText('No performance data available yet.')).not.toBeInTheDocument()
    })

    it('debe renderizar ResponsiveContainer con height por defecto (300)', () => {
      render(<PerformanceChart attempts={mockAttempts} />)
      const container = screen.getByTestId('responsive-container')
      expect(container).toHaveAttribute('data-height', '300')
    })

    it('debe usar height personalizado cuando se proporciona', () => {
      render(<PerformanceChart attempts={mockAttempts} height={500} />)
      const container = screen.getByTestId('responsive-container')
      expect(container).toHaveAttribute('data-height', '500')
    })
  })

  describe('Transformación de datos', () => {
    it('debe transformar attempts en formato de gráfico', () => {
      const { container } = render(<PerformanceChart attempts={mockAttempts} />)
      const lineChart = screen.getByTestId('line-chart')
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]')

      expect(chartData).toHaveLength(3)
    })

    it('debe invertir el orden de attempts (más reciente al final)', () => {
      const { container } = render(<PerformanceChart attempts={mockAttempts} />)
      const lineChart = screen.getByTestId('line-chart')
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]')

      // mockAttempts: [Matemáticas (15 ene), Historia (16 ene), Ciencias (17 ene)]
      // Después de reverse: [Ciencias (17 ene), Historia (16 ene), Matemáticas (15 ene)]
      expect(chartData[0].quizTitle).toBe('Quiz de Ciencias')
      expect(chartData[2].quizTitle).toBe('Quiz de Matemáticas')
    })

    it('debe redondear scores con Math.round()', () => {
      const { container } = render(<PerformanceChart attempts={mockAttempts} />)
      const lineChart = screen.getByTestId('line-chart')
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]')

      // Orden invertido: Ciencias, Historia, Matemáticas
      expect(chartData[0].score).toBe(79) // 78.9 → 79 (Ciencias)
      expect(chartData[1].score).toBe(92) // 92.3 → 92 (Historia)
      expect(chartData[2].score).toBe(86) // 85.5 → 86 (Matemáticas)
    })

    it('debe formatear fechas con toLocaleDateString', () => {
      const { container } = render(<PerformanceChart attempts={mockAttempts} />)
      const lineChart = screen.getByTestId('line-chart')
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]')

      // Las fechas deben estar formateadas (ej: "15 ene")
      expect(chartData[0].date).toMatch(/\d{1,2}\s\w{3}/)
    })

    it('debe incluir quizTitle en datos transformados', () => {
      const { container } = render(<PerformanceChart attempts={mockAttempts} />)
      const lineChart = screen.getByTestId('line-chart')
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]')

      // Orden invertido: Ciencias, Historia, Matemáticas
      expect(chartData[0].quizTitle).toBe('Quiz de Ciencias')
      expect(chartData[1].quizTitle).toBe('Quiz de Historia')
      expect(chartData[2].quizTitle).toBe('Quiz de Matemáticas')
    })
  })

  describe('Configuración del gráfico', () => {
    it('debe renderizar LineChart con datos transformados', () => {
      render(<PerformanceChart attempts={mockAttempts} />)
      const lineChart = screen.getByTestId('line-chart')
      expect(lineChart).toBeInTheDocument()
    })

    it('debe renderizar XAxis con dataKey="date"', () => {
      render(<PerformanceChart attempts={mockAttempts} />)
      const xAxis = screen.getByTestId('x-axis')
      expect(xAxis).toHaveAttribute('data-key', 'date')
    })

    it('debe renderizar YAxis con domain [0, 100]', () => {
      render(<PerformanceChart attempts={mockAttempts} />)
      const yAxis = screen.getByTestId('y-axis')
      expect(yAxis).toHaveAttribute('data-domain', '[0,100]')
    })

    it('debe renderizar YAxis con label "Score (%)"', () => {
      render(<PerformanceChart attempts={mockAttempts} />)
      const yAxis = screen.getByTestId('y-axis')
      expect(yAxis).toHaveAttribute('data-label', 'Score (%)')
    })

    it('debe renderizar Line con dataKey="score"', () => {
      render(<PerformanceChart attempts={mockAttempts} />)
      const line = screen.getByTestId('line')
      expect(line).toHaveAttribute('data-key', 'score')
    })

    it('debe usar color violeta (#7C3AED) para la línea', () => {
      render(<PerformanceChart attempts={mockAttempts} />)
      const line = screen.getByTestId('line')
      expect(line).toHaveAttribute('data-stroke', '#7C3AED')
    })

    it('debe nombrar la línea como "Performance"', () => {
      render(<PerformanceChart attempts={mockAttempts} />)
      const line = screen.getByTestId('line')
      expect(line).toHaveAttribute('data-name', 'Performance')
    })

    it('debe renderizar CartesianGrid', () => {
      render(<PerformanceChart attempts={mockAttempts} />)
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
    })

    it('debe renderizar Tooltip', () => {
      render(<PerformanceChart attempts={mockAttempts} />)
      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    })

    it('debe renderizar Legend', () => {
      render(<PerformanceChart attempts={mockAttempts} />)
      expect(screen.getByTestId('legend')).toBeInTheDocument()
    })
  })

  describe('Casos edge', () => {
    it('debe manejar un solo attempt', () => {
      const singleAttempt = [mockAttempts[0]]
      render(<PerformanceChart attempts={singleAttempt} />)

      const lineChart = screen.getByTestId('line-chart')
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]')

      expect(chartData).toHaveLength(1)
      expect(chartData[0].quizTitle).toBe('Quiz de Matemáticas')
    })

    it('debe manejar muchos attempts (>10)', () => {
      const manyAttempts: RecentAttempt[] = Array.from({ length: 15 }, (_, i) => ({
        attempt_id: `attempt-${i}`,
        quiz_id: `quiz-${i}`,
        quiz_title: `Quiz ${i}`,
        difficulty_level: 3,
        score: 80 + i,
        completed_at: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
        study_space_id: 'space-1',
      }))

      render(<PerformanceChart attempts={manyAttempts} />)

      const lineChart = screen.getByTestId('line-chart')
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]')

      expect(chartData).toHaveLength(15)
    })

    it('debe manejar score de 0', () => {
      const zeroScoreAttempt: RecentAttempt = {
        ...mockAttempts[0],
        score: 0,
      }

      render(<PerformanceChart attempts={[zeroScoreAttempt]} />)

      const lineChart = screen.getByTestId('line-chart')
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]')

      expect(chartData[0].score).toBe(0)
    })

    it('debe manejar score de 100', () => {
      const perfectScoreAttempt: RecentAttempt = {
        ...mockAttempts[0],
        score: 100,
      }

      render(<PerformanceChart attempts={[perfectScoreAttempt]} />)

      const lineChart = screen.getByTestId('line-chart')
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]')

      expect(chartData[0].score).toBe(100)
    })

    it('debe manejar study_space_id null', () => {
      const noSpaceAttempt: RecentAttempt = {
        ...mockAttempts[0],
        study_space_id: null,
      }

      render(<PerformanceChart attempts={[noSpaceAttempt]} />)

      const lineChart = screen.getByTestId('line-chart')
      expect(lineChart).toBeInTheDocument()
    })
  })
})
