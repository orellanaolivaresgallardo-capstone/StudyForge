import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  getUserProgress,
  getUserPerformance,
  getStatsSummary,
} from "../services/api";
import type {
  UserProgress,
  UserPerformance,
  StatsSummary,
} from "../types/api.types";

export default function Stats() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [performance, setPerformance] = useState<UserPerformance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, progressData, performanceData] = await Promise.all([
        getStatsSummary(),
        getUserProgress(),
        getUserPerformance(10),
      ]);

      setSummary(summaryData);
      setProgress(progressData);
      setPerformance(performanceData);
    } catch (err) {
      console.error("Error loading stats:", err);
      setError("Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return "bg-green-500/10 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/10 border-yellow-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  const getDifficultyLabel = (level: number): string => {
    const labels: { [key: number]: string } = {
      1: "Muy Fácil",
      2: "Fácil",
      3: "Intermedio",
      4: "Difícil",
      5: "Muy Difícil",
    };
    return labels[level] || "Desconocido";
  };

  const getDifficultyColor = (level: number): string => {
    if (level <= 2) return "bg-green-500/10 text-green-400 border-green-500/30";
    if (level === 3) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    return "bg-red-500/10 text-red-400 border-red-500/30";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
          aria-hidden="true"
        />
        <Navbar />
        <div className="relative flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-violet-400 mx-auto"></div>
            <p className="text-white/60 mt-4">Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
          aria-hidden="true"
        />
        <Navbar />
        <div className="relative container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto bg-red-500/10 border border-red-500/30 backdrop-blur-xl rounded-2xl p-6">
            <p className="text-red-400 text-center">{error}</p>
            <button
              onClick={loadStats}
              className="mt-4 w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasData =
    summary &&
    (summary.total_summaries > 0 ||
      summary.total_quizzes > 0 ||
      summary.total_completed_attempts > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
        aria-hidden="true"
      />
      <Navbar />

      <div className="relative container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              📊 Mis Estadísticas
            </h1>
            <p className="text-white/60">
              Visualiza tu progreso y desempeño en el aprendizaje
            </p>
          </div>

          {!hasData ? (
            /* Empty State */
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">📈</div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Aún no hay estadísticas
              </h2>
              <p className="text-white/60 mb-6 max-w-md mx-auto">
                Comienza subiendo documentos y generando resúmenes para ver tu
                progreso aquí.
              </p>
              <button
                onClick={() => navigate("/documents")}
                className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Ir a Documentos
              </button>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {/* Total Summaries */}
                  <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/60 text-sm mb-1">Resúmenes</p>
                        <p className="text-4xl font-bold text-white">
                          {summary.total_summaries}
                        </p>
                      </div>
                      <div className="text-4xl">📝</div>
                    </div>
                  </div>

                  {/* Total Quizzes */}
                  <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/60 text-sm mb-1">Cuestionarios</p>
                        <p className="text-4xl font-bold text-white">
                          {summary.total_quizzes}
                        </p>
                      </div>
                      <div className="text-4xl">📋</div>
                    </div>
                  </div>

                  {/* Completed Attempts */}
                  <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/60 text-sm mb-1">Intentos</p>
                        <p className="text-4xl font-bold text-white">
                          {summary.total_completed_attempts}
                        </p>
                      </div>
                      <div className="text-4xl">✅</div>
                    </div>
                  </div>

                  {/* Average Score */}
                  <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/60 text-sm mb-1">
                          Promedio General
                        </p>
                        <p
                          className={`text-4xl font-bold ${getScoreColor(
                            summary.avg_score
                          )}`}
                        >
                          {summary.avg_score}%
                        </p>
                      </div>
                      <div className="text-4xl">📊</div>
                    </div>
                  </div>

                  {/* Best Score */}
                  <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/60 text-sm mb-1">Mejor Score</p>
                        <p
                          className={`text-4xl font-bold ${getScoreColor(
                            summary.best_score
                          )}`}
                        >
                          {summary.best_score}%
                        </p>
                      </div>
                      <div className="text-4xl">🏆</div>
                    </div>
                  </div>

                  {/* Unique Topics */}
                  <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/60 text-sm mb-1">Temas Estudiados</p>
                        <p className="text-4xl font-bold text-white">
                          {summary.unique_topics_studied}
                        </p>
                      </div>
                      <div className="text-4xl">🎓</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress by Topic */}
              {progress && progress.progress_by_topic.length > 0 && (
                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 mb-8">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span>📈</span>
                    Progreso por Tema
                  </h2>

                  <div className="space-y-4">
                    {progress.progress_by_topic.map((topic, index) => (
                      <div
                        key={index}
                        className="bg-white/5 border border-white/10 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-white">
                            {topic.topic}
                          </h3>
                          <span className="text-sm text-white/60">
                            {topic.total_attempts} intento
                            {topic.total_attempts !== 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-white/60 mb-1">Promedio</p>
                            <p
                              className={`text-2xl font-bold ${getScoreColor(
                                topic.avg_score
                              )}`}
                            >
                              {topic.avg_score}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-white/60 mb-1">Máximo</p>
                            <p
                              className={`text-2xl font-bold ${getScoreColor(
                                topic.max_score
                              )}`}
                            >
                              {topic.max_score}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-white/60 mb-1">Mínimo</p>
                            <p
                              className={`text-2xl font-bold ${getScoreColor(
                                topic.min_score
                              )}`}
                            >
                              {topic.min_score}%
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-4">
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                topic.avg_score >= 80
                                  ? "bg-green-500"
                                  : topic.avg_score >= 60
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${topic.avg_score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Attempts */}
              {performance && performance.recent_attempts.length > 0 && (
                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span>🕐</span>
                    Intentos Recientes
                  </h2>

                  <div className="space-y-3">
                    {performance.recent_attempts.map((attempt) => (
                      <div
                        key={attempt.attempt_id}
                        className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() =>
                          navigate(`/quiz-attempts/${attempt.attempt_id}/results`)
                        }
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white truncate mb-2">
                              {attempt.quiz_title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="text-white/60">
                                📚 {attempt.topic}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-md border text-xs font-medium ${getDifficultyColor(
                                  attempt.difficulty_level
                                )}`}
                              >
                                {getDifficultyLabel(attempt.difficulty_level)}
                              </span>
                              <span className="text-white/60">
                                {new Date(attempt.completed_at).toLocaleDateString(
                                  "es-ES",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
