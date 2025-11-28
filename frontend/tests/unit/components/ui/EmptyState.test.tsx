import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmptyState from '@/components/ui/EmptyState'

describe('EmptyState', () => {
  const mockIcon = (
    <svg data-testid="test-icon">
      <path />
    </svg>
  )

  describe('Renderizado básico', () => {
    it('debe renderizar título y descripción', () => {
      render(
        <EmptyState
          icon={mockIcon}
          title="No hay documentos"
          description="Aún no has subido ningún documento"
        />
      )

      expect(screen.getByText('No hay documentos')).toBeInTheDocument()
      expect(screen.getByText('Aún no has subido ningún documento')).toBeInTheDocument()
    })

    it('debe renderizar el icono', () => {
      render(
        <EmptyState
          icon={mockIcon}
          title="Vacío"
          description="Sin contenido"
        />
      )

      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('debe renderizar sin acción', () => {
      render(
        <EmptyState
          icon={mockIcon}
          title="Sin datos"
          description="No hay información disponible"
        />
      )

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('Acción opcional', () => {
    it('debe renderizar botón de acción cuando se proporciona', () => {
      render(
        <EmptyState
          icon={mockIcon}
          title="No hay documentos"
          description="Comienza subiendo tu primer documento"
          action={{
            label: 'Subir Documento',
            onClick: () => {},
          }}
        />
      )

      expect(screen.getByRole('button', { name: 'Subir Documento' })).toBeInTheDocument()
    })

    it('debe llamar onClick cuando se hace click en el botón', async () => {
      const onClick = vi.fn()
      const user = userEvent.setup()

      render(
        <EmptyState
          icon={mockIcon}
          title="Vacío"
          description="Sin datos"
          action={{
            label: 'Crear Nuevo',
            onClick,
          }}
        />
      )

      const button = screen.getByRole('button', { name: 'Crear Nuevo' })
      await user.click(button)

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('debe permitir múltiples clicks', async () => {
      const onClick = vi.fn()
      const user = userEvent.setup()

      render(
        <EmptyState
          icon={mockIcon}
          title="Vacío"
          description="Sin datos"
          action={{
            label: 'Acción',
            onClick,
          }}
        />
      )

      const button = screen.getByRole('button', { name: 'Acción' })
      await user.click(button)
      await user.click(button)
      await user.click(button)

      expect(onClick).toHaveBeenCalledTimes(3)
    })
  })

  describe('Diferentes tipos de iconos', () => {
    it('debe aceptar un SVG como icono', () => {
      const svgIcon = (
        <svg data-testid="svg-icon" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
        </svg>
      )

      render(
        <EmptyState
          icon={svgIcon}
          title="Vacío"
          description="Sin contenido"
        />
      )

      expect(screen.getByTestId('svg-icon')).toBeInTheDocument()
    })

    it('debe aceptar un emoji como icono', () => {
      const emojiIcon = <span data-testid="emoji-icon">📄</span>

      render(
        <EmptyState
          icon={emojiIcon}
          title="Sin documentos"
          description="Agrega tu primer documento"
        />
      )

      expect(screen.getByTestId('emoji-icon')).toBeInTheDocument()
      expect(screen.getByText('📄')).toBeInTheDocument()
    })

    it('debe aceptar un componente personalizado como icono', () => {
      const CustomIcon = () => <div data-testid="custom-icon">Custom</div>

      render(
        <EmptyState
          icon={<CustomIcon />}
          title="Vacío"
          description="Sin datos"
        />
      )

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    })
  })

  describe('Contenido de texto', () => {
    it('debe manejar títulos largos', () => {
      const longTitle = 'Este es un título muy largo que debería mostrarse completamente'

      render(
        <EmptyState
          icon={mockIcon}
          title={longTitle}
          description="Descripción"
        />
      )

      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('debe manejar descripciones largas', () => {
      const longDescription =
        'Esta es una descripción muy larga que proporciona mucha información al usuario sobre por qué no hay contenido disponible y qué puede hacer al respecto.'

      render(
        <EmptyState
          icon={mockIcon}
          title="Vacío"
          description={longDescription}
        />
      )

      expect(screen.getByText(longDescription)).toBeInTheDocument()
    })

    it('debe manejar caracteres especiales en título y descripción', () => {
      render(
        <EmptyState
          icon={mockIcon}
          title="¡No hay quizzes!"
          description="Aún no has creado ningún quiz. ¿Por qué no empiezas ahora?"
        />
      )

      expect(screen.getByText('¡No hay quizzes!')).toBeInTheDocument()
      expect(
        screen.getByText('Aún no has creado ningún quiz. ¿Por qué no empiezas ahora?')
      ).toBeInTheDocument()
    })
  })

  describe('Estructura semántica', () => {
    it('debe usar h3 para el título', () => {
      render(
        <EmptyState
          icon={mockIcon}
          title="Mi Título"
          description="Descripción"
        />
      )

      const title = screen.getByText('Mi Título')
      expect(title.tagName).toBe('H3')
    })

    it('debe usar p para la descripción', () => {
      render(
        <EmptyState
          icon={mockIcon}
          title="Título"
          description="Mi Descripción"
        />
      )

      const description = screen.getByText('Mi Descripción')
      expect(description.tagName).toBe('P')
    })

    it('debe tener estructura jerárquica correcta', () => {
      const { container } = render(
        <EmptyState
          icon={mockIcon}
          title="Título"
          description="Descripción"
          action={{
            label: 'Acción',
            onClick: () => {},
          }}
        />
      )

      // Verificar que el icono esté dentro de un contenedor
      const iconContainer = container.querySelector('.inline-flex')
      expect(iconContainer).toBeInTheDocument()

      // Verificar que todos los elementos existen
      expect(screen.getByText('Título')).toBeInTheDocument()
      expect(screen.getByText('Descripción')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Acción' })).toBeInTheDocument()
    })
  })

  describe('Casos de uso reales', () => {
    it('debe renderizar estado vacío de documentos', () => {
      const documentIcon = (
        <svg data-testid="document-icon" className="w-8 h-8">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )

      render(
        <EmptyState
          icon={documentIcon}
          title="No tienes documentos"
          description="Sube tu primer documento para comenzar a estudiar"
          action={{
            label: 'Subir Documento',
            onClick: () => {},
          }}
        />
      )

      expect(screen.getByText('No tienes documentos')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Subir Documento' })).toBeInTheDocument()
    })

    it('debe renderizar estado vacío de quizzes', () => {
      const quizIcon = <span data-testid="quiz-icon">📝</span>

      render(
        <EmptyState
          icon={quizIcon}
          title="No hay quizzes disponibles"
          description="Genera tu primer quiz desde un documento o resumen"
          action={{
            label: 'Generar Quiz',
            onClick: () => {},
          }}
        />
      )

      expect(screen.getByText('No hay quizzes disponibles')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Generar Quiz' })).toBeInTheDocument()
    })

    it('debe renderizar estado vacío de resultados de búsqueda', () => {
      const searchIcon = <span data-testid="search-icon">🔍</span>

      render(
        <EmptyState
          icon={searchIcon}
          title="No se encontraron resultados"
          description="Intenta con otros términos de búsqueda"
        />
      )

      expect(screen.getByText('No se encontraron resultados')).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })
})
