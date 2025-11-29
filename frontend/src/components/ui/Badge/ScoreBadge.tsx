/**
 * Badge component for displaying quiz scores
 */
import { getScoreCategory } from '@/constants/difficulty';

interface ScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  showEmoji?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({
  score,
  showLabel = true,
  showEmoji = true,
  size = 'md'
}: ScoreBadgeProps) {
  const category = getScoreCategory(score);

  const colorClasses = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`
        ${colorClasses[category.color]}
        ${sizeClasses[size]}
        border rounded-full font-semibold inline-flex items-center gap-1.5
      `}
    >
      {showEmoji && <span>{category.emoji}</span>}
      <span>{Math.round(score)}%</span>
      {showLabel && <span className="font-normal">· {category.label}</span>}
    </span>
  );
}
