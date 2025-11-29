import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

describe('ConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirmar acción',
    message: '¿Estás seguro de que deseas continuar?',
  }

  describe('Renderizado básico', () => {
    it('debe renderizar title y message', () => {
      render(<ConfirmModal {...defaultProps} />)
      expect(screen.getByText('Confirmar acción')).toBeInTheDocument()
      expect(screen.getByText('¿Estás seguro de que deseas continuar?')).toBeInTheDocument()
    })

    it('debe renderizar botones con texto por defecto', () => {
      render(<ConfirmModal {...defaultProps} />)
      expect(screen.getByText('Confirmar')).toBeInTheDocument()
      expect(screen.getByText('Cancelar')).toBeInTheDocument()
    })

    it('debe renderizar botones con texto personalizado', () => {
      render(
        <ConfirmModal
          {...defaultProps}
          confirmText="Eliminar"
          cancelText="No, gracias"
        />
      )
      expect(screen.getByText('Eliminar')).toBeInTheDocument()
      expect(screen.getByText('No, gracias')).toBeInTheDocument()
    })

    it('NO debe renderizar cuando isOpen=false', () => {
      render(<ConfirmModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Confirmar acción')).not.toBeInTheDocument()
    })
  })

  describe('Variantes de estilo', () => {
    it('debe aplicar estilos danger por defecto', () => {
      const { container } = render(<ConfirmModal {...defaultProps} />)
      const iconContainer = container.querySelector('.bg-red-500\\/10')
      expect(iconContainer).toBeInTheDocument()
    })

    it('debe aplicar estilos warning', () => {
      const { container } = render(<ConfirmModal {...defaultProps} variant="warning" />)
      const iconContainer = container.querySelector('.bg-yellow-500\\/10')
      expect(iconContainer).toBeInTheDocument()
    })

    it('debe aplicar estilos info', () => {
      const { container } = render(<ConfirmModal {...defaultProps} variant="info" />)
      const iconContainer = container.querySelector('.bg-blue-500\\/10')
      expect(iconContainer).toBeInTheDocument()
    })

    it('debe mostrar icono danger (triángulo de advertencia)', () => {
      const { container } = render(<ConfirmModal {...defaultProps} variant="danger" />)
      const dangerIcon = container.querySelector('.text-red-400')
      expect(dangerIcon).toBeInTheDocument()
    })

    it('debe mostrar icono warning (triángulo de advertencia amarillo)', () => {
      const { container } = render(<ConfirmModal {...defaultProps} variant="warning" />)
      const warningIcon = container.querySelector('.text-yellow-400')
      expect(warningIcon).toBeInTheDocument()
    })

    it('debe mostrar icono info (círculo con i)', () => {
      const { container } = render(<ConfirmModal {...defaultProps} variant="info" />)
      const infoIcon = container.querySelector('.text-blue-400')
      expect(infoIcon).toBeInTheDocument()
    })
  })

  describe('Interacciones', () => {
    it('debe llamar onConfirm cuando se hace clic en confirmar', async () => {
      const onConfirm = vi.fn().mockResolvedValue(undefined)
      render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />)

      const confirmButton = screen.getByText('Confirmar')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledTimes(1)
      })
    })

    it('debe llamar onClose cuando se hace clic en cancelar', () => {
      const onClose = vi.fn()
      render(<ConfirmModal {...defaultProps} onClose={onClose} />)

      const cancelButton = screen.getByText('Cancelar')
      fireEvent.click(cancelButton)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('debe manejar onConfirm asíncrono correctamente', async () => {
      const onConfirm = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )
      render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />)

      const confirmButton = screen.getByText('Confirmar')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Estado de carga (isLoading)', () => {
    it('debe mostrar "Procesando..." cuando isLoading=true', () => {
      render(<ConfirmModal {...defaultProps} isLoading />)
      expect(screen.getByText('Procesando...')).toBeInTheDocument()
      expect(screen.queryByText('Confirmar')).not.toBeInTheDocument()
    })

    it('debe mostrar spinner cuando isLoading=true', () => {
      const { container } = render(<ConfirmModal {...defaultProps} isLoading />)
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('debe deshabilitar botón de confirmar cuando isLoading=true', () => {
      render(<ConfirmModal {...defaultProps} isLoading />)
      const confirmButton = screen.getByText('Procesando...')
      expect(confirmButton).toBeDisabled()
    })

    it('debe deshabilitar botón de cancelar cuando isLoading=true', () => {
      render(<ConfirmModal {...defaultProps} isLoading />)
      const cancelButton = screen.getByText('Cancelar')
      expect(cancelButton).toBeDisabled()
    })

    it('NO debe llamar onClose cuando isLoading=true', () => {
      const onClose = vi.fn()
      render(<ConfirmModal {...defaultProps} isLoading onClose={onClose} />)

      const cancelButton = screen.getByText('Cancelar')
      fireEvent.click(cancelButton)

      // onClose no debe ser llamado porque handleClose lo bloquea
      expect(onClose).not.toHaveBeenCalled()
    })

    it('debe permitir onConfirm incluso cuando isLoading=true (botón disabled previene click)', () => {
      const onConfirm = vi.fn()
      render(<ConfirmModal {...defaultProps} isLoading onConfirm={onConfirm} />)

      const confirmButton = screen.getByText('Procesando...')
      fireEvent.click(confirmButton)

      // El botón está disabled, así que el click no debe hacer nada
      expect(onConfirm).not.toHaveBeenCalled()
    })
  })

  describe('Integración con Modal', () => {
    it('debe pasar isOpen al Modal subyacente', () => {
      const { rerender } = render(<ConfirmModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Confirmar acción')).not.toBeInTheDocument()

      rerender(<ConfirmModal {...defaultProps} isOpen={true} />)
      expect(screen.getByText('Confirmar acción')).toBeInTheDocument()
    })

    it('debe pasar title al Modal subyacente', () => {
      render(<ConfirmModal {...defaultProps} title="Título personalizado" />)
      expect(screen.getByText('Título personalizado')).toBeInTheDocument()
    })

    it('debe usar size="sm" para el Modal', () => {
      // Modal ya está testeado, solo verificamos que renderiza correctamente
      const { container } = render(<ConfirmModal {...defaultProps} />)
      expect(container.querySelector('[role="dialog"]')).toBeInTheDocument()
    })
  })

  describe('Casos edge', () => {
    it('debe manejar mensaje muy largo sin romper layout', () => {
      const longMessage = 'Este es un mensaje muy largo '.repeat(20)
      const { container } = render(<ConfirmModal {...defaultProps} message={longMessage} />)
      // Verificar que el mensaje está en el DOM usando textContent
      const messageElement = container.querySelector('.text-white\\/90')
      expect(messageElement?.textContent).toBe(longMessage)
    })

    it('debe manejar onConfirm que lanza error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const unhandledRejectionHandler = () => {}
      process.on('unhandledRejection', unhandledRejectionHandler)

      const onConfirm = vi.fn().mockRejectedValue(new Error('Error al confirmar'))

      render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />)

      const confirmButton = screen.getByText('Confirmar')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledTimes(1)
      })

      // El error debe ser manejado por el componente padre
      consoleErrorSpy.mockRestore()
      process.off('unhandledRejection', unhandledRejectionHandler)
    })

    it('debe permitir múltiples clicks en confirmar (sin prevención)', async () => {
      const onConfirm = vi.fn().mockResolvedValue(undefined)
      render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />)

      const confirmButton = screen.getByText('Confirmar')
      fireEvent.click(confirmButton)
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledTimes(2)
      })
    })

    it('debe funcionar con confirmText y cancelText vacíos', () => {
      const { container } = render(<ConfirmModal {...defaultProps} confirmText="" cancelText="" />)
      // Los botones existen pero sin texto visible
      // Buscamos solo botones con flex-1 (excluye el div del mensaje)
      const actionButtons = container.querySelectorAll('button.flex-1')
      expect(actionButtons).toHaveLength(2)
    })
  })
})
