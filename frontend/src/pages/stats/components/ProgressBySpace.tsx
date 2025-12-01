// frontend/src/pages/stats/components/ProgressBySpace.tsx
import { useNavigate } from "react-router-dom";
import type { StudySpaceStatsResponse } from "@/types";

interface Props {
  progressBySpace: StudySpaceStatsResponse[];
  getScoreColor: (score: number) => string;
}

export function ProgressBySpace({ progressBySpace, getScoreColor }: Props) {
  const navigate = useNavigate();

  if (!progressBySpace || progressBySpace.length === 0) return null;

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 mb-8">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span>📁</span>
        Progreso por Espacio de Estudio
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {progressBySpace.map((space) => (
          <div
            key={space.space_id}
            className={`bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all ${
              space.space_id !== "global" ? "cursor-pointer" : ""
            }`}
            onClick={() => {
              if (space.space_id !== "global") {
                navigate(`/study-spaces/${space.space_id}`);
              }
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              {space.space_id === "global" ? (
                <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
              )}
              <h3 className="text-lg font-semibold text-white">{space.space_name}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-xs text-slate-300">Documentos</p>
                <p className="text-lg font-bold text-blue-400">{space.num_documents}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-xs text-slate-300">Resúmenes</p>
                <p className="text-lg font-bold text-purple-400">{space.num_summaries}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-xs text-slate-300">Quizzes</p>
                <p className="text-lg font-bold text-pink-400">{space.num_quizzes}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-xs text-slate-300">Intentos</p>
                <p className="text-lg font-bold text-cyan-400">{space.total_attempts}</p>
              </div>
            </div>

            {space.total_attempts > 0 && (
              <div className="border-t border-white/10 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-300">Promedio</span>
                  <span className={`text-xl font-bold ${getScoreColor(space.avg_score)}`}>
                    {space.avg_score}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      space.avg_score >= 80 ? "bg-green-500" : space.avg_score >= 60 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${space.avg_score}%` }}
                  />
                </div>
                {space.best_score > 0 && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-300">Mejor</span>
                    <span className={`text-sm font-semibold ${getScoreColor(space.best_score)}`}>
                      {space.best_score}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
