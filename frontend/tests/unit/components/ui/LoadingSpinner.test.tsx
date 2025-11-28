import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

describe('LoadingSpinner', () => {
  describe('Renderizado básico', () => {
    it('debe renderizar el spinner', () => {
      const { container } = render(<LoadingSpinner />)

      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('debe usar tamaño medium por defecto', () => {
      const { container } = render(<LoadingSpinner />)

      const spinner = container.querySelector('.h-12.w-12')
      expect(spinner).toBeInTheDocument()
    })

    it('NO debe mostrar mensaje si no se proporciona', () => {
      render(<LoadingSpinner />)

      const message = screen.queryByText(/.+/)
      expect(message).not.toBeInTheDocument()
    })
  })

  describe('Tamaños', () => {
    it('debe renderizar tamaño small', () => {
      const { container } = render(<LoadingSpinner size="sm" />)

      const spinner = container.querySelector('.h-8.w-8')
      expect(spinner).toBeInTheDocument()
    })

    it('debe renderizar tamaño medium', () => {
      const { container } = render(<LoadingSpinner size="md" />)

      const spinner = container.querySelector('.h-12.w-12')
      expect(spinner).toBeInTheDocument()
    })

    it('debe renderizar tamaño large', () => {
      const { container } = render(<LoadingSpinner size="lg" />)

      const spinner = container.querySelector('.h-16.w-16')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Mensaje', () => {
    it('debe mostrar mensaje cuando se proporciona', () => {
      render(<LoadingSpinner message="Cargando datos..." />)

      expect(screen.getByText('Cargando datos...')).toBeInTheDocument()
    })

    it('debe mostrar diferentes mensajes', () => {
      const { rerender } = render(<LoadingSpinner message="Mensaje 1" />)

      expect(screen.getByText('Mensaje 1')).toBeInTheDocument()

      rerender(<LoadingSpinner message="Mensaje 2" />)

      expect(screen.getByText('Mensaje 2')).toBeInTheDocument()
      expect(screen.queryByText('Mensaje 1')).not.toBeInTheDocument()
    })

    it('debe combinar tamaño y mensaje', () => {
      const { container } = render(<LoadingSpinner size="lg" message="Procesando..." />)

      const spinner = container.querySelector('.h-16.w-16')
      expect(spinner).toBeInTheDocument()
      expect(screen.getByText('Procesando...')).toBeInTheDocument()
    })
  })

  describe('Clases CSS', () => {
    it('debe tener clase animate-spin', () => {
      const { container } = render(<LoadingSpinner />)

      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toHaveClass('animate-spin')
    })

    it('debe tener clase rounded-full', () => {
      const { container } = render(<LoadingSpinner />)

      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toHaveClass('rounded-full')
    })

    it('debe tener border styles', () => {
      const { container } = render(<LoadingSpinner />)

      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toHaveClass('border-4')
      expect(spinner).toHaveClass('border-violet-400')
      expect(spinner).toHaveClass('border-t-transparent')
    })
  })
})
