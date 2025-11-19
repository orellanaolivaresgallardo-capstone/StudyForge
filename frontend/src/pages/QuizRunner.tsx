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

export default function QuizRunner({ quizId }: { quizId: number }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [check, setCheck] = useState<CheckResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // 1) Cargar quiz desde backend
  useEffect(() => {
    const fetchQuiz = async () => {
      const token =
        localStorage.getItem("sf_token") ?? sessionStorage.getItem("sf_token");

      const res = await fetch(`${API_BASE}/quizzes/${quizId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      const normalized: Quiz = {
        id: data.id,
        title: data.title,
        questions: data.questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          options: q.options || JSON.parse(q.options_json),
        })),
      };

      setQuiz(normalized);
      setAnswers(new Array(normalized.questions.length).fill(-1));
    };

    fetchQuiz();
  }, [quizId]);

  // 2) Seleccionar respuesta
  const handleSelect = (qi: number, oi: number) => {
    const copy = [...answers];
    copy[qi] = oi;
    setAnswers(copy);
  };

  // 3) Enviar al backend para corregir
  const handleCheck = async () => {
    if (!quiz) return;

    setLoading(true);

    const token =
      localStorage.getItem("sf_token") ?? sessionStorage.getItem("sf_token");

    const res = await fetch(`${API_BASE}/quizzes/${quiz.id}/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ answers }),
    });

    const data = (await res.json()) as CheckResponse;
    setCheck(data);
    setLoading(false);
  };

  if (!quiz) return <div className="text-slate-200">Cargando quiz...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Quiz: {quiz.title}</h2>

      <ol className="space-y-4">
        {quiz.questions.map((q, qi) => {
          const result = check?.results.find((r) => r.question_id === q.id);

          return (
            <li key={q.id} className="border border-slate-700 p-4 rounded-xl">
              <p className="font-medium mb-2">
                {qi + 1}. {q.question}
              </p>

              {q.options.map((opt, oi) => {
                const selected = answers[qi] === oi;

                const wrong =
                  result &&
                  !result.is_correct &&
                  result.given === oi &&
                  result.given !== result.correct_index;

                const correct =
                  result && result.correct_index === oi && result.is_correct;

                return (
                  <button
                    key={oi}
                    onClick={() => handleSelect(qi, oi)}
                    className={[
                      "block w-full text-left px-3 py-2 my-1 rounded-lg border transition",
                      selected
                        ? "border-sky-400 bg-sky-900/30"
                        : "border-slate-700 bg-slate-900/40",
                      wrong && "border-red-500",
                      correct && "border-green-400",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {String.fromCharCode(65 + oi)}. {opt}
                  </button>
                );
              })}

              {/* Explicación cuando falla */}
              {result && !result.is_correct && result.explanation && (
                <div className="mt-3 p-3 text-sm bg-red-900/20 border border-red-700 rounded">
                  <strong>Solución:</strong> {result.explanation}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <button
        onClick={handleCheck}
        disabled={loading}
        className="px-4 py-2 bg-sky-500 hover:bg-sky-400 rounded-lg text-slate-900 font-medium disabled:opacity-50"
      >
        {loading ? "Corrigiendo..." : "Corregir quiz"}
      </button>

      {check && (
        <div className="p-3 mt-4 border border-slate-600 rounded bg-slate-800">
          Resultado final: {check.score} / {check.total}
        </div>
      )}
    </div>
  );
}
