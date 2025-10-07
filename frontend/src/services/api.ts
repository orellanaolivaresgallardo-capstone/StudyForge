const API = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export interface DocumentIn {
  title: string;
  description?: string | null;
  content: string;
}
export interface DocumentOut {
  id: number;
  title: string;
  description?: string | null;
}
export interface DocumentListOut {
  items: DocumentOut[];
}

export async function health(): Promise<{ status: string }> {
  const r = await fetch(`${API}/health`);
  if (!r.ok) throw new Error(`Health failed: ${r.status}`);
  return r.json();
}

export async function listDocuments(): Promise<DocumentListOut> {
  const r = await fetch(`${API}/documents`);
  if (!r.ok) throw new Error(`List failed: ${r.status}`);
  return r.json();
}

export async function createDocument(payload: DocumentIn): Promise<DocumentOut> {
  const r = await fetch(`${API}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    let info = "";
    try { info = JSON.stringify(await r.json()); } catch {}
    throw new Error(`Create failed: ${r.status} ${info}`);
  }
  return r.json();
}
