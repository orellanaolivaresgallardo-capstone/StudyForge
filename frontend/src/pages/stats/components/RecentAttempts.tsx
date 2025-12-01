// frontend/src/pages/stats/components/RecentAttempts.tsx
import { useNavigate } from "react-router-dom";
import type { RecentAttempt } from "@/types";

interface Props {
  attempts: RecentAttempt[];
  getScoreColor: (score: number) => string;
  getScoreBgColor: (score: number) => string;
  getDifficultyLabel: (level: number) => string;
  getDifficultyColor: (level: number) => string;
}

export function RecentAttempts({
  attempts,
  getScoreColor,
  getScoreBgColor,
  getDifficultyLabel,
  getDifficultyColor,
}: Props) {
  const navigate = useNavigate();

  if (!attempts || attempts.length === 0) return null;

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span>🕐</span>
        Intentos Recientes
      </h2>

      <div className="space-y-3">
        {attempts.map((attempt) => (
          <div
            key={attempt.attempt_id}
            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => navigate(`/quiz-attempts/${attempt.attempt_id}/results`)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white truncate mb-2">
                  {attempt.quiz_title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span
                    className={`px-2 py-1 rounded-md border text-xs font-medium ${getDifficultyColor(
                      attempt.difficulty_level
                    )}`}
                  >
                    {getDifficultyLabel(attempt.difficulty_level)}
                  </span>
                  <span className="text-slate-300">
                    {new Date(attempt.completed_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
              <div
                className={`px-4 py-2 rounded-lg border font-bold text-xl ${getScoreBgColor(
                  attempt.score
                )} ${getScoreColor(attempt.score)}`}
              >
                {attempt.score}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
