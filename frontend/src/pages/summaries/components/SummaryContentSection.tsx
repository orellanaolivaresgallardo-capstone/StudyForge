// frontend/src/pages/summaries/components/SummaryContentSection.tsx
interface Props {
  content: string;
}

export function SummaryContentSection({ content }: Props) {
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Resumen
      </h2>
      <div className="prose prose-invert prose-slate max-w-none">
        <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
          {content || "No hay contenido disponible"}
        </p>
      </div>
    </div>
  );
}
