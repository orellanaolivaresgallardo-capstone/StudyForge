import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Toast from '@/components/ui/Toast'

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Renderizado básico', () => {
    it('debe renderizar el mensaje', () => {
      render(
        <Toast message="Test message" type="info" onClose={() => {}} />
      )

      expect(screen.getByText('Test message')).toBeInTheDocument()
    })

    it('debe tener role="alert"', () => {
      const { container } = render(
        <Toast message="Test" type="info" onClose={() => {}} />
      )

      expect(container.querySelector('[role="alert"]')).toBeInTheDocument()
    })

    it('debe mostrar botón de cerrar', () => {
      render(
        <Toast message="Test" type="info" onClose={() => {}} />
      )

      expect(screen.getByLabelText('Close notification')).toBeInTheDocument()
    })
  })

  describe('Tipos de toast', () => {
    it('debe renderizar toast de éxito', () => {
      const { container } = render(
        <Toast message="Success!" type="success" onClose={() => {}} />
      )

      const toast = container.querySelector('.bg-green-500')
      expect(toast).toBeInTheDocument()
      expect(screen.getByText('✓')).toBeInTheDocument()
    })

    it('debe renderizar toast de error', () => {
      const { container } = render(
        <Toast message="Error occurred" type="error" onClose={() => {}} />
      )

      const toast = container.querySelector('.bg-red-500')
      expect(toast).toBeInTheDocument()
      expect(screen.getByText('✕')).toBeInTheDocument()
    })

    it('debe renderizar toast de info', () => {
      const { container } = render(
        <Toast message="Info message" type="info" onClose={() => {}} />
      )

      const toast = container.querySelector('.bg-blue-500')
      expect(toast).toBeInTheDocument()
      expect(screen.getByText('ℹ')).toBeInTheDocument()
    })

    it('debe renderizar toast de advertencia', () => {
      const { container } = render(
        <Toast message="Warning!" type="warning" onClose={() => {}} />
      )

      const toast = container.querySelector('.bg-yellow-500')
      expect(toast).toBeInTheDocument()
      expect(screen.getByText('⚠')).toBeInTheDocument()
    })
  })

  describe('Cierre automático', () => {
    it('debe cerrar automáticamente después de la duración por defecto (3000ms)', async () => {
      const onClose = vi.fn()

      render(
        <Toast message="Auto close" type="info" onClose={onClose} />
      )

      expect(screen.getByText('Auto close')).toBeInTheDocument()

      // Avanzar tiempo y ejecutar todos los timers
      await vi.advanceTimersByTimeAsync(3000)
      await vi.advanceTimersByTimeAsync(300)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('debe cerrar automáticamente después de duración personalizada', async () => {
      const onClose = vi.fn()

      render(
        <Toast message="Custom duration" type="info" duration={5000} onClose={onClose} />
      )

      // Avanzar 4000ms (no debería cerrar aún)
      await vi.advanceTimersByTimeAsync(4000)
      expect(onClose).not.toHaveBeenCalled()

      // Avanzar 1000ms más + animación
      await vi.advanceTimersByTimeAsync(1300)

      expect(onClose).toHaveBeenCalled()
    })

    it('debe cerrar rápidamente con duración corta', async () => {
      const onClose = vi.fn()

      render(
        <Toast message="Quick close" type="success" duration={1000} onClose={onClose} />
      )

      await vi.advanceTimersByTimeAsync(1300)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Cierre manual', () => {
    it('debe llamar onClose al hacer click en botón de cerrar', async () => {
      vi.useRealTimers() // Usar timers reales para userEvent
      const onClose = vi.fn()
      const user = userEvent.setup()

      render(
        <Toast message="Manual close" type="info" onClose={onClose} />
      )

      const closeButton = screen.getByLabelText('Close notification')
      await user.click(closeButton)

      // Esperar animación
      await new Promise(resolve => setTimeout(resolve, 350))

      expect(onClose).toHaveBeenCalledTimes(1)
      vi.useFakeTimers() // Volver a fake timers
    })

    it('debe cerrar antes del timeout si se hace click manualmente', async () => {
      vi.useRealTimers() // Usar timers reales para userEvent
      const onClose = vi.fn()
      const user = userEvent.setup()

      render(
        <Toast message="Early close" type="info" duration={5000} onClose={onClose} />
      )

      const closeButton = screen.getByLabelText('Close notification')
      await user.click(closeButton)

      // Esperar animación
      await new Promise(resolve => setTimeout(resolve, 350))

      expect(onClose).toHaveBeenCalledTimes(1)
      vi.useFakeTimers() // Volver a fake timers
    })
  })

  describe('Animaciones', () => {
    it('debe tener clase de entrada al renderizar', () => {
      const { container } = render(
        <Toast message="Animating in" type="info" onClose={() => {}} />
      )

      const toast = container.querySelector('.animate-slideInRight')
      expect(toast).toBeInTheDocument()
    })

    it('debe cambiar a animación de salida al cerrar', async () => {
      vi.useRealTimers() // Usar timers reales para userEvent
      const user = userEvent.setup()
      const { container } = render(
        <Toast message="Animating out" type="info" onClose={() => {}} />
      )

      const closeButton = screen.getByLabelText('Close notification')
      await user.click(closeButton)

      const toast = container.querySelector('.animate-slideOutRight')
      expect(toast).toBeInTheDocument()
      vi.useFakeTimers() // Volver a fake timers
    })
  })

  describe('Cleanup', () => {
    it('debe limpiar el timer al desmontar', async () => {
      const onClose = vi.fn()

      const { unmount } = render(
        <Toast message="Cleanup test" type="info" onClose={onClose} />
      )

      unmount()

      // Avanzar el tiempo después de desmontar
      await vi.advanceTimersByTimeAsync(5000)

      expect(onClose).not.toHaveBeenCalled()
    })

    it('debe NO renderizar cuando isVisible es false', async () => {
      const onClose = vi.fn()

      render(
        <Toast message="Will disappear" type="info" duration={1000} onClose={onClose} />
      )

      expect(screen.getByText('Will disappear')).toBeInTheDocument()

      // Esperar cierre completo
      await vi.advanceTimersByTimeAsync(1300)

      expect(screen.queryByText('Will disappear')).not.toBeInTheDocument()
    })
  })

  describe('Contenido', () => {
    it('debe mostrar mensajes largos correctamente', () => {
      const longMessage = 'Este es un mensaje muy largo que debería mostrarse completamente en el toast sin problemas de truncamiento'

      render(
        <Toast message={longMessage} type="info" onClose={() => {}} />
      )

      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })

    it('debe manejar caracteres especiales', () => {
      const specialMessage = '¡Éxito! Los datos se guardaron correctamente: 100%'

      render(
        <Toast message={specialMessage} type="success" onClose={() => {}} />
      )

      expect(screen.getByText(specialMessage)).toBeInTheDocument()
    })
  })
})
