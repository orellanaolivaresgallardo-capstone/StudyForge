/// <reference types="vite/client" />
// src/pages/UploadPage.tsx
import React, { useCallback, useMemo, useRef, useState } from "react";

/* =========================
   Tipos estrictos de API
========================= */
type ApiUploadItem = { documentId?: string; id?: string };

type ApiUploadResp =
  | ApiUploadItem[]
  | {
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
  import.meta.env.VITE_SUMMARIZE_URL ??
  "http://localhost:8000/ai/summarize";

const QUIZ_URL =
  import.meta.env.VITE_QUIZ_URL ??
  "http://localhost:8000/ai/quiz";

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
  if (t.includes("officedocument.wordprocessingml.document"))
    return "docx";
  if (t.includes("text/plain")) return "txt";
  return "desconocido";
}

function readableSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function extractDocId(data: ApiUploadResp): string | undefined {
  if (Array.isArray(data)) {
    const first = data[0];
    if (first) {
      const doc = first.documentId ?? first.id;
      if (typeof doc === "string") return doc;
    }
    return undefined;
  }

  if (data && typeof data === "object") {
    if (Array.isArray(data.items)) {
      const first = data.items[0];
      if (first) {
        const doc = first.documentId ?? first.id;
        if (typeof doc === "string") return doc;
      }
    }
    if (typeof data.documentId === "string") return data.documentId;
    if (typeof data.id === "string") return data.id;
  }

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
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onPick(e.target.files),
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
    } catch {}

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

    const ok = res.status === 200;
    let data: any = null;

    try {
      data = await res.json();
    } catch {}

    // 🟢 FIX — Extraer quizId desde la respuesta
    const quizId =
      data?.quizId ??
      data?.id ??
      data?.quiz?.id ??
      null;

    return { ok, status: res.status, quizId };
  }

  const handleProcess = useCallback(async () => {
    if (!files.length) return showToast("Selecciona al menos un archivo válido.");

    setLoading(true);

    try {
      const up = await uploadFiles(files);
      if (!up.ok) {
        if (up.status === 401)
          return showToast("Sesión expirada. Inicia sesión nuevamente.");
        if (up.status === 413)
          return showToast("Archivo demasiado grande.");
        return showToast("No se pudo subir. Intenta de nuevo.");
      }

      const documentId = extractDocId(up.data);
      if (!documentId) {
        showToast("Subida exitosa pero sin ID de documento.");
        return;
      }

      showToast("Documento subido. Generando resumen…", 1800);
      await summarize(documentId);

      showToast("Creando quiz…", 1600);
      const quizResp = await makeQuiz(documentId, 5);

      const quizId = quizResp.quizId; // 🟢 FIX

      // Redirección correcta con quizId
      const target = quizId
        ? `${RESULTS_URL}?doc=${encodeURIComponent(documentId)}&quiz=${encodeURIComponent(quizId)}`
        : `${RESULTS_URL}?doc=${encodeURIComponent(documentId)}`;

      setTimeout(() => {
        window.location.href = target;
      }, 900);
    } catch (e) {
      console.error(e);
      showToast("Error de red o servidor no disponible.");
    } finally {
      setLoading(false);
    }
  }, [files, showToast]);

  /* =========================
     UI — (idéntico al tuyo)
  ========================= */

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
      {/* (resto igual... UI intacta) */}

      {/* ---------- CONTENIDO ORIGINAL OMITIDO PARA BREVIDAD ---------- */}

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900/90 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
