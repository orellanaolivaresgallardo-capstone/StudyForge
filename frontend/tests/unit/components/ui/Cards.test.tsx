import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { StatCard } from '@/components/ui/Card/StatCard'
import { DocumentCard } from '@/components/ui/Card/DocumentCard'
import { SpaceCard } from '@/components/ui/Card/SpaceCard'
import type { DocumentResponse, StudySpaceWithStatsResponse } from '@/types'

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(),
  }
})

describe('StatCard', () => {
  describe('Renderizado básico', () => {
    it('debe renderizar title y value', () => {
      render(<StatCard title="Total Resúmenes" value={15} />)
      expect(screen.getByText('Total Resúmenes')).toBeInTheDocument()
      expect(screen.getByText('15')).toBeInTheDocument()
    })

    it('debe renderizar value como string', () => {
      render(<StatCard title="Estado" value="Activo" />)
      expect(screen.getByText('Activo')).toBeInTheDocument()
    })

    it('debe renderizar icon cuando se proporciona', () => {
      render(<StatCard title="Documentos" value={10} icon="📄" />)
      expect(screen.getByText('📄')).toBeInTheDocument()
    })

    it('NO debe renderizar icon cuando no se proporciona', () => {
      const { container } = render(<StatCard title="Docs" value={10} />)
      const icon = container.querySelector('.text-2xl')
      expect(icon).not.toBeInTheDocument()
    })
  })

  describe('Trend indicator', () => {
    it('debe mostrar trend positivo', () => {
      render(
        <StatCard
          title="Progreso"
          value={85}
          trend={{ value: 12, label: 'vs mes anterior', isPositive: true }}
        />
      )
      expect(screen.getByText('↑ 12%')).toBeInTheDocument()
      expect(screen.getByText('vs mes anterior')).toBeInTheDocument()
    })

    it('debe mostrar trend negativo', () => {
      render(
        <StatCard
          title="Errores"
          value={5}
          trend={{ value: 8, label: 'vs semana pasada', isPositive: false }}
        />
      )
      expect(screen.getByText('↓ 8%')).toBeInTheDocument()
    })

    it('debe tratar trend sin isPositive como positivo por defecto', () => {
      render(
        <StatCard
          title="Mejora"
          value={90}
          trend={{ value: 5, label: 'crecimiento' }}
        />
      )
      expect(screen.getByText('↑ 5%')).toBeInTheDocument()
    })

    it('NO debe mostrar trend cuando no se proporciona', () => {
      render(<StatCard title="Total" value={100} />)
      expect(screen.queryByText(/↑|↓/)).not.toBeInTheDocument()
    })
  })

  describe('Prop color', () => {
    it('debe aplicar color violet por defecto', () => {
      const { container } = render(<StatCard title="Test" value={1} />)
      const card = container.querySelector('.bg-gradient-to-br')
      expect(card?.className).toContain('from-violet-500/20')
    })

    it('debe aplicar color blue', () => {
      const { container } = render(<StatCard title="Test" value={1} color="blue" />)
      const card = container.querySelector('.bg-gradient-to-br')
      expect(card?.className).toContain('from-blue-500/20')
    })

    it('debe aplicar color green', () => {
      const { container } = render(<StatCard title="Test" value={1} color="green" />)
      const card = container.querySelector('.bg-gradient-to-br')
      expect(card?.className).toContain('from-green-500/20')
    })

    it('debe aplicar color yellow', () => {
      const { container } = render(<StatCard title="Test" value={1} color="yellow" />)
      const card = container.querySelector('.bg-gradient-to-br')
      expect(card?.className).toContain('from-yellow-500/20')
    })

    it('debe aplicar color red', () => {
      const { container } = render(<StatCard title="Test" value={1} color="red" />)
      const card = container.querySelector('.bg-gradient-to-br')
      expect(card?.className).toContain('from-red-500/20')
    })

    it('debe aplicar color purple', () => {
      const { container } = render(<StatCard title="Test" value={1} color="purple" />)
      const card = container.querySelector('.bg-gradient-to-br')
      expect(card?.className).toContain('from-purple-500/20')
    })
  })
})

describe('DocumentCard', () => {
  const mockDocument: DocumentResponse = {
    id: 'doc-1',
    user_id: 'user-1',
    title: 'Mi Documento',
    file_name: 'documento.pdf',
    file_type: 'pdf',
    file_size_bytes: 1536000, // 1.5 MB
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    study_space_names: ['Matemáticas'],
  }

  describe('Renderizado de información del documento', () => {
    it('debe renderizar title y filename', () => {
      render(<DocumentCard document={mockDocument} />)
      expect(screen.getByText('Mi Documento')).toBeInTheDocument()
      expect(screen.getByText('documento.pdf')).toBeInTheDocument()
    })

    it('debe mostrar icono PDF', () => {
      render(<DocumentCard document={mockDocument} />)
      expect(screen.getByText('📄')).toBeInTheDocument()
    })

    it('debe mostrar icono DOCX', () => {
      const docxDoc = { ...mockDocument, file_type: 'docx', file_name: 'doc.docx' }
      render(<DocumentCard document={docxDoc} />)
      expect(screen.getByText('📘')).toBeInTheDocument()
    })

    it('debe mostrar icono PPTX', () => {
      const pptxDoc = { ...mockDocument, file_type: 'pptx', file_name: 'pres.pptx' }
      render(<DocumentCard document={pptxDoc} />)
      expect(screen.getByText('📊')).toBeInTheDocument()
    })

    it('debe mostrar icono TXT', () => {
      const txtDoc = { ...mockDocument, file_type: 'txt', file_name: 'text.txt' }
      render(<DocumentCard document={txtDoc} />)
      expect(screen.getByText('📝')).toBeInTheDocument()
    })

    it('debe mostrar icono genérico para tipo desconocido', () => {
      const unknownDoc = { ...mockDocument, file_type: 'xyz', file_name: 'file.xyz' }
      render(<DocumentCard document={unknownDoc} />)
      expect(screen.getByText('📁')).toBeInTheDocument()
    })

    it('debe formatear tipo de archivo en mayúsculas', () => {
      render(<DocumentCard document={mockDocument} />)
      expect(screen.getByText('PDF')).toBeInTheDocument()
    })

    it('debe formatear tamaño de archivo correctamente', () => {
      render(<DocumentCard document={mockDocument} />)
      // 1536000 bytes = 1.46 MB
      expect(screen.getByText('1.46 MB')).toBeInTheDocument()
    })

    it('debe formatear 0 bytes como "0 Bytes"', () => {
      const zeroDoc = { ...mockDocument, file_size_bytes: 0 }
      render(<DocumentCard document={zeroDoc} />)
      expect(screen.getByText('0 Bytes')).toBeInTheDocument()
    })
  })

  describe('Acciones del documento', () => {
    it('debe llamar onDelete cuando se hace clic en eliminar', () => {
      const onDelete = vi.fn()
      render(<DocumentCard document={mockDocument} onDelete={onDelete} />)

      const deleteButton = screen.getByTitle('Eliminar documento')
      fireEvent.click(deleteButton)

      expect(onDelete).toHaveBeenCalledWith('doc-1')
    })

    it('debe llamar onCreateSummary cuando se hace clic en "Crear Resumen"', () => {
      const onCreateSummary = vi.fn()
      render(<DocumentCard document={mockDocument} onCreateSummary={onCreateSummary} />)

      const summaryButton = screen.getByText('Crear Resumen')
      fireEvent.click(summaryButton)

      expect(onCreateSummary).toHaveBeenCalledWith(mockDocument)
    })

    it('debe llamar onCreateQuiz cuando se hace clic en "Crear Quiz"', () => {
      const onCreateQuiz = vi.fn()
      render(<DocumentCard document={mockDocument} onCreateQuiz={onCreateQuiz} />)

      const quizButton = screen.getByText('Crear Quiz')
      fireEvent.click(quizButton)

      expect(onCreateQuiz).toHaveBeenCalledWith(mockDocument)
    })

    it('NO debe mostrar botón de eliminar si onDelete no se proporciona', () => {
      render(<DocumentCard document={mockDocument} />)
      expect(screen.queryByTitle('Eliminar documento')).not.toBeInTheDocument()
    })

    it('NO debe mostrar acciones si showActions=false', () => {
      render(
        <DocumentCard
          document={mockDocument}
          onDelete={vi.fn()}
          onCreateSummary={vi.fn()}
          onCreateQuiz={vi.fn()}
          showActions={false}
        />
      )
      expect(screen.queryByTitle('Eliminar documento')).not.toBeInTheDocument()
      expect(screen.queryByText('Crear Resumen')).not.toBeInTheDocument()
      expect(screen.queryByText('Crear Quiz')).not.toBeInTheDocument()
    })
  })
})

describe('SpaceCard', () => {
  const mockSpace: StudySpaceWithStatsResponse = {
    id: 'space-1',
    user_id: 'user-1',
    name: 'Matemáticas',
    description: 'Espacio de matemáticas avanzadas',
    color: '#3B82F6',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    num_documents: 5,
    num_summaries: 3,
    num_quizzes: 2,
    avg_score: 85.5,
  }

  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
  })

  describe('Renderizado de información del espacio', () => {
    it('debe renderizar name y description', () => {
      render(
        <MemoryRouter>
          <SpaceCard space={mockSpace} onEdit={vi.fn()} onDelete={vi.fn()} />
        </MemoryRouter>
      )
      expect(screen.getByText('Matemáticas')).toBeInTheDocument()
      expect(screen.getByText('Espacio de matemáticas avanzadas')).toBeInTheDocument()
    })

    it('NO debe renderizar description si es null', () => {
      const spaceWithoutDesc = { ...mockSpace, description: null }
      render(
        <MemoryRouter>
          <SpaceCard space={spaceWithoutDesc} onEdit={vi.fn()} onDelete={vi.fn()} />
        </MemoryRouter>
      )
      expect(screen.queryByText('Espacio de matemáticas avanzadas')).not.toBeInTheDocument()
    })

    it('debe mostrar avg_score formateado', () => {
      render(
        <MemoryRouter>
          <SpaceCard space={mockSpace} onEdit={vi.fn()} onDelete={vi.fn()} />
        </MemoryRouter>
      )
      expect(screen.getByText('85.5%')).toBeInTheDocument()
    })

    it('debe mostrar estadísticas de documentos, resúmenes y quizzes', () => {
      render(
        <MemoryRouter>
          <SpaceCard space={mockSpace} onEdit={vi.fn()} onDelete={vi.fn()} />
        </MemoryRouter>
      )
      expect(screen.getByText('5')).toBeInTheDocument() // num_documents
      expect(screen.getByText('3')).toBeInTheDocument() // num_summaries
      expect(screen.getByText('2')).toBeInTheDocument() // num_quizzes
    })

    it('debe formatear fecha de creación', () => {
      render(
        <MemoryRouter>
          <SpaceCard space={mockSpace} onEdit={vi.fn()} onDelete={vi.fn()} />
        </MemoryRouter>
      )
      // 2024-01-15 → 15/1/2024 (formato es-ES puede variar)
      expect(screen.getByText(/Creado el/i)).toBeInTheDocument()
    })
  })

  describe('Navegación', () => {
    it('debe navegar al espacio cuando se hace clic en la card', () => {
      render(
        <MemoryRouter>
          <SpaceCard space={mockSpace} onEdit={vi.fn()} onDelete={vi.fn()} />
        </MemoryRouter>
      )

      const card = screen.getByText('Matemáticas').closest('div')!
      fireEvent.click(card)

      expect(mockNavigate).toHaveBeenCalledWith('/study-spaces/space-1')
    })
  })

  describe('Acciones del espacio', () => {
    it('debe llamar onEdit cuando se hace clic en editar', () => {
      const onEdit = vi.fn()
      const { container } = render(
        <MemoryRouter>
          <SpaceCard space={mockSpace} onEdit={onEdit} onDelete={vi.fn()} />
        </MemoryRouter>
      )

      // Botón de editar (primer botón con SVG)
      const editButton = container.querySelectorAll('button')[0]
      fireEvent.click(editButton)

      expect(onEdit).toHaveBeenCalledWith(mockSpace)
      expect(mockNavigate).not.toHaveBeenCalled() // No debe navegar
    })

    it('debe llamar onDelete cuando se hace clic en eliminar', () => {
      const onDelete = vi.fn()
      const { container } = render(
        <MemoryRouter>
          <SpaceCard space={mockSpace} onEdit={vi.fn()} onDelete={onDelete} />
        </MemoryRouter>
      )

      // Botón de eliminar (segundo botón con SVG)
      const deleteButton = container.querySelectorAll('button')[1]
      fireEvent.click(deleteButton)

      expect(onDelete).toHaveBeenCalledWith('space-1', 'Matemáticas')
      expect(mockNavigate).not.toHaveBeenCalled() // No debe navegar
    })

    it('debe evitar propagación de eventos en botones de acción', () => {
      const onEdit = vi.fn()
      const { container } = render(
        <MemoryRouter>
          <SpaceCard space={mockSpace} onEdit={onEdit} onDelete={vi.fn()} />
        </MemoryRouter>
      )

      const editButton = container.querySelectorAll('button')[0]
      fireEvent.click(editButton)

      expect(onEdit).toHaveBeenCalledTimes(1)
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('Estilo del color', () => {
    it('debe aplicar color personalizado al icono', () => {
      const { container } = render(
        <MemoryRouter>
          <SpaceCard space={mockSpace} onEdit={vi.fn()} onDelete={vi.fn()} />
        </MemoryRouter>
      )

      const colorBox = container.querySelector('.w-12.h-12')
      expect(colorBox).toHaveStyle({ backgroundColor: '#3B82F6' })
    })
  })
})
