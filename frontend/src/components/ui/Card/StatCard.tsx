/**
 * Reusable Stat Card component for displaying statistics
 */

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  color?: 'violet' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export function StatCard({ title, value, icon, trend, color = 'violet' }: StatCardProps) {
  const colorClasses = {
    violet: 'from-violet-500/20 to-purple-600/20 border-violet-500/30',
    blue: 'from-blue-500/20 to-cyan-600/20 border-blue-500/30',
    green: 'from-green-500/20 to-emerald-600/20 border-green-500/30',
    yellow: 'from-yellow-500/20 to-orange-600/20 border-yellow-500/30',
    red: 'from-red-500/20 to-pink-600/20 border-red-500/30',
    purple: 'from-purple-500/20 to-fuchsia-600/20 border-purple-500/30',
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm rounded-lg p-6 border border-white/10`}
    >
      {/* Header with icon */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-100 text-sm font-medium">{title}</h3>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>

      {/* Value */}
      <p className="text-3xl font-bold text-white mb-2">{value}</p>

      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-1 text-sm">
          <span className={trend.isPositive !== false ? 'text-green-400' : 'text-red-400'}>
            {trend.isPositive !== false ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-slate-300">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
