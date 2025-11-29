// frontend/src/pages/summaries/components/TopicsSection.tsx
interface Props {
  topics: string[];
}

export function TopicsSection({ topics }: Props) {
  if (!topics || topics.length === 0) return null;

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Temas principales
      </h2>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, idx) => (
          <span
            key={idx}
            className="px-4 py-2 bg-violet-500/20 text-violet-300 rounded-xl border border-violet-500/30 text-sm font-medium"
          >
            {topic}
          </span>
        ))}
      </div>
    </div>
  );
}
