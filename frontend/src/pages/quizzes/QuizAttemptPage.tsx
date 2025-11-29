// frontend/src/pages/quizzes/QuizAttemptPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components";
import { getQuiz, createQuizAttempt, answerQuestion, completeQuizAttempt } from "@/services/api";
import type {
  QuizResponse,
  QuizAttemptWithQuestionsResponse,
  CorrectOption,
  QuizAttemptAnswerFeedback,
} from "@/types";
import { QuizHeader, QuestionCard, FeedbackSection } from "./components";

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
    if (id) loadQuizAndStartAttempt(id);
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

  return (
    <>
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-10 space-y-6 text-slate-50">
        {isLoading && <LoadingSpinner message="Cargando cuestionario..." />}

        {!isLoading && quiz && attempt && currentQuestion && (
          <>
            <QuizHeader
              title={quiz.title}
              currentQuestion={currentQuestionIndex + 1}
              totalQuestions={attempt.randomized_questions.length}
              progress={progress}
            />

            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              selectedOption={selectedOption}
              onSelectOption={setSelectedOption}
              isAnswered={!!feedback}
              correctOption={feedback?.correct_option}
              isCorrect={feedback?.is_correct}
            />

            {feedback && <FeedbackSection feedback={feedback} />}

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
          </>
        )}

        {toast && (
          <div className="fixed bottom-8 right-8 z-50 px-6 py-3 bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl shadow-2xl">
            <p className="text-white">{toast}</p>
          </div>
        )}
      </main>
    </>
  );
}
