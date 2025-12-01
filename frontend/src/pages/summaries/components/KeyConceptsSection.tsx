// frontend/src/pages/summaries/components/KeyConceptsSection.tsx
interface KeyConcept {
  concept: string;
  definition: string;
}

interface Props {
  keyConcepts: KeyConcept[];
}

export function KeyConceptsSection({ keyConcepts }: Props) {
  if (!keyConcepts || keyConcepts.length === 0) return null;

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Conceptos Clave
      </h2>

      <div className="space-y-4">
        {keyConcepts.map((item, idx) => (
          <div
            key={idx}
            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-violet-500/50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-violet-300 mb-2 flex items-center gap-2">
              <span className="text-violet-400">•</span>
              {item.concept}
            </h3>
            <p className="text-slate-100 leading-relaxed pl-6">{item.definition}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
