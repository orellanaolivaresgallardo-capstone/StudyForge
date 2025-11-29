// frontend/src/pages/quizzes/components/ResultActions.tsx
/**
 * Action buttons for quiz results
 */
import { useNavigate } from "react-router-dom";

interface ResultActionsProps {
  quizId: string;
}

export function ResultActions({ quizId }: ResultActionsProps) {
  const navigate = useNavigate();

  return (
    <div className="flex gap-4 justify-center">
      <button
        onClick={() => navigate("/summaries")}
        className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 font-medium transition-colors"
      >
        Volver a resúmenes
      </button>
      <button
        onClick={() => navigate(`/quizzes/${quizId}/attempt`)}
        className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 font-semibold transition-colors"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
