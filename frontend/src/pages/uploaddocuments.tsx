/// <reference types="vite/client" />
// src/pages/UploadPage.tsx
import React, { useCallback, useMemo, useRef, useState } from "react";

/* =========================
   Tipos estrictos de API
========================= */
type ApiUploadItem = { documentId?: string; id?: string };

type ApiUploadResp =
  | ApiUploadItem[] // p.ej. [{ documentId: "abc" }]
  | {               // p.ej. { items:[{ id:"xyz" }]} o { documentId:"123" }
      documentId?: string;
      id?: string;
      items?: ApiUploadItem[];
    }
  | null;

/* =========================
   Config (sin any)
========================= */
const UPLOAD_URL =
  import.meta.env.VITE_UPLOAD_URL ?? "http://localhost:8000/files";
const SUMMARIZE_URL =
  import.meta.env.VITE_SUMMARIZE_URL ?? "http://localhost:8000/ai/summarize";
const QUIZ_URL =
  import.meta.env.VITE_QUIZ_URL ?? "http://localhost:8000/ai/quiz";
// Hash routing por defecto; cambia a "/results" si usas router normal
const RESULTS_URL =
  import.meta.env.VITE_RESULTS_URL ?? "/src/pages/results.tsx";

/* =========================
   Constantes y helpers
========================= */
const ACCEPTED_EXT = ["pdf", "doc", "docx", "txt"] as const;
type AcceptedExt = typeof ACCEPTED_EXT[number];
type KnownFileType = AcceptedExt | "desconocido";

const MAX_MB = 25;

function isAcceptedExt(x: string): x is AcceptedExt {
  return (ACCEPTED_EXT as readonly string[]).includes(x);
}

function getToken(): string | null {
  return localStorage.getItem("sf_token") || sessionStorage.getItem("sf_token");
}

function extFromName(name: string): string {
  const p = name.lastIndexOf(".");
  return p >= 0 ? name.slice(p + 1).toLowerCase() : "";
}

function detectType(file: File): KnownFileType {
  const ext = extFromName(file.name);
  if (isAcceptedExt(ext)) return ext;

  const t = (file.type || "").toLowerCase();
  if (t.includes("pdf")) return "pdf";
  if (t.includes("msword")) return "doc";
  if (t.includes("officedocument.wordprocessingml.document")) return "docx";
  if (t.includes("text/plain")) return "txt";
  return "desconocido";
}

function readableSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/* =========================
   Extraer documentId seguro
========================= */
function extractDocId(data: ApiUploadResp): string | undefined {
  // Caso 1: array
  if (Array.isArray(data)) {
    const first = data[0];
    if (first && typeof first === "object") {
      const doc = first.documentId ?? first.id;
      if (typeof doc === "string" && doc.length) return doc;
    }
    return undefined;
  }

  // Caso 2: objeto
  if (data && typeof data === "object") {
    if (Array.isArray(data.items)) {
      const first = data.items[0];
      if (first) {
        const doc = first.documentId ?? first.id;
        if (typeof doc === "string" && doc.length) return doc;
      }
    }
    if (typeof data.documentId === "string" && data.documentId.length)
      return data.documentId;
    if (typeof data.id === "string" && data.id.length) return data.id;
  }

  // Caso 3: null/otro
  return undefined;
}

/* =========================
   Componente
========================= */
export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string, ms = 2400) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), ms);
  }, []);

  const hasSelection = files.length > 0 || issues.length > 0;

  const onPick = useCallback((list: FileList | null) => {
    const next: File[] = [];
    const bad: string[] = [];
    if (list) {
      Array.from(list).forEach((f) => {
        const t = detectType(f);
        const mb = f.size / (1024 * 1024);

        if (t === "desconocido") {
          bad.push(`❌ ${f.name}: tipo no permitido`);
        } else if (mb > MAX_MB) {
          bad.push(`❌ ${f.name}: excede ${MAX_MB} MB (${mb.toFixed(2)} MB)`);
        } else {
          next.push(f);
        }
      });
    }
    setFiles(next);
    setIssues(bad);
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onPick(e.target.files),
    [onPick]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      onPick(e.dataTransfer?.files ?? null);
    },
    [onPick]
  );

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);
  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);
  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
    setIssues([]);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  async function uploadFiles(payload: File[]) {
    const form = new FormData();
    payload.forEach((f) => form.append("files", f, f.name));
    const token = getToken();
    const res = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    const ok = res.status === 200 || res.status === 201;
    let data: ApiUploadResp = null;
    try {
      data = (await res.json()) as ApiUploadResp;
    } catch {
      // backend podría no devolver JSON; lo ignoramos
    }
    return { ok, status: res.status, data };
  }

  async function summarize(documentId: string) {
    const token = getToken();
    const res = await fetch(`${SUMMARIZE_URL}?level=tldr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ documentId }),
    });
    return { ok: res.status === 200, status: res.status };
  }

  async function makeQuiz(documentId: string, n = 5) {
    const token = getToken();
    const res = await fetch(`${QUIZ_URL}?n=${n}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ documentId }),
    });
    return { ok: res.status === 200, status: res.status };
  }

  const handleProcess = useCallback(async () => {
    if (!files.length) return showToast("Selecciona al menos un archivo válido.");
    setLoading(true);
    try {
      const up = await uploadFiles(files);
      if (!up.ok) {
        if (up.status === 401) return showToast("Sesión expirada. Inicia sesión nuevamente.");
        if (up.status === 413) return showToast("Archivo demasiado grande.");
        return showToast("No se pudo subir. Intenta de nuevo.");
      }

      const docId = extractDocId(up.data);
      if (!docId) {
        showToast("Subida exitosa, pero no recibimos el ID del documento.");
        return;
      }

      showToast("Documento subido. Generando resumen…", 1800);
      const s = await summarize(docId);
      if (!s.ok) showToast("Resumen en cola. Se generará en segundo plano.");

      showToast("Creando quiz…", 1600);
      const q = await makeQuiz(docId, 5);
      if (!q.ok) showToast("Quiz en cola. Se generará en segundo plano.");

      // Redirigir a resultados
      const target = `${RESULTS_URL}?doc=${encodeURIComponent(docId)}`;
      setTimeout(() => {
        window.location.href = target;
        // Si usas React Router:
        // navigate(`/results?doc=${encodeURIComponent(docId)}`);
      }, 900);
    } catch (e) {
      console.error(e);
      showToast("Error de red o servidor no disponible.");
    } finally {
      setLoading(false);
    }
  }, [files, showToast]);

  const dropClasses = useMemo(
    () =>
      `mt-5 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
        dragOver
          ? "border-indigo-400 bg-indigo-50/50"
          : "border-slate-300 bg-slate-50"
      }`,
    [dragOver]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500" />
            <span className="font-semibold">StudyForge</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">
              Upgrade
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-200" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-2 text-xs font-medium text-slate-500">Navigation</div>
            <nav className="space-y-1 text-sm">
              <span className="block rounded-lg px-3 py-2 bg-slate-100 text-slate-900 font-medium">
                Cargar documentos
              </span>
              <a className="block rounded-lg px-3 py-2 hover:bg-slate-50">Proyectos</a>
              <a className="block rounded-lg px-3 py-2 hover:bg-slate-50">Historial</a>
              <a className="block rounded-lg px-3 py-2 hover:bg-slate-50">Ayuda</a>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <section className="col-span-12 lg:col-span-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h1 className="text-2xl font-bold">Subir documentos</h1>
            <p className="mt-1 text-slate-500">
              Admite PDF, Word (.doc, .docx) y TXT. Tamaño por archivo ≤ 25 MB.
            </p>

            {/* Dropzone */}
            <div
              className={dropClasses}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={onDragOver}
              onDrop={onDrop}
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-600" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M19 13v6H5v-6H3v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6h-2Zm-6-1 3.5 3.5-1.4 1.4L13 15.8V4h-2v11.8l-2.1 2.1-1.4-1.4L11 12Z"
                  />
                </svg>
              </div>
              <p className="mt-3 text-sm">
                Arrastra y suelta archivos aquí, o
                <label
                  htmlFor="fileUpload"
                  className="ml-1 font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  explora tu equipo
                </label>
              </p>
              <p className="mt-1 text-xs text-slate-500">PDF, DOC, DOCX, TXT</p>
              <input
                ref={inputRef}
                id="fileUpload"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                multiple
                className="hidden"
                onChange={onInputChange}
              />
            </div>

            {/* Lista */}
            {hasSelection && (
              <div className="mt-6">
                <h2 className="text-sm font-medium text-slate-700 mb-2">
                  Archivos seleccionados
                </h2>
                <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                  {files.map((f) => {
                    const t = detectType(f).toUpperCase();
                    return (
                      <li key={f.name} className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-slate-600 uppercase">
                              {t}
                            </span>
                          </div>
                          <div>
                            <div
                              className="text-sm font-medium truncate max-w-[18rem]"
                              title={f.name}
                            >
                              {f.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {readableSize(f.size)}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500">{detectType(f)}</span>
                      </li>
                    );
                  })}
                  {!!issues.length && (
                    <li className="p-3 text-sm text-rose-600 bg-rose-50">
                      <b>Archivos ignorados:</b>
                      <div className="mt-1">
                        {issues.map((i) => (
                          <div key={i}>• {i}</div>
                        ))}
                      </div>
                    </li>
                  )}
                </ul>

                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={handleProcess}
                    disabled={!files.length || loading}
                    className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-white text-sm font-medium disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                        Subiendo y procesando…
                      </span>
                    ) : (
                      "Subir y procesar"
                    )}
                  </button>
                  <button
                    onClick={clearAll}
                    disabled={loading}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    Limpiar
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Tras la subida, se generará automáticamente un <b>resumen</b> y un{" "}
                  <b>quiz</b>. Luego te redirigiremos a resultados.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Right column */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
            <h3 className="font-semibold">Recomendaciones</h3>
            <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
              <li>Usa archivos legibles (evita fotos borrosas de apuntes).</li>
              <li>Divide PDFs muy grandes por capítulos.</li>
              <li>Respeta derechos de autor de los materiales.</li>
            </ul>
          </div>
        </aside>
      </main>

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900/90 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
