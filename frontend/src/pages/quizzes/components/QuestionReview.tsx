// frontend/src/pages/quizzes/components/QuestionReview.tsx
/**
 * Question review section showing all answers
 */
import type { QuizResultResponse, CorrectOption } from "@/types";

interface QuestionReviewProps {
  questions: QuizResultResponse["questions"];
}

const optionLetters: CorrectOption[] = ["A", "B", "C", "D"];

export function QuestionReview({ questions }: QuestionReviewProps) {
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-6">Revisión de respuestas</h2>

      <div className="space-y-6">
        {questions.map((question, idx) => {
          const isCorrect = question.is_correct;
          const selectedOption = question.selected_option;
          const correctOption = question.correct_option;

          return (
            <div
              key={idx}
              className={`p-6 rounded-xl border-2 ${
                isCorrect
                  ? "bg-green-500/5 border-green-500/30"
                  : "bg-red-500/5 border-red-500/30"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    isCorrect
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-white mb-3">
                    {question.question_text}
                  </h3>

                  {/* Options */}
                  <div className="space-y-2">
                    {optionLetters.map((letter) => {
                      const optionText = question.options[letter];
                      const isSelectedOption = selectedOption === letter;
                      const isCorrectOption = correctOption === letter;

                      let optionClasses = "p-3 rounded-lg border flex items-start gap-2 ";

                      if (isCorrectOption) {
                        optionClasses +=
                          "bg-green-500/20 border-green-500 text-green-300";
                      } else if (isSelectedOption && !isCorrect) {
                        optionClasses +=
                          "bg-red-500/20 border-red-500 text-red-300";
                      } else {
                        optionClasses +=
                          "bg-white/5 border-white/10 text-slate-300";
                      }

                      return (
                        <div key={letter} className={optionClasses}>
                          <span className="font-bold">{letter}.</span>
                          <span className="flex-1">{optionText}</span>
                          {isCorrectOption && (
                            <svg
                              className="w-5 h-5 text-green-400 flex-shrink-0"
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
                          {isSelectedOption && !isCorrect && (
                            <svg
                              className="w-5 h-5 text-red-400 flex-shrink-0"
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
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                    <h4 className="text-sm font-semibold text-white mb-1">
                      Explicación:
                    </h4>
                    <p className="text-sm text-slate-300">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
