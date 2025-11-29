/**
 * Quiz difficulty level constants and configuration
 */

export const DIFFICULTY_LEVELS = {
  1: {
    label: 'Muy Fácil',
    description: 'Conceptos básicos y recordar información directa',
    color: 'green',
    bgClass: 'bg-green-500/20',
    textClass: 'text-green-400',
    borderClass: 'border-green-500/30',
    icon: '⭐',
  },
  2: {
    label: 'Fácil',
    description: 'Preguntas simples que requieren comprensión',
    color: 'lime',
    bgClass: 'bg-lime-500/20',
    textClass: 'text-lime-400',
    borderClass: 'border-lime-500/30',
    icon: '⭐⭐',
  },
  3: {
    label: 'Medio',
    description: 'Requiere comprensión y aplicación de conceptos',
    color: 'yellow',
    bgClass: 'bg-yellow-500/20',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/30',
    icon: '⭐⭐⭐',
  },
  4: {
    label: 'Difícil',
    description: 'Requiere análisis y pensamiento crítico',
    color: 'orange',
    bgClass: 'bg-orange-500/20',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/30',
    icon: '⭐⭐⭐⭐',
  },
  5: {
    label: 'Muy Difícil',
    description: 'Requiere síntesis, evaluación y razonamiento avanzado',
    color: 'red',
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30',
    icon: '⭐⭐⭐⭐⭐',
  },
} as const;

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export const DIFFICULTY_LEVEL_VALUES: DifficultyLevel[] = [1, 2, 3, 4, 5];

/**
 * Get difficulty level configuration
 */
export function getDifficultyLevelConfig(level: DifficultyLevel) {
  return DIFFICULTY_LEVELS[level];
}

/**
 * Validate if a number is a valid difficulty level
 */
export function isValidDifficultyLevel(value: number): value is DifficultyLevel {
  return value >= 1 && value <= 5;
}

/**
 * Get score category based on percentage
 */
export function getScoreCategory(score: number) {
  if (score >= 90) return { label: 'Excelente', color: 'green', emoji: '🏆' };
  if (score >= 75) return { label: 'Muy Bueno', color: 'blue', emoji: '✨' };
  if (score >= 60) return { label: 'Bueno', color: 'yellow', emoji: '👍' };
  if (score >= 40) return { label: 'Regular', color: 'orange', emoji: '📚' };
  return { label: 'Necesita Mejorar', color: 'red', emoji: '💪' };
}
