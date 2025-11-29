import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExpertiseLevelBadge } from '@/components/ui/Badge/ExpertiseLevelBadge'
import { ScoreBadge } from '@/components/ui/Badge/ScoreBadge'
import { DifficultyBadge } from '@/components/ui/Badge/DifficultyBadge'
import { DocumentStateBadge } from '@/components/ui/Badge/DocumentStateBadge'

describe('ExpertiseLevelBadge', () => {
  describe('Renderizado básico', () => {
    it('debe renderizar badge de nivel básico', () => {
      render(<ExpertiseLevelBadge level="basico" />)
      expect(screen.getByText('Básico')).toBeInTheDocument()
    })

    it('debe renderizar badge de nivel medio', () => {
      render(<ExpertiseLevelBadge level="medio" />)
      expect(screen.getByText('Medio')).toBeInTheDocument()
    })

    it('debe renderizar badge de nivel avanzado', () => {
      render(<ExpertiseLevelBadge level="avanzado" />)
      expect(screen.getByText('Avanzado')).toBeInTheDocument()
    })
  })

  describe('Prop showDescription', () => {
    it('debe mostrar description cuando showDescription=true', () => {
      render(<ExpertiseLevelBadge level="basico" showDescription />)
      expect(screen.getByText(/Conceptos fundamentales y explicaciones sencillas/i)).toBeInTheDocument()
    })

    it('NO debe mostrar description cuando showDescription=false', () => {
      render(<ExpertiseLevelBadge level="basico" showDescription={false} />)
      expect(screen.queryByText(/Conceptos fundamentales y explicaciones sencillas/i)).not.toBeInTheDocument()
    })

    it('debe incluir description en title cuando showDescription=false', () => {
      render(<ExpertiseLevelBadge level="medio" />)
      const badge = screen.getByText('Medio')
      expect(badge).toHaveAttribute('title')
    })

    it('NO debe incluir title cuando showDescription=true', () => {
      render(<ExpertiseLevelBadge level="medio" showDescription />)
      const badge = screen.getByText('Medio')
      expect(badge).not.toHaveAttribute('title')
    })
  })

  describe('Prop size', () => {
    it('debe aplicar clases de size="sm"', () => {
      render(<ExpertiseLevelBadge level="basico" size="sm" />)
      const badge = screen.getByText('Básico')
      expect(badge.className).toContain('px-2')
      expect(badge.className).toContain('text-xs')
    })

    it('debe aplicar clases de size="md" por defecto', () => {
      render(<ExpertiseLevelBadge level="basico" />)
      const badge = screen.getByText('Básico')
      expect(badge.className).toContain('px-3')
      expect(badge.className).toContain('text-sm')
    })

    it('debe aplicar clases de size="lg"', () => {
      render(<ExpertiseLevelBadge level="basico" size="lg" />)
      const badge = screen.getByText('Básico')
      expect(badge.className).toContain('px-4')
      expect(badge.className).toContain('text-base')
    })
  })
})

describe('ScoreBadge', () => {
  describe('Renderizado de score', () => {
    it('debe renderizar score redondeado', () => {
      render(<ScoreBadge score={87.6} />)
      expect(screen.getByText('88%')).toBeInTheDocument()
    })

    it('debe renderizar score exacto si es entero', () => {
      render(<ScoreBadge score={90} />)
      expect(screen.getByText('90%')).toBeInTheDocument()
    })

    it('debe redondear hacia abajo si decimal < 0.5', () => {
      render(<ScoreBadge score={75.4} />)
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('debe redondear hacia arriba si decimal >= 0.5', () => {
      render(<ScoreBadge score={75.5} />)
      expect(screen.getByText('76%')).toBeInTheDocument()
    })
  })

  describe('Categorías de score', () => {
    it('debe mostrar categoría "Excelente" para score >= 90', () => {
      render(<ScoreBadge score={95} />)
      expect(screen.getByText(/Excelente/i)).toBeInTheDocument()
      expect(screen.getByText('🏆')).toBeInTheDocument()
    })

    it('debe mostrar categoría "Muy Bueno" para score 75-89', () => {
      render(<ScoreBadge score={85} />)
      expect(screen.getByText(/Muy Bueno/i)).toBeInTheDocument()
      expect(screen.getByText('✨')).toBeInTheDocument()
    })

    it('debe mostrar categoría "Bueno" para score 60-74', () => {
      render(<ScoreBadge score={65} />)
      expect(screen.getByText(/Bueno/i)).toBeInTheDocument()
      expect(screen.getByText('👍')).toBeInTheDocument()
    })

    it('debe mostrar categoría "Regular" para score 40-59', () => {
      render(<ScoreBadge score={50} />)
      expect(screen.getByText(/Regular/i)).toBeInTheDocument()
      expect(screen.getByText('📚')).toBeInTheDocument()
    })

    it('debe mostrar categoría "Necesita Mejorar" para score < 40', () => {
      render(<ScoreBadge score={30} />)
      expect(screen.getByText(/Necesita Mejorar/i)).toBeInTheDocument()
      expect(screen.getByText('💪')).toBeInTheDocument()
    })
  })

  describe('Prop showLabel', () => {
    it('debe mostrar label cuando showLabel=true', () => {
      render(<ScoreBadge score={90} showLabel />)
      expect(screen.getByText(/Excelente/i)).toBeInTheDocument()
    })

    it('NO debe mostrar label cuando showLabel=false', () => {
      render(<ScoreBadge score={90} showLabel={false} />)
      expect(screen.queryByText(/Excelente/i)).not.toBeInTheDocument()
      expect(screen.getByText('90%')).toBeInTheDocument()
    })
  })

  describe('Prop showEmoji', () => {
    it('debe mostrar emoji cuando showEmoji=true', () => {
      render(<ScoreBadge score={95} showEmoji />)
      expect(screen.getByText('🏆')).toBeInTheDocument()
    })

    it('NO debe mostrar emoji cuando showEmoji=false', () => {
      render(<ScoreBadge score={95} showEmoji={false} />)
      expect(screen.queryByText('🏆')).not.toBeInTheDocument()
    })
  })

  describe('Prop size', () => {
    it('debe aplicar clases de size="sm"', () => {
      const { container } = render(<ScoreBadge score={80} size="sm" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('px-2')
      expect(badge?.className).toContain('text-xs')
    })

    it('debe aplicar clases de size="md" por defecto', () => {
      const { container } = render(<ScoreBadge score={80} />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('px-3')
      expect(badge?.className).toContain('text-sm')
    })

    it('debe aplicar clases de size="lg"', () => {
      const { container } = render(<ScoreBadge score={80} size="lg" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('px-4')
      expect(badge?.className).toContain('text-base')
    })
  })
})

describe('DifficultyBadge', () => {
  describe('Renderizado básico', () => {
    it('debe renderizar nivel 1 como "Muy Fácil"', () => {
      render(<DifficultyBadge level={1} />)
      expect(screen.getByText('Muy Fácil')).toBeInTheDocument()
    })

    it('debe renderizar nivel 2 como "Fácil"', () => {
      render(<DifficultyBadge level={2} />)
      expect(screen.getByText('Fácil')).toBeInTheDocument()
    })

    it('debe renderizar nivel 3 como "Medio"', () => {
      render(<DifficultyBadge level={3} />)
      expect(screen.getByText('Medio')).toBeInTheDocument()
    })

    it('debe renderizar nivel 4 como "Difícil"', () => {
      render(<DifficultyBadge level={4} />)
      expect(screen.getByText('Difícil')).toBeInTheDocument()
    })

    it('debe renderizar nivel 5 como "Muy Difícil"', () => {
      render(<DifficultyBadge level={5} />)
      expect(screen.getByText('Muy Difícil')).toBeInTheDocument()
    })
  })

  describe('Prop showIcon', () => {
    it('debe mostrar icon cuando showIcon=true', () => {
      render(<DifficultyBadge level={1} showIcon />)
      expect(screen.getByText('⭐')).toBeInTheDocument()
    })

    it('NO debe mostrar icon cuando showIcon=false', () => {
      render(<DifficultyBadge level={1} showIcon={false} />)
      expect(screen.queryByText('⭐')).not.toBeInTheDocument()
    })

    it('debe mostrar diferentes iconos para cada nivel', () => {
      const { rerender } = render(<DifficultyBadge level={1} showIcon />)
      expect(screen.getByText('⭐')).toBeInTheDocument()

      rerender(<DifficultyBadge level={5} showIcon />)
      expect(screen.getByText('⭐⭐⭐⭐⭐')).toBeInTheDocument()
    })
  })

  describe('Prop showDescription', () => {
    it('debe mostrar description cuando showDescription=true', () => {
      render(<DifficultyBadge level={1} showDescription />)
      expect(screen.getByText(/Conceptos básicos y recordar información directa/i)).toBeInTheDocument()
    })

    it('NO debe mostrar description cuando showDescription=false', () => {
      render(<DifficultyBadge level={1} showDescription={false} />)
      expect(screen.queryByText(/Conceptos básicos y recordar información directa/i)).not.toBeInTheDocument()
    })

    it('debe incluir description en title cuando showDescription=false', () => {
      const { container } = render(<DifficultyBadge level={2} />)
      // El span con el icon y label tiene el title, no el label solo
      const badgeSpan = container.querySelector('span[title]')
      expect(badgeSpan).toHaveAttribute('title', 'Preguntas simples que requieren comprensión')
    })

    it('NO debe incluir title cuando showDescription=true', () => {
      const { container } = render(<DifficultyBadge level={2} showDescription />)
      const badgeSpan = container.querySelector('span.inline-flex')
      expect(badgeSpan).not.toHaveAttribute('title')
    })
  })

  describe('Prop size', () => {
    it('debe aplicar clases de size="sm"', () => {
      const { container } = render(<DifficultyBadge level={1} size="sm" />)
      const badge = container.querySelector('span.inline-flex')
      expect(badge?.className).toContain('px-2')
      expect(badge?.className).toContain('text-xs')
    })

    it('debe aplicar clases de size="md" por defecto', () => {
      const { container } = render(<DifficultyBadge level={1} />)
      const badge = container.querySelector('span.inline-flex')
      expect(badge?.className).toContain('px-3')
      expect(badge?.className).toContain('text-sm')
    })

    it('debe aplicar clases de size="lg"', () => {
      const { container } = render(<DifficultyBadge level={1} size="lg" />)
      const badge = container.querySelector('span.inline-flex')
      expect(badge?.className).toContain('px-4')
      expect(badge?.className).toContain('text-base')
    })
  })
})

describe('DocumentStateBadge', () => {
  describe('Renderizado de estados', () => {
    it('debe renderizar estado "active_in_space" como "Activo"', () => {
      render(<DocumentStateBadge state="active_in_space" />)
      expect(screen.getByText('Activo')).toBeInTheDocument()
      expect(screen.getByText('✓')).toBeInTheDocument()
    })

    it('debe renderizar estado "removed_from_space" como "Removido"', () => {
      render(<DocumentStateBadge state="removed_from_space" />)
      expect(screen.getByText('Removido')).toBeInTheDocument()
      expect(screen.getByText('⚠')).toBeInTheDocument()
    })

    it('debe renderizar estado "permanently_deleted" como "Eliminado"', () => {
      render(<DocumentStateBadge state="permanently_deleted" />)
      expect(screen.getByText('Eliminado')).toBeInTheDocument()
      expect(screen.getByText('✗')).toBeInTheDocument()
    })
  })

  describe('Colores por estado', () => {
    it('debe aplicar clases verdes para "active_in_space"', () => {
      const { container } = render(<DocumentStateBadge state="active_in_space" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('bg-green-500/20')
      expect(badge?.className).toContain('text-green-400')
      expect(badge?.className).toContain('border-green-500/30')
    })

    it('debe aplicar clases naranjas para "removed_from_space"', () => {
      const { container } = render(<DocumentStateBadge state="removed_from_space" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('bg-orange-500/20')
      expect(badge?.className).toContain('text-orange-400')
      expect(badge?.className).toContain('border-orange-500/30')
    })

    it('debe aplicar clases rojas para "permanently_deleted"', () => {
      const { container } = render(<DocumentStateBadge state="permanently_deleted" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('bg-red-500/20')
      expect(badge?.className).toContain('text-red-400')
      expect(badge?.className).toContain('border-red-500/30')
    })
  })

  describe('Prop size', () => {
    it('debe aplicar clases de size="sm" por defecto', () => {
      const { container } = render(<DocumentStateBadge state="active_in_space" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('px-2')
      expect(badge?.className).toContain('text-xs')
    })

    it('debe aplicar clases de size="md"', () => {
      const { container } = render(<DocumentStateBadge state="active_in_space" size="md" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('px-3')
      expect(badge?.className).toContain('text-sm')
    })

    it('debe aplicar clases de size="lg"', () => {
      const { container } = render(<DocumentStateBadge state="active_in_space" size="lg" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('px-4')
      expect(badge?.className).toContain('text-base')
    })
  })
})
