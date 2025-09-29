import { useCallback, useRef, useState } from "react";

const ACCEPT = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
};

function bytesToSize(n: number) {
  const units = ["B", "KB", "MB", "GB"]; let i = 0; let v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function UploadDocuments() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const allowedExt = new Set([".pdf", ".doc", ".docx", ".txt"]);
    const next: File[] = [];
    for (const f of Array.from(list)) {
      const ext = ("." + f.name.split(".").pop()!.toLowerCase());
      if (allowedExt.has(ext)) next.push(f);
    }
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name + f.size));
      const merged = [...prev];
      for (const f of next) if (!names.has(f.name + f.size)) merged.push(f);
      return merged;
    });
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    onFiles(e.dataTransfer.files);
  };

  const removeAt = (idx: number) => setFiles((f) => f.filter((_, i) => i !== idx));

  const totalSize = files.reduce((a, b) => a + b.size, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      // TODO: replace URL with your backend endpoint, e.g. "/api/upload"
      // const res = await fetch("/api/upload", { method: "POST", body: form });
      // if (!res.ok) throw new Error("Error al subir archivos");
      await new Promise((r) => setTimeout(r, 900)); // demo
      alert(`Subida completa (archivos: ${files.length})`);
      setFiles([]);
    } catch {
      alert("No se pudo completar la subida");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500" />
            <span className="font-semibold">StudyForge</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">Upgrade</button>
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
              <a className="block rounded-lg px-3 py-2 bg-slate-100 text-slate-900 font-medium">Cargar documentos</a>
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
            <p className="mt-1 text-slate-500">Admite PDF, Word (.doc, .docx) y TXT. Tamaño total recomendado ≤ 25 MB.</p>

            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={
                `mt-5 rounded-xl border-2 border-dashed ${dragOver ? "border-indigo-400 bg-indigo-50" : "border-slate-300 bg-slate-50"} ` +
                "px-6 py-10 text-center"
              }
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-600" aria-hidden>
                  <path fill="currentColor" d="M19 13v6H5v-6H3v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6h-2Zm-6-1 3.5 3.5-1.4 1.4L13 15.8V4h-2v11.8l-2.1 2.1-1.4-1.4L11 12Z" />
                </svg>
              </div>
              <p className="mt-3 text-sm">
                Arrastra y suelta archivos aquí, o
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="ml-1 font-semibold text-indigo-600 hover:underline"
                >
                  explora tu equipo
                </button>
              </p>
              <p className="mt-1 text-xs text-slate-500">PDF, DOC, DOCX, TXT</p>
              <input
                ref={inputRef}
                type="file"
                accept={Object.values(ACCEPT).flat().join(",")}
                multiple
                onChange={(e) => onFiles(e.currentTarget.files)}
                className="hidden"
              />
            </div>

            {/* Selected files list */}
            {files.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">{files.length} archivo(s) • {bytesToSize(totalSize)}</div>
                  <button onClick={() => setFiles([])} className="text-sm text-slate-500 hover:text-slate-700">Limpiar</button>
                </div>
                <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                  {files.map((f, i) => (
                    <li key={f.name + i} className="flex items-center gap-3 p-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-600 uppercase">{f.name.split(".").pop()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium">{f.name}</div>
                        <div className="text-xs text-slate-500">{bytesToSize(f.size)}</div>
                      </div>
                      <button onClick={() => removeAt(i)} className="rounded-md border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50">Quitar</button>
                    </li>
                  ))}
                </ul>

                <form onSubmit={handleSubmit} className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={!files.length || uploading}
                    className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-white text-sm font-medium disabled:opacity-50"
                  >
                    {uploading ? "Subiendo…" : "Subir archivos"}
                  </button>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    Agregar más
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* Right column / tips */}
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
    </div>
  );
}
