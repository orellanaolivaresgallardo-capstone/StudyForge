/**
 * Progress and statistics section for StudySpaceDetailPage
 */
import { PerformanceChart } from '@/components';
import { StatCard } from '@/components/ui/Card';
import type { StudySpaceStatsResponse, UserPerformance } from '@/types';

interface ProgressSectionProps {
  stats: StudySpaceStatsResponse | null;
  performance: UserPerformance | null;
}

export function ProgressSection({ stats, performance }: ProgressSectionProps) {
  if (!stats && !performance) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Documentos"
            value={stats.total_documents}
            icon="📄"
            color="violet"
          />
          <StatCard
            title="Total Resúmenes"
            value={stats.total_summaries}
            icon="📝"
            color="blue"
          />
          <StatCard
            title="Total Quizzes"
            value={stats.total_quizzes}
            icon="📋"
            color="green"
          />
          <StatCard
            title="Promedio Score"
            value={`${stats.average_score?.toFixed(1) || 0}%`}
            icon="🎯"
            color="yellow"
          />
        </div>
      )}

      {/* Performance Chart */}
      {performance && performance.attempts.length > 0 && (
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Rendimiento</h2>
          <PerformanceChart performance={performance} />
        </div>
      )}
    </div>
  );
}
