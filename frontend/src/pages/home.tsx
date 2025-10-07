import { useEffect, useState } from "react";
import { health, listDocuments, createDocument, type DocumentOut } from "../services/api";

export default function Home() {
  const [status, setStatus] = useState("checking...");
  const [docs, setDocs] = useState<DocumentOut[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    health().then(h => setStatus(h.status)).catch(() => setStatus("down"));
    listDocuments().then(d => setDocs(d.items)).catch(console.error);
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("title y content son obligatorios");
      return;
    }
    try {
      const created = await createDocument({ title, description: desc || null, content });
      setDocs(prev => [...prev, created]);
      setTitle(""); setDesc(""); setContent("");
    } catch (err: any) {
      alert(err?.message ?? "Error creando documento");
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">StudyForge — Home</h1>
      <p className="text-sm">backend health: <b>{status}</b></p>

      <form onSubmit={onCreate} className="space-y-3 border rounded p-4">
        <h2 className="font-semibold">Crear documento</h2>
        <input
          className="w-full border rounded p-2"
          placeholder="Título *"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <input
          className="w-full border rounded p-2"
          placeholder="Descripción (opcional)"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
        <textarea
          className="w-full border rounded p-2"
          placeholder="Contenido *"
          rows={4}
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <button className="px-3 py-2 bg-blue-600 text-white rounded">
          Crear
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="font-semibold">Documentos</h2>
        {docs.length === 0 ? (
          <p className="text-sm text-gray-500">No hay documentos aún</p>
        ) : (
          <ul className="list-disc pl-5">
            {docs.map(d => (
              <li key={d.id}>
                <b>{d.title}</b>
                {d.description ? ` — ${d.description}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
