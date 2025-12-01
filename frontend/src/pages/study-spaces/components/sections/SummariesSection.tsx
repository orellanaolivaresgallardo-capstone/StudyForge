/**
 * Summaries section for StudySpaceDetailPage
 */
import { SummaryCard } from '@/components/ui/Card';
import { EmptyState } from '@/components';
import type { SummaryResponse } from '@/types';

interface SummariesSectionProps {
  summaries: SummaryResponse[];
  onRemoveSummary: (id: string, title: string) => void;
  onCreateQuiz: (summary: SummaryResponse) => void;
}

export function SummariesSection({
  summaries,
  onRemoveSummary,
  onCreateQuiz,
}: SummariesSectionProps) {
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Resúmenes</h2>
      </div>

      {summaries.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          title="No hay resúmenes en este espacio"
          description="Crea resúmenes desde la sección de documentos para organizar tu contenido de estudio"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summaries.map((summary) => (
            <SummaryCard
              key={summary.id}
              summary={summary}
              onDelete={(id) => onRemoveSummary(id, summary.title)}
              onCreateQuiz={onCreateQuiz}
            />
          ))}
        </div>
      )}
    </div>
  );
}
