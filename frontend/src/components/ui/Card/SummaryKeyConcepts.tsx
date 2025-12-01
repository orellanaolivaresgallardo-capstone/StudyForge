/**
 * Summary Key Concepts - Displays key concept tags for a summary
 */

interface KeyConcept {
  concept: string;
  definition: string;
}

interface SummaryKeyConceptsProps {
  keyConcepts: KeyConcept[];
  maxDisplay?: number;
}

export function SummaryKeyConcepts({ keyConcepts, maxDisplay = 3 }: SummaryKeyConceptsProps) {
  if (!keyConcepts || keyConcepts.length === 0) return null;

  return (
    <div className="mb-3">
      <p className="text-xs text-slate-300 mb-2">Conceptos clave:</p>
      <div className="flex gap-2 flex-wrap">
        {keyConcepts.slice(0, maxDisplay).map((item, idx) => (
          <span
            key={idx}
            className="bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-1 rounded text-xs"
          >
            {item.concept}
          </span>
        ))}
        {keyConcepts.length > maxDisplay && (
          <span className="px-2 py-1 bg-white/10 text-slate-300 rounded text-xs">
            +{keyConcepts.length - maxDisplay}
          </span>
        )}
      </div>
    </div>
  );
}
