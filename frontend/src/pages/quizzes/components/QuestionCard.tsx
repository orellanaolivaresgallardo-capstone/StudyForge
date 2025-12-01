// frontend/src/pages/quizzes/components/QuestionCard.tsx
import type { CorrectOption, QuestionWithRandomizedOptions } from "@/types";

interface Props {
  question: QuestionWithRandomizedOptions;
  questionNumber: number;
  selectedOption: CorrectOption | null;
  onSelectOption: (option: CorrectOption) => void;
  isAnswered: boolean;
  correctOption?: CorrectOption;
  isCorrect?: boolean;
}

export function QuestionCard({
  question,
  questionNumber,
  selectedOption,
  onSelectOption,
  isAnswered,
  correctOption,
  isCorrect,
}: Props) {
  const optionLetters: CorrectOption[] = ["A", "B", "C", "D"];

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8">
      <div className="inline-block px-3 py-1 bg-violet-500/20 text-violet-300 rounded-lg text-sm font-medium mb-4">
        Pregunta {questionNumber}
      </div>

      <h2 className="text-xl font-semibold text-white mb-6 leading-relaxed">
        {question.question}
      </h2>

      <div className="space-y-3">
        {optionLetters.map((letter) => {
          const optionText = question.options[letter];
          const isSelected = selectedOption === letter;
          const isThisCorrect = isAnswered && correctOption === letter;
          const isWrong = isAnswered && selectedOption === letter && !isCorrect;

          let buttonClasses = "w-full p-4 rounded-xl border-2 text-left transition-all ";

          if (isAnswered) {
            if (isThisCorrect) {
              buttonClasses += "bg-green-500/20 border-green-500 text-green-300";
            } else if (isWrong) {
              buttonClasses += "bg-red-500/20 border-red-500 text-red-300";
            } else {
              buttonClasses += "bg-white/5 border-white/10 text-slate-300";
            }
          } else {
            if (isSelected) {
              buttonClasses += "bg-violet-500/20 border-violet-500 text-white";
            } else {
              buttonClasses += "bg-white/5 border-white/10 text-white hover:border-violet-400/50";
            }
          }

          return (
            <button
              key={letter}
              onClick={() => !isAnswered && onSelectOption(letter)}
              disabled={isAnswered}
              className={buttonClasses}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    isAnswered
                      ? isThisCorrect
                        ? "bg-green-500 text-white"
                        : isWrong
                        ? "bg-red-500 text-white"
                        : "bg-white/10 text-slate-300"
                      : isSelected
                      ? "bg-violet-500 text-white"
                      : "bg-white/10 text-white"
                  }`}
                >
                  {letter}
                </div>
                <span className="flex-1 pt-1">{optionText}</span>
                {isAnswered && isThisCorrect && (
                  <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isAnswered && isWrong && (
                  <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
