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
  QuizDetailResponse,
  QuestionResponse,
  QuizAttemptResponse,
  CorrectOption,
  QuizAttemptAnswerFeedback,
} from "../types/api.types";

export default function QuizAttemptPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizDetailResponse | null>(null);
  const [attempt, setAttempt] = useState<QuizAttemptResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<CorrectOption | null>(null);
  const [feedback, setFeedback] = useState<QuizAttemptAnswerFeedback | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
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
    if (!selectedOption || !attempt || !quiz) return;

    const currentQuestion = quiz.questions[currentQuestionIndex];

    try {
      setIsSubmitting(true);
      const feedbackData = await answerQuestion(attempt.id, {
        question_id: currentQuestion.id,
        selected_option: selectedOption,
      });
      setFeedback(feedbackData);
      setAnsweredQuestions(new Set([...answeredQuestions, currentQuestion.id]));
    } catch (error) {
      console.error("Error submitting answer:", error);
      showToast("Error al enviar la respuesta");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNextQuestion() {
    if (!quiz) return;

    if (currentQuestionIndex < quiz.questions.length - 1) {
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

  const currentQuestion = quiz?.questions[currentQuestionIndex];
  const progress = quiz ? ((currentQuestionIndex + 1) / quiz.questions.length) * 100 : 0;

  const optionLetters: CorrectOption[] = ["A", "B", "C", "D"];

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

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-10 space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
              <p className="mt-4 text-slate-300">Cargando cuestionario...</p>
            </div>
          </div>
        )}

        {/* Quiz Content */}
        {!isLoading && quiz && currentQuestion && (
          <>
            {/* Header */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{quiz.title}</h1>
                  <p className="text-slate-400 mt-1">Tema: {quiz.topic}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">Progreso</div>
                  <div className="text-2xl font-bold text-violet-400">
                    {currentQuestionIndex + 1} / {quiz.questions.length}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
              {/* Question Number Badge */}
              <div className="inline-block px-3 py-1 bg-violet-500/20 text-violet-300 rounded-lg text-sm font-medium mb-4">
                Pregunta {currentQuestionIndex + 1}
              </div>

              {/* Question Text */}
              <h2 className="text-xl font-semibold mb-6 leading-relaxed">
                {currentQuestion.question_text}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {optionLetters.map((letter) => {
                  const optionKey = `option_${letter.toLowerCase()}` as keyof QuestionResponse;
                  const optionText = currentQuestion[optionKey] as string;
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
                        "bg-slate-900/50 border-slate-700/50 text-slate-400";
                    }
                  } else {
                    if (isSelected) {
                      buttonClasses +=
                        "bg-violet-500/20 border-violet-500 text-white";
                    } else {
                      buttonClasses +=
                        "bg-slate-900/50 border-slate-700/50 text-white hover:border-violet-500/50";
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
                                : "bg-slate-700 text-slate-400"
                              : isSelected
                              ? "bg-violet-500 text-white"
                              : "bg-slate-700 text-slate-300"
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
                      <p className="text-slate-300 mt-1">{feedback.explanation}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        Puntuación actual: {feedback.score_so_far.toFixed(1)}%
                      </p>
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
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Enviando..." : "Enviar respuesta"}
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold transition-all"
                  >
                    {currentQuestionIndex < quiz.questions.length - 1
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
          <div className="fixed bottom-8 right-8 z-50 px-6 py-3 bg-slate-800/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl">
            <p className="text-white">{toast}</p>
          </div>
        )}
      </main>
    </div>
  );
}
