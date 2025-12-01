// frontend/src/pages/quizzes/components/QuizHeader.tsx
interface Props {
  title: string;
  currentQuestion: number;
  totalQuestions: number;
  progress: number;
}

export function QuizHeader({ title, currentQuestion, totalQuestions, progress }: Props) {
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-300">Progreso</div>
          <div className="text-2xl font-bold text-violet-400">
            {currentQuestion} / {totalQuestions}
          </div>
        </div>
      </div>

      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <div
          className="bg-violet-600 h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}
