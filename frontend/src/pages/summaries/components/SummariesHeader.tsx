/**
 * Summaries Header - Header section for SummariesPage
 */

interface SummariesHeaderProps {
  onCreateSummary: () => void;
}

export function SummariesHeader({ onCreateSummary }: SummariesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Mis Resúmenes
        </h1>
        <p className="text-slate-300 mt-1">
          Resúmenes generados por IA adaptados a tu nivel
        </p>
      </div>
      <button
        onClick={onCreateSummary}
        className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 font-semibold transition-colors flex items-center gap-2"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Crear resumen
      </button>
    </div>
  );
}
