// frontend/src/pages/QuizAttempt.tsx
/**
 * Página para tomar un cuestionario con feedback inmediato.
 * Muestra una pregunta a la vez con navegación y progreso visual.
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  getQuiz,
  createQuizAttempt,
  answerQuestion,
  completeQuizAttempt,
} from "../services/api";
import type {
  QuizResponse,
  QuizAttemptWithQuestionsResponse,
  CorrectOption,
  QuizAttemptAnswerFeedback,
} from "../types/api.types";

export default function QuizAttemptPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [attempt, setAttempt] = useState<QuizAttemptWithQuestionsResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<CorrectOption | null>(null);
  const [feedback, setFeedback] = useState<QuizAttemptAnswerFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadQuizAndStartAttempt(id);
    }
  }, [id]);

  async function loadQuizAndStartAttempt(quizId: string) {
    try {
      setIsLoading(true);
      const quizData = await getQuiz(quizId);
      setQuiz(quizData);

      const attemptData = await createQuizAttempt({ quiz_id: quizId });
      setAttempt(attemptData);
    } catch (error) {
      console.error("Error loading quiz:", error);
      showToast("No se pudo cargar el cuestionario");
      setTimeout(() => navigate("/summaries"), 2000);
    } finally {
      setIsLoading(false);
    }
  }

  function showToast(msg: string, ms = 3000) {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }

  async function handleSubmitAnswer() {
    if (!selectedOption || !attempt) return;

    try {
      setIsSubmitting(true);
      const feedbackData = await answerQuestion(attempt.id, {
        question_index: currentQuestionIndex,
        selected_option: selectedOption,
      });
      setFeedback(feedbackData);
    } catch (error) {
      console.error("Error submitting answer:", error);
      showToast("Error al enviar la respuesta");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNextQuestion() {
    if (!attempt) return;

    if (currentQuestionIndex < attempt.randomized_questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setFeedback(null);
    } else {
      handleCompleteQuiz();
    }
  }

  async function handleCompleteQuiz() {
    if (!attempt) return;

    try {
      await completeQuizAttempt(attempt.id);
      showToast("Cuestionario completado");
      setTimeout(() => navigate(`/quiz-attempts/${attempt.id}/results`), 1000);
    } catch (error) {
      console.error("Error completing quiz:", error);
      showToast("Error al completar el cuestionario");
    }
  }

  const currentQuestion = attempt?.randomized_questions[currentQuestionIndex];
  const progress = attempt ? ((currentQuestionIndex + 1) / attempt.randomized_questions.length) * 100 : 0;

  const optionLetters: CorrectOption[] = ["A", "B", "C", "D"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-slate-50">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
        aria-hidden="true"
      />

      {/* Navbar */}
      <Navbar />

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-10 space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-violet-400 border-t-transparent"></div>
              <p className="mt-4 text-white/60">Cargando cuestionario...</p>
            </div>
          </div>
        )}

        {/* Quiz Content */}
        {!isLoading && quiz && attempt && currentQuestion && (
          <>
            {/* Header */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
                  <p className="text-white/60 mt-1">Tema: {quiz.topic}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/60">Progreso</div>
                  <div className="text-2xl font-bold text-violet-400">
                    {currentQuestionIndex + 1} / {attempt.randomized_questions.length}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-violet-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8">
              {/* Question Number Badge */}
              <div className="inline-block px-3 py-1 bg-violet-500/20 text-violet-300 rounded-lg text-sm font-medium mb-4">
                Pregunta {currentQuestionIndex + 1}
              </div>

              {/* Question Text */}
              <h2 className="text-xl font-semibold text-white mb-6 leading-relaxed">
                {currentQuestion.question}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {optionLetters.map((letter) => {
                  const optionText = currentQuestion.options[letter];
                  const isSelected = selectedOption === letter;
                  const isCorrect = feedback && feedback.correct_option === letter;
                  const isWrong = feedback && selectedOption === letter && !feedback.is_correct;

                  let buttonClasses =
                    "w-full p-4 rounded-xl border-2 text-left transition-all ";

                  if (feedback) {
                    if (isCorrect) {
                      buttonClasses +=
                        "bg-green-500/20 border-green-500 text-green-300";
                    } else if (isWrong) {
                      buttonClasses += "bg-red-500/20 border-red-500 text-red-300";
                    } else {
                      buttonClasses +=
                        "bg-white/5 border-white/10 text-white/60";
                    }
                  } else {
                    if (isSelected) {
                      buttonClasses +=
                        "bg-violet-500/20 border-violet-500 text-white";
                    } else {
                      buttonClasses +=
                        "bg-white/5 border-white/10 text-white hover:border-violet-400/50";
                    }
                  }

                  return (
                    <button
                      key={letter}
                      onClick={() => !feedback && setSelectedOption(letter)}
                      disabled={!!feedback}
                      className={buttonClasses}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            feedback
                              ? isCorrect
                                ? "bg-green-500 text-white"
                                : isWrong
                                ? "bg-red-500 text-white"
                                : "bg-white/10 text-white/60"
                              : isSelected
                              ? "bg-violet-500 text-white"
                              : "bg-white/10 text-white"
                          }`}
                        >
                          {letter}
                        </div>
                        <span className="flex-1 pt-1">{optionText}</span>
                        {feedback && isCorrect && (
                          <svg
                            className="w-6 h-6 text-green-400 flex-shrink-0"
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
                        {feedback && isWrong && (
                          <svg
                            className="w-6 h-6 text-red-400 flex-shrink-0"
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
                    </button>
                  );
                })}
              </div>

              {/* Feedback Section */}
              {feedback && (
                <div
                  className={`mt-6 p-4 rounded-xl border ${
                    feedback.is_correct
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    {feedback.is_correct ? (
                      <svg
                        className="w-6 h-6 text-green-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6 text-red-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                    <div>
                      <h3
                        className={`font-bold ${
                          feedback.is_correct ? "text-green-300" : "text-red-300"
                        }`}
                      >
                        {feedback.is_correct ? "¡Correcto!" : "Incorrecto"}
                      </h3>
                      <p className="text-white mt-1">{feedback.explanation}</p>
                      {feedback.score_so_far !== undefined && (
                        <p className="text-xs text-white/60 mt-2">
                          Puntuación actual: {feedback.score_so_far.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                {!feedback ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedOption || isSubmitting}
                    className="flex-1 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Enviando..." : "Enviar respuesta"}
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="flex-1 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 font-semibold transition-colors"
                  >
                    {currentQuestionIndex < attempt.randomized_questions.length - 1
                      ? "Siguiente pregunta"
                      : "Ver resultados"}
                  </button>
                )}
              </div>
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
