/**
 * Badge component for displaying document state
 */

type DocumentState = 'active_in_space' | 'removed_from_space' | 'permanently_deleted';

interface DocumentStateBadgeProps {
  state: DocumentState;
  size?: 'sm' | 'md' | 'lg';
}

const STATE_CONFIG = {
  active_in_space: {
    label: 'Activo',
    color: 'green',
    bgClass: 'bg-green-500/20',
    textClass: 'text-green-400',
    borderClass: 'border-green-500/30',
    icon: '✓',
  },
  removed_from_space: {
    label: 'Removido',
    color: 'orange',
    bgClass: 'bg-orange-500/20',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/30',
    icon: '⚠',
  },
  permanently_deleted: {
    label: 'Eliminado',
    color: 'red',
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30',
    icon: '✗',
  },
} as const;

export function DocumentStateBadge({ state, size = 'sm' }: DocumentStateBadgeProps) {
  const config = STATE_CONFIG[state];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`
        ${config.bgClass} ${config.textClass} ${config.borderClass}
        ${sizeClasses[size]}
        border rounded-full font-medium inline-flex items-center gap-1
      `}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
