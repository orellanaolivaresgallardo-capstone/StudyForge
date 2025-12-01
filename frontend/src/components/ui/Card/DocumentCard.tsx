/**
 * Reusable Document Card component
 */
import type { DocumentResponse } from '@/types';

interface DocumentCardProps {
  document: DocumentResponse;
  onDelete?: (id: string) => void;
  onCreateSummary?: (doc: DocumentResponse) => void;
  onCreateQuiz?: (doc: DocumentResponse) => void;
  showActions?: boolean;
}

export function DocumentCard({
  document,
  onDelete,
  onCreateSummary,
  onCreateQuiz,
  showActions = true,
}: DocumentCardProps) {
  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'docx':
        return '📘';
      case 'pptx':
        return '📊';
      case 'txt':
        return '📝';
      default:
        return '📁';
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:bg-slate-800/70 hover:border-brand-500/50 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0">{getFileIcon(document.file_type)}</span>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-white truncate" title={document.title}>{document.title}</h3>
            <p className="text-sm text-slate-100 truncate" title={document.file_name}>{document.file_name}</p>
          </div>
        </div>
        {onDelete && showActions && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(document.id);
            }}
            className="text-red-400 hover:text-red-300 flex-shrink-0 ml-2"
            title="Eliminar documento"
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

      {/* Metadata */}
      <div className="flex items-center gap-3 text-sm text-slate-100 mb-3">
        <span className="bg-white/10 px-2 py-1 rounded">{document.file_type.toUpperCase()}</span>
        <span>{formatBytes(document.file_size_bytes)}</span>
      </div>

      {/* Actions */}
      {showActions && (onCreateSummary || onCreateQuiz) && (
        <div className="flex gap-2 pt-3 border-t border-slate-700">
          {onCreateSummary && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateSummary(document);
              }}
              className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              Crear Resumen
            </button>
          )}
          {onCreateQuiz && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateQuiz(document);
              }}
              className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              Crear Quiz
            </button>
          )}
        </div>
      )}
    </div>
  );
}
