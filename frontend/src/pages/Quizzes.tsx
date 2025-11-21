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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
        aria-hidden="true"
      />

      {/* Navbar */}
      <Navbar />

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Mis Cuestionarios
            </h1>
            <p className="text-white/60 mt-1">
              Practica y evalúa tu comprensión con quizzes adaptativos
            </p>
          </div>
          <button
            onClick={() => navigate("/summaries")}
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
            Crear quiz
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-violet-400 border-t-transparent"></div>
              <p className="mt-4 text-white/60">Cargando cuestionarios...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && quizzes.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex h-20 w-20 rounded-full bg-white/10 items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-white/60"
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
            <h3 className="text-xl font-semibold text-white mb-2">
              No tienes cuestionarios aún
            </h3>
            <p className="text-white/60 mb-6">
              Crea tu primer cuestionario desde un resumen
            </p>
            <button
              onClick={() => navigate("/summaries")}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 font-semibold transition-colors"
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
                className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 hover:border-violet-400/30 transition-all group"
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
                  <p className="text-xs text-white/60 mb-1">Tema:</p>
                  <p className="text-sm text-white font-medium">
                    {quiz.topic}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-xs text-white/60">
                    {new Date(quiz.created_at).toLocaleDateString("es-ES")}
                  </span>
                  <button
                    onClick={() => handleStartQuiz(quiz.id)}
                    className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-sm font-semibold transition-colors"
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
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-6">
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
                <p className="text-sm text-white/60">
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
          <div className="fixed bottom-8 right-8 z-50 px-6 py-3 bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl shadow-2xl">
            <p className="text-white">{toast}</p>
          </div>
        )}
      </main>
    </div>
  );
}
