/**
 * Reusable Summary Card component
 */
import { useNavigate } from 'react-router-dom';
import type { SummaryResponse } from '@/types';
import { ExpertiseLevelBadge } from '../Badge';

interface SummaryCardProps {
  summary: SummaryResponse;
  onDelete?: (id: string) => void;
  onCreateQuiz?: (summary: SummaryResponse) => void;
  showActions?: boolean;
  onClick?: (summary: SummaryResponse) => void;
}

export function SummaryCard({
  summary,
  onDelete,
  onCreateQuiz,
  showActions = true,
  onClick,
}: SummaryCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(summary);
    } else {
      navigate(`/summaries/${summary.id}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={handleClick}
      className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:border-blue-500/50 transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate mb-1">{summary.title}</h3>
          <div className="flex items-center gap-2">
            <ExpertiseLevelBadge level={summary.expertise_level} size="sm" />
          </div>
        </div>
        {onDelete && showActions && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(summary.id);
            }}
            className="text-red-400 hover:text-red-300 flex-shrink-0 ml-2"
            title="Eliminar resumen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Topics */}
      {summary.topics && summary.topics.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-3">
          {summary.topics.slice(0, 3).map((topic: string, idx: number) => (
            <span
              key={idx}
              className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-1 rounded text-xs"
            >
              {topic}
            </span>
          ))}
          {summary.topics.length > 3 && (
            <span className="px-2 py-1 bg-white/10 text-white/60 rounded text-xs">
              +{summary.topics.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-3 text-xs text-white/60 mb-3">
        <span>📄 {summary.source_document_filename || 'Documento'}</span>
        <span>•</span>
        <span>{formatDate(summary.created_at)}</span>
      </div>

      {/* Actions */}
      {showActions && onCreateQuiz && (
        <div className="pt-3 border-t border-white/10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateQuiz(summary);
            }}
            className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded text-sm font-medium transition-colors"
          >
            Crear Quiz
          </button>
        </div>
      )}
    </div>
  );
}
