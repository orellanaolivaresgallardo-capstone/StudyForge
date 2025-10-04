import { useEffect, useMemo, useRef, useState } from "react";

type QuizItem = { q: string; options: string[]; answer: string };
type ResultsData = {
  source?: string;
  tokens?: number | string;
  confidence?: string;
  summary?: string;
  bullets?: string[];
  glossary?: [string, string][];
  quiz?: QuizItem[];
};

type Props = {
  /** Endpoint que devuelve ResultsData (GET). Si no se pasa, usa datos demo. */
  fetchUrl?: string;
  /** Parámetros opcionales, p.ej. { id: "archivo-123" } */
  params?: Record<string, string | number | boolean | undefined>;
  /** Cargar automáticamente al montar (default: true) */
  autoLoad?: boolean;
};

const TABS = ["summary", "bullets", "glossary", "quiz"] as const;
type Tab = typeof TABS[number];

export default function ResultsPanel({ fetchUrl, params, autoLoad = true }: Props) {
  const [active, setActive] = useState<Tab>("summary");
  const [dense, setDense] = useState(false);
  const [view, setView] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [data, setData] = useState<ResultsData | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const meta = useMemo(() => {
    if (!data) return "—";
    const parts = [
      `Origen: ${data.source ?? "—"}`,
      `Tokens: ${data.tokens ?? "—"}`,
      `Confianza: ${data.confidence ?? "—"}`,
    ];
    return parts.join(" • ");
  }, [data]);

  async function fetchData() {
    setView("loading");
    try {
      let payload: ResultsData;
      if (fetchUrl) {
        const qs =
          params &&
          "?" +
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
              .join("&");
        const res = await fetch(fetchUrl + (qs ?? ""));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        payload = (await res.json()) as ResultsData;
      } else {
        // --- DEMO / MOCK ---
        await new Promise((r) => setTimeout(r, 600));
        payload = {
          source: "mi-archivo.pdf",
          tokens: 1420,
          confidence: "alta",
          summary:
            "El documento expone fundamentos del aprendizaje supervisado y su uso en clasificación.\n" +
            "Se comparan modelos lineales con árboles, señalando ventajas y trade-offs.\n" +
            "Se sugieren métricas (accuracy, F1) y validación K-fold.",
          bullets: [
            "Conceptos: features, etiquetas, overfitting, regularización.",
            "Modelos: Regresión logística vs. Árboles (profundidad y poda).",
            "Métricas: accuracy sesga en desbalance; F1 equilibra precisión/recall.",
            "Recomendación: validación cruzada y normalización.",
          ],
          glossary: [
            ["Overfitting", "Modelo que memoriza y rinde mal en datos nuevos."],
            ["Regularización", "Penalización que reduce complejidad del modelo."],
            ["F1-Score", "Media armónica entre precisión y recall."],
          ],
          quiz: [
            {
              q: "¿Qué métrica usarías en clases desbalanceadas?",
              options: ["Accuracy", "F1", "MSE", "AUC-ROC"],
              answer: "F1 o AUC-ROC",
            },
            {
              q: "¿Qué técnica reduce el overfitting?",
              options: ["Aumentar epochs", "Regularización", "Menos datos", "LR alto"],
              answer: "Regularización",
            },
          ],
        };
      }

      setData(payload);
      const hasAny =
        !!payload.summary ||
        (payload.bullets && payload.bullets.length > 0) ||
        (payload.glossary && payload.glossary.length > 0) ||
        (payload.quiz && payload.quiz.length > 0);
      setView(hasAny ? "ready" : "empty");
    } catch {
      setView("error");
    }
  }

  useEffect(() => {
    if (autoLoad) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function copyCurrent() {
    if (!data || !contentRef.current) return;
    let text = "";
    if (active === "summary") text = contentRef.current.querySelector("#summaryText")?.textContent ?? "";
    if (active === "bullets")
      text =
        [...(contentRef.current.querySelectorAll("#bulletsList li") ?? [])]
          .map((li) => "• " + (li as HTMLElement).innerText)
          .join("\n") || "";
    if (active === "glossary")
      text =
        [...(contentRef.current.querySelectorAll("#glossaryGrid .card") ?? [])]
          .map((c) => {
            const term = (c.querySelector(".term") as HTMLElement)?.innerText ?? "";
            const def = (c.querySelector(".def") as HTMLElement)?.innerText ?? "";
            return `${term}: ${def}`;
          })
          .join("\n") || "";
    if (active === "quiz")
      text =
        [...(contentRef.current.querySelectorAll("#quizList .q") ?? [])]
          .map((q, i) => `${i + 1}. ${(q as HTMLElement).innerText}`)
          .join("\n") || "";

    navigator.clipboard.writeText(text).catch(() => {});
  }

  function downloadTxt() {
    if (!contentRef.current) return;
    const blob = new Blob([contentRef.current.innerText.trim()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "studyforge-resultados.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <div className="rounded-2xl p-6 md:p-8"
           style={{ background: "linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.04))", boxShadow: "0 10px 30px rgba(0,0,0,.40), inset 0 1px 0 rgba(255,255,255,.06)" }}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold">Resultados del análisis</h2>
            <p className="text-slate-300">Resúmenes generados por IA a partir de tus documentos.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="rounded-xl px-4 py-2 text-sm bg-white/10 hover:bg-white/15 border border-white/10">
              Actualizar
            </button>
            <button onClick={downloadTxt} className="rounded-xl px-4 py-2 text-sm"
              style={{ background: "linear-gradient(90deg,#7c3aed,#a855f7)" }}>
              Descargar .txt
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`rounded-full px-3 py-1.5 border border-white/10 ${
                active === t ? "bg-white/15" : "bg-white/5 hover:bg-white/10"
              }`}
            >
              {t === "summary" && "Resumen"}
              {t === "bullets" && "Puntos clave"}
              {t === "glossary" && "Glosario"}
              {t === "quiz" && "Preguntas"}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-300">{meta}</div>
          <div className="flex items-center gap-2">
            <button onClick={copyCurrent} className="rounded-lg px-3 py-1.5 text-xs bg-white/10 hover:bg-white/15 border border-white/10">
              Copiar
            </button>
            <label className="text-xs text-slate-300 flex items-center gap-2 select-none">
              <input type="checkbox" checked={dense} onChange={(e) => setDense(e.target.checked)} className="rounded border-slate-400/50 bg-white/10" />
              Densidad compacta
            </label>
          </div>
        </div>

        {/* States */}
        {view === "loading" && (
          <div className="mt-6 animate-pulse space-y-3">
            <div className="h-4 bg-white/10 rounded" />
            <div className="h-4 bg-white/10 rounded w-11/12" />
            <div className="h-4 bg-white/10 rounded w-10/12" />
            <div className="h-4 bg-white/10 rounded w-8/12" />
          </div>
        )}
        {view === "empty" && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6 text-slate-300">
            No hay resultados aún. Sube un documento y presiona <span className="font-semibold">Actualizar</span>.
          </div>
        )}
        {view === "error" && (
          <div className="mt-6 rounded-xl border border-rose-300/20 bg-rose-500/10 p-6 text-rose-100">
            Ocurrió un error al obtener los resultados.{" "}
            <button onClick={fetchData} className="underline">Reintentar</button>
          </div>
        )}

        {/* Content */}
        {view === "ready" && (
          <div ref={contentRef} className={`mt-6 ${dense ? "text-sm leading-snug" : ""}`}>
            {/* Resumen */}
            {active === "summary" && (
              <article>
                <div id="summaryText" className="prose prose-invert max-w-none prose-p:my-3">
                  {(data?.summary ?? "")
                    .split("\n")
                    .map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                </div>
              </article>
            )}

            {/* Bullets */}
            {active === "bullets" && (
              <article>
                <ul id="bulletsList" className="list-disc pl-6 space-y-2 text-slate-200">
                  {(data?.bullets ?? []).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </article>
            )}

            {/* Glosario */}
            {active === "glossary" && (
              <article>
                <div id="glossaryGrid" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(data?.glossary ?? []).map(([term, def]) => (
                    <div key={term} className="card rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="term font-semibold">{term}</div>
                      <div className="def text-sm text-slate-300 mt-1">{def}</div>
                    </div>
                  ))}
                </div>
              </article>
            )}

            {/* Preguntas */}
            {active === "quiz" && (
              <article>
                <ol id="quizList" className="space-y-4 list-decimal pl-6">
                  {(data?.quiz ?? []).map((q, i) => (
                    <li key={i}>
                      <div className="q font-medium">{q.q}</div>
                      <ul className="mt-2 list-disc pl-6 text-slate-300 text-sm">
                        {q.options.map((o) => (
                          <li key={o}>{o}</li>
                        ))}
                      </ul>
                      <details className="mt-2 text-xs text-slate-400">
                        <summary>Mostrar respuesta</summary>
                        <div className="mt-1">✅ {q.answer}</div>
                      </details>
                    </li>
                  ))}
                </ol>
              </article>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
