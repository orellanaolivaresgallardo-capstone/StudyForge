/**
 * Expertise level constants and configuration
 */

export const EXPERTISE_LEVELS = {
  basico: {
    label: 'Básico',
    description: 'Conceptos fundamentales y explicaciones sencillas',
    color: 'green',
    bgClass: 'bg-green-500/20',
    textClass: 'text-green-400',
    borderClass: 'border-green-500/30',
  },
  medio: {
    label: 'Medio',
    description: 'Balance entre claridad y profundidad técnica',
    color: 'blue',
    bgClass: 'bg-blue-500/20',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/30',
  },
  avanzado: {
    label: 'Avanzado',
    description: 'Análisis técnico detallado con terminología especializada',
    color: 'purple',
    bgClass: 'bg-purple-500/20',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/30',
  },
} as const;

export type ExpertiseLevel = keyof typeof EXPERTISE_LEVELS;

export const EXPERTISE_LEVEL_VALUES: ExpertiseLevel[] = ['basico', 'medio', 'avanzado'];

/**
 * Get expertise level configuration
 */
export function getExpertiseLevelConfig(level: ExpertiseLevel) {
  return EXPERTISE_LEVELS[level];
}

/**
 * Validate if a string is a valid expertise level
 */
export function isValidExpertiseLevel(value: string): value is ExpertiseLevel {
  return value in EXPERTISE_LEVELS;
}
