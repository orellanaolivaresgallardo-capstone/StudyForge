/**
 * Documents section for StudySpaceDetailPage
 */
import { DocumentCard } from '@/components/ui/Card';
import { EmptyState } from '@/components';
import type { DocumentResponse } from '@/types';

interface DocumentsSectionProps {
  documents: DocumentResponse[];
  onAddDocument: () => void;
  onRemoveDocument: (id: string, title: string) => void;
  onCreateSummary: (doc: DocumentResponse) => void;
  onCreateQuiz: (doc: DocumentResponse) => void;
}

export function DocumentsSection({
  documents,
  onAddDocument,
  onRemoveDocument,
  onCreateSummary,
  onCreateQuiz,
}: DocumentsSectionProps) {
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Documentos</h2>
        <button
          onClick={onAddDocument}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          + Agregar Documento
        </button>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          }
          title="No hay documentos en este espacio"
          description="Agrega documentos para comenzar a generar resúmenes y quizzes"
          action={{
            label: '+ Agregar Documento',
            onClick: onAddDocument,
          }}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDelete={(id) => onRemoveDocument(id, doc.title)}
              onCreateSummary={onCreateSummary}
              onCreateQuiz={onCreateQuiz}
            />
          ))}
        </div>
      )}
    </div>
  );
}
