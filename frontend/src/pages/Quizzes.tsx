// frontend/src/pages/Quizzes.tsx
/**
 * Página de lista de cuestionarios.
 * Muestra todos los quizzes disponibles con información de tema y dificultad.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { listQuizzes } from "../services/api";
import type { QuizResponse } from "../types/api.types";

export default function QuizzesPage() {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState<QuizResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  async function loadQuizzes() {
    try {
      setIsLoading(true);
      const response = await listQuizzes();
      setQuizzes(response.items);
    } catch (error) {
      console.error("Error loading quizzes:", error);
      showToast("No se pudieron cargar los cuestionarios");
    } finally {
      setIsLoading(false);
    }
  }

  function showToast(msg: string, ms = 3000) {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }

  function handleStartQuiz(quizId: string) {
    navigate(`/quizzes/${quizId}/attempt`);
  }

  function getDifficultyColor(difficulty: number) {
    if (difficulty <= 2) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (difficulty <= 3) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  }

  function getDifficultyLabel(difficulty: number) {
    if (difficulty === 1) return "Muy Fácil";
    if (difficulty === 2) return "Fácil";
    if (difficulty === 3) return "Medio";
    if (difficulty === 4) return "Difícil";
    return "Muy Difícil";
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden text-slate-50">
      {/* Aurora background */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `
          radial-gradient(1200px 600px at 20% -20%, rgba(139,92,246,0.10), transparent 55%),
          radial-gradient(900px 500px at 120% 10%, rgba(34,211,238,0.10), transparent 55%),
          #0b1220
        `,
        }}
      ></div>

      {/* Navbar */}
      <Navbar />

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Mis Cuestionarios
            </h1>
            <p className="text-slate-400 mt-1">
              Practica y evalúa tu comprensión con quizzes adaptativos
            </p>
          </div>
          <button
            onClick={() => navigate("/summaries")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center gap-2"
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
            Crear quiz
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
              <p className="mt-4 text-slate-300">Cargando cuestionarios...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && quizzes.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex h-20 w-20 rounded-full bg-slate-800/50 items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              No tienes cuestionarios aún
            </h3>
            <p className="text-slate-400 mb-6">
              Crea tu primer cuestionario desde un resumen
            </p>
            <button
              onClick={() => navigate("/summaries")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold transition-all"
            >
              Ir a resúmenes
            </button>
          </div>
        )}

        {/* Quizzes Grid */}
        {!isLoading && quizzes.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:border-violet-500/50 transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-400 transition-colors line-clamp-2">
                      {quiz.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-block px-2 py-1 rounded-lg text-xs font-medium border ${getDifficultyColor(
                          quiz.difficulty_level
                        )}`}
                      >
                        {getDifficultyLabel(quiz.difficulty_level)}
                      </span>
                      <span className="inline-block px-2 py-1 rounded-lg text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {quiz.max_questions} preguntas
                      </span>
                    </div>
                  </div>
                </div>

                {/* Topic */}
                <div className="mb-4">
                  <p className="text-xs text-slate-400 mb-1">Tema:</p>
                  <p className="text-sm text-slate-200 font-medium">
                    {quiz.topic}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                  <span className="text-xs text-slate-500">
                    {new Date(quiz.created_at).toLocaleDateString("es-ES")}
                  </span>
                  <button
                    onClick={() => handleStartQuiz(quiz.id)}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-sm font-semibold transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                  >
                    Iniciar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        {!isLoading && quizzes.length > 0 && (
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/30 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 bg-violet-500/20 rounded-xl">
                <svg
                  className="w-6 h-6 text-violet-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">
                  Sobre los cuestionarios adaptativos
                </h3>
                <p className="text-sm text-slate-400">
                  La dificultad de los cuestionarios se ajusta automáticamente
                  según tu rendimiento en intentos anteriores. Cada quiz incluye
                  feedback inmediato con explicaciones detalladas para ayudarte
                  a aprender.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-8 right-8 z-50 px-6 py-3 bg-slate-800/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl">
            <p className="text-white">{toast}</p>
          </div>
        )}
      </main>
    </div>
  );
}
