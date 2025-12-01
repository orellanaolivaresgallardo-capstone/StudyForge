/**
 * Summary Topics - Displays topic tags for a summary
 */

interface SummaryTopicsProps {
  topics: string[];
  maxDisplay?: number;
}

export function SummaryTopics({ topics, maxDisplay = 3 }: SummaryTopicsProps) {
  if (!topics || topics.length === 0) return null;

  return (
    <div className="mb-3">
      <p className="text-xs text-slate-300 mb-2">Temas:</p>
      <div className="flex gap-2 flex-wrap">
        {topics.slice(0, maxDisplay).map((topic, idx) => (
          <span
            key={idx}
            className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-1 rounded text-xs"
          >
            {topic}
          </span>
        ))}
        {topics.length > maxDisplay && (
          <span className="px-2 py-1 bg-white/10 text-slate-300 rounded text-xs">
            +{topics.length - maxDisplay}
          </span>
        )}
      </div>
    </div>
  );
}
