// src/pages/quiz.tsx
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

type Question = {
  id: number;
  question: string;
  options: string[];
};

type Quiz = {
  id: number;
  title: string;
  questions: Question[];
};

type QuestionResult = {
  question_id: number;
  given: number | null;
  correct_index: number;
  is_correct: boolean;
  explanation?: string | null;
};

type CheckResponse = {
  score: number;
  total: number;
  results: QuestionResult[];
};

type Props = {
  quizId: number;
};

export default function QuizRunner({ quizId }: Props) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [check, setCheck] = useState<CheckResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // 1) Cargar quiz
  useEffect(() => {
    const fn = async () => {
      const res = await fetch(`${API_BASE}/quizzes/${quizId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sf_token") ?? ""}`,
        },
      });
      if (!res.ok) throw new Error("No se pudo cargar el quiz");
      const data = await res.json();
      // Ajusta estas claves al formato real del backend
      const normalized: Quiz = {
        id: data.id,
        title: data.title,
        questions: data.questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          options: q.options, // asumiendo que el backend ya las manda como array
        })),
      };
      setQuiz(normalized);
      setAnswers(new Array(normalized.questions.length).fill(-1));
    };
    fn().catch(console.error);
  }, [quizId]);

  // 2) Seleccionar respuesta
  const handleSelect = (qi: number, optionIndex: number) => {
    const copy = [...answers];
    copy[qi] = optionIndex;
    setAnswers(copy);
  };

  // 3) Enviar a /check
  const handleCheck = async () => {
    if (!quiz) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/quizzes/${quiz.id}/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sf_token") ?? ""}`,
        },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error("Error al corregir el quiz");
      const data = (await res.json()) as CheckResponse;
      setCheck(data);
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al corregir el quiz");
    } finally {
      setLoading(false);
    }
  };

  if (!quiz) return <div className="p-6 text-slate-100">Cargando quiz...</div>;

  return (
    <section className="max-w-3xl mx-auto p-6 text-slate-100">
      <header className="mb-4">
        <h1 className="text-2xl font-bold mb-1">{quiz.title}</h1>
        {check && (
          <p className="text-sm text-slate-400">
            Resultado: {check.score} / {check.total}
          </p>
        )}
      </header>

      <ol className="space-y-6">
        {quiz.questions.map((q, qi) => {
          const result =
            check?.results.find((r) => r.question_id === q.id) ?? null;

          return (
            <li key={q.id} className="border border-slate-700 rounded-xl p-4">
              <div className="font-medium mb-2">
                {qi + 1}. {q.question}
              </div>

              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const isSelected = answers[qi] === oi;
                  const isCorrect =
                    result && oi === result.correct_index && result.is_correct;
                  const isUserWrongChoice =
                    result &&
                    !result.is_correct &&
                    result.given === oi &&
                    result.given !== result.correct_index;

                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => handleSelect(qi, oi)}
                      className={[
                        "w-full text-left px-3 py-2 rounded-lg text-sm border",
                        "transition",
                        isSelected
                          ? "border-sky-400 bg-sky-900/30"
                          : "border-slate-700 bg-slate-900/40",
                        isCorrect && "border-emerald-400",
                        isUserWrongChoice && "border-rose-500",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {String.fromCharCode(65 + oi)}. {opt}
                    </button>
                  );
                })}
              </div>

              {/* Explicación SOLO si la respuesta es incorrecta */}
              {result && !result.is_correct && result.explanation && (
                <div className="mt-3 text-xs text-rose-300 bg-rose-900/20 border border-rose-700/60 rounded-lg p-3">
                  <div className="font-semibold mb-1">Solución:</div>
                  <p>{result.explanation}</p>
                </div>
              )}

              {/* Si quieres, puedes también mostrar una notita cuando acierta */}
              {result && result.is_correct && result.explanation && (
                <div className="mt-3 text-xs text-emerald-300 bg-emerald-900/20 border border-emerald-700/60 rounded-lg p-3">
                  <div className="font-semibold mb-1">¡Correcto! 🎉</div>
                  <p>{result.explanation}</p>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleCheck}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Corrigiendo..." : "Corregir quiz"}
        </button>
      </div>
    </section>
  );
}
