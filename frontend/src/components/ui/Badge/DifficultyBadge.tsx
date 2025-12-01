/**
 * Badge component for displaying quiz difficulty levels
 */
import { DIFFICULTY_LEVELS, type DifficultyLevel } from '@/constants/difficulty';

interface DifficultyBadgeProps {
  level: DifficultyLevel;
  showIcon?: boolean;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function DifficultyBadge({
  level,
  showIcon = true,
  showDescription = false,
  size = 'md'
}: DifficultyBadgeProps) {
  const config = DIFFICULTY_LEVELS[level];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <span
        className={`
          ${config.bgClass} ${config.textClass} ${config.borderClass}
          ${sizeClasses[size]}
          border rounded-full font-medium inline-flex items-center gap-1
        `}
        title={showDescription ? undefined : config.description}
      >
        {showIcon && <span className="text-xs">{config.icon}</span>}
        <span>{config.label}</span>
      </span>
      {showDescription && (
        <span className="text-xs text-slate-300">{config.description}</span>
      )}
    </div>
  );
}
