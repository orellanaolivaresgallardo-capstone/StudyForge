// frontend/src/pages/quizzes/components/ScoreCard.tsx
/**
 * Score display card for quiz results
 */
interface ScoreCardProps {
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalQuestions: number;
  quizId: string;
}

export function ScoreCard({
  score,
  correctAnswers,
  incorrectAnswers,
  totalQuestions,
  quizId,
}: ScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-500/20 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/20 border-yellow-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return "¡Excelente trabajo! Dominas este tema.";
    if (score >= 80) return "¡Muy bien! Tienes un buen dominio del tema.";
    if (score >= 70) return "Buen trabajo, pero hay espacio para mejorar.";
    if (score >= 60) return "Aprobado, pero deberías repasar algunos conceptos.";
    return "Necesitas repasar el material. ¡No te rindas!";
  };

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8">
      <div className="text-center">
        {/* Score Badge */}
        <div
          className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${getScoreBadgeColor(
            score
          )} mb-6`}
        >
          <div>
            <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
              {score.toFixed(0)}%
            </div>
            <div className="text-xs text-slate-300">
              {correctAnswers}/{totalQuestions}
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2">
          Resultados del Cuestionario
        </h1>
        <p className="text-slate-300 mb-4">Quiz ID: {quizId.slice(0, 8)}</p>

        {/* Message */}
        <p className="text-lg text-white mb-6">{getScoreMessage(score)}</p>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-md mx-auto w-full">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-400">
              {correctAnswers}
            </div>
            <div className="text-xs text-slate-300">Correctas</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-2xl font-bold text-red-400">
              {incorrectAnswers}
            </div>
            <div className="text-xs text-slate-300">Incorrectas</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-2xl font-bold text-violet-400">
              {totalQuestions}
            </div>
            <div className="text-xs text-slate-300">Total</div>
          </div>
        </div>
      </div>
    </div>
  );
}
