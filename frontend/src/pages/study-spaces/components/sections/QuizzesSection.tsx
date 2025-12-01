/**
 * Quizzes section for StudySpaceDetailPage
 */
import { QuizCard, EmptyState } from '@/components';
import type { QuizResponse } from '@/types';

interface QuizzesSectionProps {
  quizzes: QuizResponse[];
  onCreateQuiz: () => void;
}

export function QuizzesSection({ quizzes, onCreateQuiz }: QuizzesSectionProps) {
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Quizzes</h2>
        <button
          onClick={onCreateQuiz}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          + Crear Quiz
        </button>
      </div>

      {quizzes.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
          title="No hay quizzes en este espacio"
          description="Crea quizzes para evaluar tu conocimiento"
          action={{
            label: '+ Crear Quiz',
            onClick: onCreateQuiz,
          }}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
}
