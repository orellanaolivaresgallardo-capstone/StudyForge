// frontend/src/pages/quizzes/components/ResultActions.tsx
/**
 * Action buttons for quiz results
 */
import { useNavigate } from "react-router-dom";
import type { StudySpaceSnapshotData } from "@/types";

interface ResultActionsProps {
  quizId: string;
  studySpaceSnapshot?: StudySpaceSnapshotData | null;
}

export function ResultActions({ quizId, studySpaceSnapshot }: ResultActionsProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Primary action: Retry quiz */}
      <div className="flex justify-center">
        <button
          onClick={() => navigate(`/quizzes/${quizId}/attempt`)}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 font-semibold transition-all shadow-lg hover:shadow-xl"
        >
          Intentar de nuevo
        </button>
      </div>

      {/* Navigation options */}
      <div className="flex gap-3 justify-center flex-wrap">
        {studySpaceSnapshot && (
          <button
            onClick={() => navigate(`/study-spaces/${studySpaceSnapshot.id}`)}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Volver al espacio
          </button>
        )}
        <button
          onClick={() => navigate("/stats")}
          className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Ver estadísticas
        </button>
      </div>
    </div>
  );
}
