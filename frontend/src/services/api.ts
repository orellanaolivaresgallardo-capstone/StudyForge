const API = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

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

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sf_token") ?? sessionStorage.getItem("sf_token");
}

async function buildError(response: Response): Promise<ApiError> {
  let parsed: unknown = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      parsed = await response.json();
    } catch {
      parsed = null;
    }
  } else {
    try {
      parsed = await response.text();
    } catch {
      parsed = null;
    }
  }

  const detail =
    typeof parsed === "string" && parsed.trim().length > 0
      ? parsed.trim()
      : (parsed as any)?.detail ?? response.statusText;
  const message = detail && typeof detail === "string"
    ? detail
    : `Request failed with status ${response.status}`;

  return new ApiError(response.status, message, parsed);
}

function authHeaders(base: HeadersInit = {}): HeadersInit {
  const token = getStoredToken();
  if (!token) return base;
  return { ...base, Authorization: `Bearer ${token}` };
}

export async function health(): Promise<{ status: string }> {
  const r = await fetch(`${API}/health`);
  if (!r.ok) throw await buildError(r);
  return r.json();
}

export async function listDocuments(): Promise<DocumentListOut> {
  const r = await fetch(`${API}/documents`, {
    headers: authHeaders(),
  });
  if (!r.ok) throw await buildError(r);
  return r.json();
}

export async function createDocument(payload: DocumentIn): Promise<DocumentOut> {
  const r = await fetch(`${API}/documents`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw await buildError(r);
  return r.json();
}

export function hasToken(): boolean {
  return getStoredToken() != null;
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("sf_token");
  sessionStorage.removeItem("sf_token");
}

export function readToken(): string | null {
  return getStoredToken();
}
