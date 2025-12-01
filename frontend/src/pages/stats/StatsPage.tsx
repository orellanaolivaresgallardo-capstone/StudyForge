// frontend/src/pages/stats/StatsPage.tsx
import { useState, useEffect } from "react";
import { Toast, PerformanceChart, LoadingSpinner } from "@/components";
import type { ToastType } from "@/components";
import { getUserPerformance, getStatsSummary, getProgressBySpace } from "@/services/api";
import type { UserPerformance, StatsSummary, StudySpaceStatsResponse } from "@/types";
import { StatsSummaryCards, ProgressBySpace, RecentAttempts, EmptyState } from "./components";

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [performance, setPerformance] = useState<UserPerformance | null>(null);
  const [progressBySpace, setProgressBySpace] = useState<StudySpaceStatsResponse[]>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [summaryData, performanceData, progressBySpaceData] = await Promise.all([
        getStatsSummary(),
        getUserPerformance(10),
        getProgressBySpace(),
      ]);
      setSummary(summaryData);
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
      <div className="relative min-h-[calc(100vh-64px)]">
        <LoadingSpinner size="lg" message="Cargando estadísticas..." />
      </div>
    );
  }

  const hasData =
    summary &&
    (summary.total_summaries > 0 || summary.total_quizzes > 0 || summary.total_completed_attempts > 0);

  return (
    <>
      <div className="relative container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">📊 Mis Estadísticas</h1>
            <p className="text-slate-300">Visualiza tu progreso y desempeño en el aprendizaje</p>
          </div>

          {!hasData ? (
            <EmptyState />
          ) : (
            <>
              {summary && <StatsSummaryCards summary={summary} getScoreColor={getScoreColor} />}
              <ProgressBySpace progressBySpace={progressBySpace} getScoreColor={getScoreColor} />
              {performance && performance.recent_attempts.length > 0 && (
                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 mb-8">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span>📈</span>
                    Rendimiento Reciente
                  </h2>
                  <PerformanceChart attempts={performance.recent_attempts} height={300} />
                </div>
              )}
              {performance && performance.recent_attempts.length > 0 && (
                <RecentAttempts
                  attempts={performance.recent_attempts}
                  getScoreColor={getScoreColor}
                  getScoreBgColor={getScoreBgColor}
                  getDifficultyLabel={getDifficultyLabel}
                  getDifficultyColor={getDifficultyColor}
                />
              )}
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
