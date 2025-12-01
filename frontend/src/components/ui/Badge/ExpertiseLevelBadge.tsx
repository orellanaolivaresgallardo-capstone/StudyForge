/**
 * Badge component for displaying expertise levels
 */
import { EXPERTISE_LEVELS, type ExpertiseLevel } from '@/constants/expertise';

interface ExpertiseLevelBadgeProps {
  level: ExpertiseLevel;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ExpertiseLevelBadge({ level, showDescription = false, size = 'md' }: ExpertiseLevelBadgeProps) {
  const config = EXPERTISE_LEVELS[level];

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
          border rounded-full font-medium inline-block
        `}
        title={showDescription ? undefined : config.description}
      >
        {config.label}
      </span>
      {showDescription && (
        <span className="text-xs text-slate-300">{config.description}</span>
      )}
    </div>
  );
}
