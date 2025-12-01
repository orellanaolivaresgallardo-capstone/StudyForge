/**
 * Reusable Summary Card component - REFACTORED
 * Reduced from 206 → ~95 lines using extracted components
 */
import { useNavigate } from 'react-router-dom';
import type { SummaryResponse } from '@/types';
import { ExpertiseLevelBadge, DocumentStateBadge } from '../Badge';
import { SummaryTopics } from './SummaryTopics';
import { SummaryKeyConcepts } from './SummaryKeyConcepts';
import { SummaryCardFooter } from './SummaryCardFooter';

interface SummaryCardProps {
  summary: SummaryResponse;
  onDelete?: (id: string) => void;
  onCreateQuiz?: (summary: SummaryResponse) => void;
  showActions?: boolean;
  onClick?: (summary: SummaryResponse) => void;
  variant?: 'default' | 'list';
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
    if (variant === 'list') return;
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

  return (
    <div
      onClick={handleClick}
      className={`${
        variant === 'list'
          ? 'bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 hover:border-violet-400/30'
          : 'bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:bg-slate-800/70 hover:border-brand-500/50 cursor-pointer'
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

      {/* Topics Section */}
      <SummaryTopics topics={summary.topics || []} />

      {/* Key Concepts Section */}
      <SummaryKeyConcepts keyConcepts={summary.key_concepts || []} />

      {/* Document State */}
      {summary.document_state && (
        <div className="mb-3">
          <DocumentStateBadge state={summary.document_state} />
        </div>
      )}

      {/* Footer with Metadata and Actions */}
      <SummaryCardFooter
        variant={variant}
        summary={summary}
        showActions={showActions}
        onView={handleView}
        onDelete={onDelete}
        onCreateQuiz={onCreateQuiz}
      />
    </div>
  );
}
