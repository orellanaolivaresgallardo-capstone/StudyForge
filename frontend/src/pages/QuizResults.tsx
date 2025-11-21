// frontend/src/pages/QuizResults.tsx
/**
 * Página de resultados del cuestionario con desglose detallado.
 * Muestra score final, respuestas correctas/incorrectas y recomendaciones.
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getQuizAttemptResults } from "../services/api";
import type {
  QuizResultResponse,
  CorrectOption,
} from "../types/api.types";

export default function QuizResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [results, setResults] = useState<QuizResultResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadResults(id);
    }
  }, [id]);

  async function loadResults(attemptId: string) {
    try {
      setIsLoading(true);
      const data = await getQuizAttemptResults(attemptId);
      setResults(data);
    } catch (error) {
      console.error("Error loading results:", error);
      showToast("No se pudieron cargar los resultados");
      setTimeout(() => navigate("/summaries"), 2000);
    } finally {
      setIsLoading(false);
    }
  }

  function showToast(msg: string, ms = 3000) {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }

  function getScoreColor(score: number) {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  }

  function getScoreBadgeColor(score: number) {
    if (score >= 80) return "bg-green-500/20 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/20 border-yellow-500/30";
    return "bg-red-500/20 border-red-500/30";
  }

  function getScoreMessage(score: number) {
    if (score >= 90) return "¡Excelente trabajo! Dominas este tema.";
    if (score >= 80) return "¡Muy bien! Tienes un buen dominio del tema.";
    if (score >= 70) return "Buen trabajo, pero hay espacio para mejorar.";
    if (score >= 60) return "Aprobado, pero deberías repasar algunos conceptos.";
    return "Necesitas repasar el material. ¡No te rindas!";
  }

  const optionLetters: CorrectOption[] = ["A", "B", "C", "D"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-slate-50">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
        aria-hidden="true"
      />

      {/* Navbar */}
      <Navbar />

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-10 space-y-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/summaries")}
          className="flex items-center gap-2 text-white/60 hover:text-violet-400 transition-colors"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver a resúmenes
        </button>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-violet-400 border-t-transparent"></div>
              <p className="mt-4 text-white/60">Cargando resultados...</p>
            </div>
          </div>
        )}

        {/* Results Content */}
        {!isLoading && results && (
          <>
            {/* Score Card */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8">
              <div className="text-center">
                {/* Score Badge */}
                <div
                  className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${getScoreBadgeColor(
                    results.score
                  )} mb-6`}
                >
                  <div>
                    <div className={`text-4xl font-bold ${getScoreColor(results.score)}`}>
                      {results.score.toFixed(0)}%
                    </div>
                    <div className="text-xs text-white/60">
                      {results.correct_answers}/{results.total_questions}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-white mb-2">Resultados del Cuestionario</h1>
                <p className="text-white/60 mb-4">Quiz ID: {results.quiz_id.slice(0, 8)}</p>

                {/* Message */}
                <p className="text-lg text-white mb-6">
                  {getScoreMessage(results.score)}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-md mx-auto w-full">
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="text-2xl font-bold text-green-400">
                      {results.correct_answers}
                    </div>
                    <div className="text-xs text-white/60">Correctas</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="text-2xl font-bold text-red-400">
                      {results.incorrect_answers}
                    </div>
                    <div className="text-xs text-white/60">Incorrectas</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="text-2xl font-bold text-violet-400">
                      {results.total_questions}
                    </div>
                    <div className="text-xs text-white/60">Total</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions Review */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Revisión de respuestas</h2>

              <div className="space-y-6">
                {results.questions.map((question, idx) => {
                  const isCorrect = question.is_correct;
                  const selectedOption = question.selected_option;
                  const correctOption = question.correct_option;

                  return (
                    <div
                      key={idx}
                      className={`p-6 rounded-xl border-2 ${
                        isCorrect
                          ? "bg-green-500/5 border-green-500/30"
                          : "bg-red-500/5 border-red-500/30"
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-start gap-3 mb-4">
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            isCorrect
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-white mb-3">
                            {question.question_text}
                          </h3>

                          {/* Options */}
                          <div className="space-y-2">
                            {optionLetters.map((letter) => {
                              const optionText = question.options[letter];
                              const isSelectedOption = selectedOption === letter;
                              const isCorrectOption = correctOption === letter;

                              let optionClasses = "p-3 rounded-lg border flex items-start gap-2 ";

                              if (isCorrectOption) {
                                optionClasses +=
                                  "bg-green-500/20 border-green-500 text-green-300";
                              } else if (isSelectedOption && !isCorrect) {
                                optionClasses +=
                                  "bg-red-500/20 border-red-500 text-red-300";
                              } else {
                                optionClasses +=
                                  "bg-white/5 border-white/10 text-white/60";
                              }

                              return (
                                <div key={letter} className={optionClasses}>
                                  <span className="font-bold">{letter}.</span>
                                  <span className="flex-1">{optionText}</span>
                                  {isCorrectOption && (
                                    <svg
                                      className="w-5 h-5 text-green-400 flex-shrink-0"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                  {isSelectedOption && !isCorrect && (
                                    <svg
                                      className="w-5 h-5 text-red-400 flex-shrink-0"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation */}
                          <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                            <h4 className="text-sm font-semibold text-white mb-1">
                              Explicación:
                            </h4>
                            <p className="text-sm text-white/60">
                              {question.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate("/summaries")}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 font-medium transition-colors"
              >
                Volver a resúmenes
              </button>
              <button
                onClick={() => navigate(`/quizzes/${results.quiz_id}/attempt`)}
                className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 font-semibold transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          </>
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
