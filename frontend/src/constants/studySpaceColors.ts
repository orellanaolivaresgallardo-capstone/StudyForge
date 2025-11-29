/**
 * Study space color options
 */

export const STUDY_SPACE_COLORS = [
  { name: 'Violeta', value: '#8B5CF6' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Amarillo', value: '#F59E0B' },
  { name: 'Rojo', value: '#EF4444' },
] as const;

export const DEFAULT_SPACE_COLOR = '#8B5CF6';

export function getScoreColor(avgScore: number): string {
  if (avgScore >= 75) return 'text-green-400';
  if (avgScore >= 60) return 'text-yellow-400';
  return 'text-red-400';
}
