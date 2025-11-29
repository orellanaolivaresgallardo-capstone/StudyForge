// frontend/src/pages/stats/components/StatsSummaryCards.tsx
import type { StatsSummary } from "@/types";

interface Props {
  summary: StatsSummary;
  getScoreColor: (score: number) => string;
}

export function StatsSummaryCards({ summary, getScoreColor }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm mb-1">Resúmenes</p>
            <p className="text-4xl font-bold text-white">{summary.total_summaries}</p>
          </div>
          <div className="text-4xl">📝</div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm mb-1">Cuestionarios</p>
            <p className="text-4xl font-bold text-white">{summary.total_quizzes}</p>
          </div>
          <div className="text-4xl">📋</div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm mb-1">Intentos</p>
            <p className="text-4xl font-bold text-white">{summary.total_completed_attempts}</p>
          </div>
          <div className="text-4xl">✅</div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm mb-1">Promedio General</p>
            <p className={`text-4xl font-bold ${getScoreColor(summary.avg_score)}`}>
              {summary.avg_score}%
            </p>
          </div>
          <div className="text-4xl">📊</div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm mb-1">Mejor Score</p>
            <p className={`text-4xl font-bold ${getScoreColor(summary.best_score)}`}>
              {summary.best_score}%
            </p>
          </div>
          <div className="text-4xl">🏆</div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm mb-1">Espacios de Estudio</p>
            <p className="text-4xl font-bold text-white">{summary.unique_spaces_studied}</p>
          </div>
          <div className="text-4xl">📚</div>
        </div>
      </div>
    </div>
  );
}
