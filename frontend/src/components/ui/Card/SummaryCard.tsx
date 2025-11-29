/**
 * Reusable Summary Card component
 */
import { useNavigate } from 'react-router-dom';
import type { SummaryResponse } from '@/types';
import { ExpertiseLevelBadge, DocumentStateBadge } from '../Badge';

interface SummaryCardProps {
  summary: SummaryResponse;
  onDelete?: (id: string) => void;
  onCreateQuiz?: (summary: SummaryResponse) => void;
  showActions?: boolean;
  onClick?: (summary: SummaryResponse) => void;
  variant?: 'default' | 'list'; // 'list' shows footer buttons instead of inline
}

export function SummaryCard({
  summary,
  onDelete,
  onCreateQuiz,
  showActions = true,
  onClick,
  variant = 'default',
}: SummaryCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (variant === 'list') return; // Don't navigate on click in list mode
    if (onClick) {
      onClick(summary);
    } else {
      navigate(`/summaries/${summary.id}`);
    }
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/summaries/${summary.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={handleClick}
      className={`${
        variant === 'list'
          ? 'bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 hover:border-violet-400/30'
          : 'bg-gradient-to-br from-blue-500/20 to-cyan-600/20 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:border-blue-500/50 cursor-pointer'
      } transition-all group`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3
            className={`font-bold text-white mb-2 ${
              variant === 'list'
                ? 'text-lg line-clamp-2 group-hover:text-violet-400 transition-colors'
                : 'text-base truncate'
            }`}
          >
            {summary.title}
          </h3>
          <ExpertiseLevelBadge level={summary.expertise_level} size="sm" />
        </div>
        {onDelete && showActions && variant !== 'list' && (
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
        <div className="mb-3">
          <p className="text-xs text-white/60 mb-2">Temas:</p>
          <div className="flex gap-2 flex-wrap">
            {summary.topics.slice(0, 3).map((topic: string, idx: number) => (
              <span
                key={idx}
                className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-1 rounded text-xs"
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
        </div>
      )}

      {/* Key Concepts */}
      {summary.key_concepts && summary.key_concepts.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-white/60 mb-2">Conceptos clave:</p>
          <div className="flex gap-2 flex-wrap">
            {summary.key_concepts.slice(0, 3).map((item: any, idx: number) => (
              <span
                key={idx}
                className="bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-1 rounded text-xs"
              >
                {item.concept}
              </span>
            ))}
            {summary.key_concepts.length > 3 && (
              <span className="px-2 py-1 bg-white/10 text-white/60 rounded text-xs">
                +{summary.key_concepts.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Document State */}
      {summary.document_state && (
        <div className="mb-3">
          <DocumentStateBadge state={summary.document_state} />
        </div>
      )}

      {/* Metadata */}
      {variant === 'list' ? (
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <span className="text-xs text-white/60">
            {formatDate(summary.created_at)}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleView}
              className="px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 text-xs font-medium transition-colors"
            >
              Ver
            </button>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(summary.id);
                }}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-medium transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 text-xs text-white/60 mb-3">
            <span>📄 {summary.source_document_filename || 'Documento'}</span>
            <span>•</span>
            <span>{formatDate(summary.created_at)}</span>
          </div>

          {/* Actions */}
          {showActions && (onCreateQuiz || onDelete) && (
            <div className="pt-3 border-t border-white/10 flex gap-2">
              {onCreateQuiz && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateQuiz(summary);
                  }}
                  className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Crear Quiz
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(summary.id);
                  }}
                  className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
