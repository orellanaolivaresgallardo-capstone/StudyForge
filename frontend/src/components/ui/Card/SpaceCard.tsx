/**
 * Reusable Study Space Card component
 */
import { useNavigate } from 'react-router-dom';
import { getScoreColor } from '@/constants/studySpaceColors';
import type { StudySpaceWithStatsResponse } from '@/types';

interface SpaceCardProps {
  space: StudySpaceWithStatsResponse;
  onEdit: (space: StudySpaceWithStatsResponse) => void;
  onDelete: (id: string, name: string) => void;
}

export function SpaceCard({ space, onEdit, onDelete }: SpaceCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/study-spaces/${space.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  return (
    <div
      className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 hover:bg-white/10 transition-all duration-200 cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: space.color }}
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(space);
            }}
            className="text-slate-300 hover:text-violet-400 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(space.id, space.name);
            }}
            className="text-slate-300 hover:text-red-400 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors break-words" title={space.name}>
        {space.name}
      </h3>

      {space.description && (
        <p className="text-slate-200 text-sm mb-4 line-clamp-2 break-words" title={space.description}>
          {space.description}
        </p>
      )}

      {/* Statistics */}
      <div className="mb-4 space-y-3">
        {/* Average Score Highlight */}
        <div className="flex items-center justify-center bg-white/5 rounded-xl py-3">
          <span className={`text-3xl font-bold ${getScoreColor(space.avg_score)}`}>
            {space.avg_score.toFixed(1)}%
          </span>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/5 rounded-lg py-2">
            <div className="text-slate-300 text-xs">📄 Docs</div>
            <div className="text-white font-semibold">{space.num_documents}</div>
          </div>
          <div className="bg-white/5 rounded-lg py-2">
            <div className="text-slate-300 text-xs">📚 Resúm.</div>
            <div className="text-white font-semibold">{space.num_summaries}</div>
          </div>
          <div className="bg-white/5 rounded-lg py-2">
            <div className="text-slate-300 text-xs">📝 Quizzes</div>
            <div className="text-white font-semibold">{space.num_quizzes}</div>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-300">
        Creado el {formatDate(space.created_at)}
      </div>
    </div>
  );
}
