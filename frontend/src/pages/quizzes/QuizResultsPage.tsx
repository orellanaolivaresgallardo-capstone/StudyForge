// frontend/src/pages/quizzes/QuizResultsPage.tsx
/**
 * Quiz Results Page - REFACTORED VERSION
 * Reduced from 290 → ~90 lines using extracted components
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components";
import { ScoreCard, QuestionReview, ResultActions } from "./components";
import { getQuizAttemptResults } from "@/services/api";
import type { QuizResultResponse } from "@/types";

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

  return (
    <>
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-10 space-y-8 text-slate-50">
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
        {isLoading && <LoadingSpinner message="Cargando resultados..." />}

        {/* Results Content */}
        {!isLoading && results && (
          <>
            <ScoreCard
              score={results.score}
              correctAnswers={results.correct_answers}
              incorrectAnswers={results.incorrect_answers}
              totalQuestions={results.total_questions}
              quizId={results.quiz_id}
            />

            <QuestionReview questions={results.questions} />

            <ResultActions quizId={results.quiz_id} />
          </>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-8 right-8 z-50 px-6 py-3 bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl shadow-2xl">
            <p className="text-white">{toast}</p>
          </div>
        )}
      </main>
    </>
  );
}
