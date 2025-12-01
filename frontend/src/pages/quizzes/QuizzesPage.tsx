// frontend/src/pages/quizzes/QuizzesPage.tsx
/**
 * Página de lista de cuestionarios.
 * Muestra todos los quizzes disponibles con información de tema y dificultad.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toast, QuizCard, LoadingSpinner } from "@/components";
import type { ToastType } from "@/components";
import { listQuizzes } from "@/services/api";
import type { QuizResponse } from "@/types";
import { getErrorMessage } from "@/utils/errorHandler";

export default function QuizzesPage() {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState<QuizResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

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
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsLoading(false);
    }
  }

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ message: msg, type });
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Mis Cuestionarios
            </h1>
            <p className="text-slate-300 mt-1">
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
        {isLoading && <LoadingSpinner message="Cargando cuestionarios..." />}

        {/* Empty State */}
        {!isLoading && quizzes.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex h-20 w-20 rounded-full bg-white/10 items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-slate-300"
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
            <p className="text-slate-300 mb-6">
              Crea tu primer cuestionario desde un resumen o un espacio de estudio
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate("/summaries")}
                className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 font-semibold transition-colors"
              >
                Ir a resúmenes
              </button>
              <button
                onClick={() => navigate("/study-spaces")}
                className="px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 font-semibold transition-colors"
              >
                Ir a espacios
              </button>
            </div>
          </div>
        )}

        {/* Quizzes Grid */}
        {!isLoading && quizzes.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
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
                <p className="text-sm text-slate-300">
                  La dificultad de los cuestionarios se ajusta automáticamente
                  según tu rendimiento en intentos anteriores. Cada quiz incluye
                  feedback inmediato con explicaciones detalladas para ayudarte
                  a aprender.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
