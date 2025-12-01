// frontend/src/pages/study-spaces/components/SpaceHeader.tsx
import type { StudySpaceResponse, StudySpaceStatsResponse } from "@/types";

interface SpaceHeaderProps {
  space: StudySpaceResponse;
  stats?: StudySpaceStatsResponse | null;
  onEdit: () => void;
  onCreateQuiz?: () => void;
}

export default function SpaceHeader({ space, stats, onEdit, onCreateQuiz }: SpaceHeaderProps) {
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 mb-8">
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: space.color }}
        >
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-white">
            {space.name}
          </h1>
          {space.description && (
            <p className="text-slate-300 mt-2">{space.description}</p>
          )}
        </div>
        <button
          onClick={onEdit}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Editar
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-2xl font-bold text-violet-400">{stats.num_documents}</div>
            <div className="text-sm text-slate-300">Documentos</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-2xl font-bold text-violet-400">{stats.num_summaries}</div>
            <div className="text-sm text-slate-300">Resúmenes</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-2xl font-bold text-violet-400">{stats.num_quizzes}</div>
            <div className="text-sm text-slate-300">Quizzes</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-2xl font-bold text-violet-400">{stats.avg_score.toFixed(1)}%</div>
            <div className="text-sm text-slate-300">Promedio</div>
          </div>
        </div>
      )}
    </div>
  );
}
