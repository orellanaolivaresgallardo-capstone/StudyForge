// frontend/src/pages/quizzes/components/FeedbackSection.tsx
import type { QuizAttemptAnswerFeedback } from "@/types";

interface Props {
  feedback: QuizAttemptAnswerFeedback;
}

export function FeedbackSection({ feedback }: Props) {
  return (
    <div
      className={`mt-6 p-4 rounded-xl border ${
        feedback.is_correct
          ? "bg-green-500/10 border-green-500/30"
          : "bg-red-500/10 border-red-500/30"
      }`}
    >
      <div className="flex items-start gap-3 mb-2">
        {feedback.is_correct ? (
          <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <div>
          <h3 className={`font-bold ${feedback.is_correct ? "text-green-300" : "text-red-300"}`}>
            {feedback.is_correct ? "¡Correcto!" : "Incorrecto"}
          </h3>
          <p className="text-white mt-1">{feedback.explanation}</p>
          {feedback.score_so_far !== undefined && (
            <p className="text-xs text-slate-300 mt-2">
              Puntuación actual: {feedback.score_so_far.toFixed(1)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
