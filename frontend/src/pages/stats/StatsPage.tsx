// frontend/src/pages/stats/StatsPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar, Toast, PerformanceChart, LoadingSpinner } from "@/components";
import type { ToastType } from "@/components";
import {
  getUserProgress,
  getUserPerformance,
  getStatsSummary,
  getProgressBySpace,
} from "@/services/api";
import type {
  UserProgress,
  UserPerformance,
  StatsSummary,
  StudySpaceStatsResponse,
} from "@/types/api.types";

export default function StatsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [performance, setPerformance] = useState<UserPerformance | null>(null);
  const [progressBySpace, setProgressBySpace] = useState<StudySpaceStatsResponse[]>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      const [summaryData, progressData, performanceData, progressBySpaceData] = await Promise.all([
        getStatsSummary(),
        getUserProgress(),
        getUserPerformance(10),
        getProgressBySpace(),
      ]);

      setSummary(summaryData);
      setProgress(progressData);
      setPerformance(performanceData);
      setProgressBySpace(progressBySpaceData);
    } catch (err) {
      console.error("Error loading stats:", err);
      setToast({ message: "Error al cargar estadísticas", type: "error" });
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
        <div className="relative min-h-[calc(100vh-64px)]">
          <LoadingSpinner size="lg" message="Cargando estadísticas..." />
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

              {/* Progress by Study Space */}
              {progressBySpace && progressBySpace.length > 0 && (
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

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-white/5 rounded-lg p-2">
                            <p className="text-xs text-white/60">Documentos</p>
                            <p className="text-lg font-bold text-blue-400">{space.num_documents}</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2">
                            <p className="text-xs text-white/60">Resúmenes</p>
                            <p className="text-lg font-bold text-purple-400">{space.num_summaries}</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2">
                            <p className="text-xs text-white/60">Quizzes</p>
                            <p className="text-lg font-bold text-pink-400">{space.num_quizzes}</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2">
                            <p className="text-xs text-white/60">Intentos</p>
                            <p className="text-lg font-bold text-cyan-400">{space.total_attempts}</p>
                          </div>
                        </div>

                        {/* Performance */}
                        {space.total_attempts > 0 && (
                          <div className="border-t border-white/10 pt-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-white/60">Promedio</span>
                              <span className={`text-xl font-bold ${getScoreColor(space.avg_score)}`}>
                                {space.avg_score}%
                              </span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  space.avg_score >= 80
                                    ? "bg-green-500"
                                    : space.avg_score >= 60
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${space.avg_score}%` }}
                              />
                            </div>
                            {space.best_score > 0 && (
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-white/60">Mejor</span>
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
              )}

              {/* Performance Chart */}
              {performance && performance.recent_attempts.length > 0 && (
                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 mb-8">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span>📈</span>
                    Rendimiento Reciente
                  </h2>
                  <PerformanceChart attempts={performance.recent_attempts} height={300} />
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

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
