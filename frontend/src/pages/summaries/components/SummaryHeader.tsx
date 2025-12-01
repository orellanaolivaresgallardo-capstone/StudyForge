// frontend/src/pages/summaries/components/SummaryHeader.tsx
import { useNavigate } from "react-router-dom";
import type { SummaryDetailResponse, ExpertiseLevel } from "@/types";

interface Props {
  summary: SummaryDetailResponse;
  onDelete: () => void;
  onGenerateQuiz: () => void;
}

const getExpertiseLevelBadge = (level: ExpertiseLevel) => {
  const configs = {
    basico: {
      bg: "bg-green-500/20",
      text: "text-green-400",
      border: "border-green-500/30",
      label: "Básico",
    },
    medio: {
      bg: "bg-yellow-500/20",
      text: "text-yellow-400",
      border: "border-yellow-500/30",
      label: "Medio",
    },
    avanzado: {
      bg: "bg-red-500/20",
      text: "text-red-400",
      border: "border-red-500/30",
      label: "Avanzado",
    },
  };
  return configs[level] || configs.medio;
};

export function SummaryHeader({ summary, onDelete, onGenerateQuiz }: Props) {
  const navigate = useNavigate();
  const levelConfig = getExpertiseLevelBadge(summary.expertise_level);

  return (
    <>
      <button
        onClick={() => navigate("/summaries")}
        className="flex items-center gap-2 text-slate-300 hover:text-violet-400 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a resúmenes
      </button>

      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight mb-3">{summary.title}</h1>
            <span
              className={`inline-block px-3 py-1 rounded-lg text-sm font-medium border ${levelConfig.bg} ${levelConfig.text} ${levelConfig.border}`}
            >
              {levelConfig.label}
            </span>
          </div>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
            title="Eliminar resumen"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-300 mb-6">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(summary.created_at).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {summary.document ? "1 documento" : "Sin documento"}
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onGenerateQuiz}
            className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 font-semibold transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Generar cuestionario
          </button>
        </div>
      </div>
    </>
  );
}
