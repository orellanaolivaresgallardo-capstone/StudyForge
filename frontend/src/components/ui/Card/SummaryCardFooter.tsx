/**
 * Summary Card Footer - Footer section for SummaryCard with actions and metadata
 */
import type { SummaryResponse } from '@/types';

interface SummaryCardFooterProps {
  variant: 'default' | 'list';
  summary: SummaryResponse;
  showActions: boolean;
  onView: (e: React.MouseEvent) => void;
  onDelete?: (id: string) => void;
  onCreateQuiz?: (summary: SummaryResponse) => void;
}

export function SummaryCardFooter({
  variant,
  summary,
  showActions,
  onView,
  onDelete,
  onCreateQuiz,
}: SummaryCardFooterProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (variant === 'list') {
    return (
      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
        <span className="text-xs text-slate-300">{formatDate(summary.created_at)}</span>
        <div className="flex gap-2">
          <button
            onClick={onView}
            className="px-3 py-1.5 rounded-xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 text-xs font-semibold transition-colors"
          >
            Ver
          </button>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(summary.id);
              }}
              className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-semibold transition-colors"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 text-xs text-slate-300 mb-3">
        <span>📄 {summary.source_document_filename || 'Documento'}</span>
        <span>•</span>
        <span>{formatDate(summary.created_at)}</span>
      </div>

      {showActions && (onCreateQuiz || onDelete) && (
        <div className="pt-3 border-t border-slate-700 flex gap-2">
          {onCreateQuiz && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateQuiz(summary);
              }}
              className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
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
              className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              Eliminar
            </button>
          )}
        </div>
      )}
    </>
  );
}
