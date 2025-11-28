import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from '@/components/ui/Modal'

describe('Modal', () => {
  beforeEach(() => {
    // Reset body overflow before each test
    document.body.style.overflow = ''
  })

  afterEach(() => {
    // Cleanup body overflow after each test
    document.body.style.overflow = ''
  })

  describe('Renderizado básico', () => {
    it('NO debe renderizar cuando isOpen=false', () => {
      render(
        <Modal isOpen={false} onClose={() => {}}>
          <div>Modal Content</div>
        </Modal>
      )

      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument()
    })

    it('debe renderizar cuando isOpen=true', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Modal Content</div>
        </Modal>
      )

      expect(screen.getByText('Modal Content')).toBeInTheDocument()
    })

    it('debe renderizar children correctamente', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>
            <h1>Title</h1>
            <p>Description</p>
            <button>Action</button>
          </div>
        </Modal>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
    })

    it('debe renderizar título cuando se provee', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Mi Modal">
          <div>Content</div>
        </Modal>
      )

      expect(screen.getByText('Mi Modal')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Mi Modal' })).toBeInTheDocument()
    })

    it('NO debe renderizar título cuando no se provee', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      )

      expect(container.querySelector('h2')).not.toBeInTheDocument()
    })
  })

  describe('Botón de cerrar', () => {
    it('debe mostrar botón de cerrar por defecto', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      )

      expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
    })

    it('debe llamar onClose al hacer click en botón de cerrar', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      render(
        <Modal isOpen={true} onClose={onClose}>
          <div>Content</div>
        </Modal>
      )

      const closeButton = screen.getByLabelText('Close modal')
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('NO debe mostrar botón de cerrar cuando showCloseButton=false', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} showCloseButton={false}>
          <div>Content</div>
        </Modal>
      )

      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument()
    })

    it('debe mostrar botón de cerrar cuando showCloseButton=true', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} showCloseButton={true}>
          <div>Content</div>
        </Modal>
      )

      expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
    })
  })

  describe('Tecla ESC', () => {
    it('debe llamar onClose al presionar ESC', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      render(
        <Modal isOpen={true} onClose={onClose}>
          <div>Content</div>
        </Modal>
      )

      await user.keyboard('{Escape}')

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('NO debe llamar onClose al presionar ESC si isOpen=false', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      const { rerender } = render(
        <Modal isOpen={true} onClose={onClose}>
          <div>Content</div>
        </Modal>
      )

      // Cerrar el modal
      rerender(
        <Modal isOpen={false} onClose={onClose}>
          <div>Content</div>
        </Modal>
      )

      await user.keyboard('{Escape}')

      // No debe llamarse porque el modal está cerrado
      expect(onClose).not.toHaveBeenCalled()
    })

    it('NO debe llamar onClose con otras teclas', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      render(
        <Modal isOpen={true} onClose={onClose}>
          <div>Content</div>
        </Modal>
      )

      await user.keyboard('{Enter}')
      await user.keyboard('{Space}')
      await user.keyboard('a')

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('Click en backdrop', () => {
    it('debe llamar onClose al hacer click en backdrop', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      const { container } = render(
        <Modal isOpen={true} onClose={onClose}>
          <div>Content</div>
        </Modal>
      )

      // Click en el backdrop (el div con role="dialog")
      const backdrop = container.querySelector('[role="dialog"]')
      expect(backdrop).toBeInTheDocument()

      await user.click(backdrop!)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('NO debe llamar onClose al hacer click dentro del modal', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      render(
        <Modal isOpen={true} onClose={onClose}>
          <div>Modal Content</div>
        </Modal>
      )

      // Click en el contenido del modal
      const content = screen.getByText('Modal Content')
      await user.click(content)

      expect(onClose).not.toHaveBeenCalled()
    })

    it('NO debe llamar onClose al hacer click en el título', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      render(
        <Modal isOpen={true} onClose={onClose} title="Mi Modal">
          <div>Content</div>
        </Modal>
      )

      const title = screen.getByText('Mi Modal')
      await user.click(title)

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('Gestión de scroll del body', () => {
    it('debe bloquear scroll del body cuando se abre', () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      )

      expect(document.body.style.overflow).toBe('')

      // Abrir modal
      rerender(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      )

      expect(document.body.style.overflow).toBe('hidden')
    })

    it('debe restaurar scroll del body cuando se cierra', async () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      )

      expect(document.body.style.overflow).toBe('hidden')

      // Cerrar modal
      rerender(
        <Modal isOpen={false} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      )

      // Esperar a que termine la animación (200ms)
      await waitFor(
        () => {
          expect(document.body.style.overflow).toBe('')
        },
        { timeout: 300 }
      )
    })

    it('debe restaurar scroll del body cuando se desmonta', () => {
      const { unmount } = render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      )

      expect(document.body.style.overflow).toBe('hidden')

      unmount()

      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('Tamaños', () => {
    it('debe usar tamaño "md" por defecto', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      )

      const modalContent = container.querySelector('.max-w-lg')
      expect(modalContent).toBeInTheDocument()
    })

    it('debe aplicar tamaño "sm"', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} size="sm">
          <div>Content</div>
        </Modal>
      )

      const modalContent = container.querySelector('.max-w-md')
      expect(modalContent).toBeInTheDocument()
    })

    it('debe aplicar tamaño "lg"', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} size="lg">
          <div>Content</div>
        </Modal>
      )

      const modalContent = container.querySelector('.max-w-2xl')
      expect(modalContent).toBeInTheDocument()
    })

    it('debe aplicar tamaño "xl"', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} size="xl">
          <div>Content</div>
        </Modal>
      )

      const modalContent = container.querySelector('.max-w-4xl')
      expect(modalContent).toBeInTheDocument()
    })
  })

  describe('Accesibilidad', () => {
    it('debe tener role="dialog"', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      )

      expect(container.querySelector('[role="dialog"]')).toBeInTheDocument()
    })

    it('debe tener aria-modal="true"', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      )

      const dialog = container.querySelector('[role="dialog"]')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('debe tener aria-labelledby cuando hay título', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Mi Modal">
          <div>Content</div>
        </Modal>
      )

      const dialog = container.querySelector('[role="dialog"]')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')

      const title = container.querySelector('#modal-title')
      expect(title).toHaveTextContent('Mi Modal')
    })

    it('NO debe tener aria-labelledby cuando no hay título', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      )

      const dialog = container.querySelector('[role="dialog"]')
      expect(dialog).not.toHaveAttribute('aria-labelledby')
    })
  })

  describe('Animaciones', () => {
    it('debe desaparecer después de cerrar (timeout de 200ms)', async () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()

      // Cerrar modal
      rerender(
        <Modal isOpen={false} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      )

      // Todavía visible durante la animación
      expect(screen.getByText('Content')).toBeInTheDocument()

      // Esperar a que termine la animación
      await waitFor(
        () => {
          expect(screen.queryByText('Content')).not.toBeInTheDocument()
        },
        { timeout: 300 }
      )
    })
  })

  describe('Múltiples interacciones', () => {
    it('debe manejar múltiples aperturas y cierres', async () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      )

      // Abrir
      rerender(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()

      // Cerrar
      rerender(
        <Modal isOpen={false} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      )

      await waitFor(
        () => {
          expect(screen.queryByText('Content')).not.toBeInTheDocument()
        },
        { timeout: 300 }
      )

      // Abrir de nuevo
      rerender(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('debe permitir múltiples formas de cerrar', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      const { rerender } = render(
        <Modal isOpen={true} onClose={onClose}>
          <div>Content</div>
        </Modal>
      )

      // Cerrar con ESC
      await user.keyboard('{Escape}')
      expect(onClose).toHaveBeenCalledTimes(1)

      // Cerrar con botón
      const closeButton = screen.getByLabelText('Close modal')
      await user.click(closeButton)
      expect(onClose).toHaveBeenCalledTimes(2)
    })
  })
})
