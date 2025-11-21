// frontend/src/pages/documents.tsx
/**
 * Página principal de gestión de documentos.
 * Conserva el diseño aurora del HTML original.
 */
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import {
  listDocuments,
  uploadDocument as apiUploadDocument,
  deleteDocument as apiDeleteDocument,
} from "../services/api";
import type { DocumentResponse } from "../types/api.types";

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Estado de upload
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setIsLoading(true);
      const response = await listDocuments();
      setDocuments(response.items);
    } catch (error) {
      console.error("Error loading documents:", error);
      showToast("No se pudieron cargar los documentos");
    } finally {
      setIsLoading(false);
    }
  }

  function showToast(msg: string, ms = 2200) {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }

  async function handleFileUpload(file: File) {
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ["pdf", "docx", "pptx", "txt"];
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (!fileExt || !allowedTypes.includes(fileExt)) {
      showToast("Solo se permiten archivos PDF, DOCX, PPTX y TXT");
      return;
    }

    try {
      setIsUploading(true);
      await apiUploadDocument(file);
      showToast("Documento subido con éxito ✅");
      await loadDocuments();
    } catch (error: any) {
      console.error("Error uploading document:", error);
      if (error?.response?.status === 413) {
        showToast("El archivo es demasiado grande");
      } else if (error?.response?.status === 507) {
        showToast("No tienes suficiente espacio de almacenamiento");
      } else {
        showToast("No se pudo subir el documento");
      }
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeleteDocument(id: string, title: string) {
    const confirmed = confirm(`¿Borrar "${title}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
      await apiDeleteDocument(id);
      showToast("Documento eliminado 🗑️");
      await loadDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      showToast("No se pudo eliminar el documento");
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
        aria-hidden="true"
      />

      {/* Navbar */}
      <Navbar />

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-10 space-y-10">
        {/* Upload Zone */}
        <section className="mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-6">
            Sube tu documento
          </h2>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("fileInput")?.click()}
            className={`
              relative rounded-3xl border-2 border-dashed p-8 text-center cursor-pointer
              transition-all duration-200
              ${isDragging
                ? "border-green-500 bg-green-500/10"
                : "border-white/15 bg-white/5 hover:border-white/25 hover:bg-white/10"
              }
              ${isUploading ? "opacity-50 pointer-events-none" : ""}
            `}
          >
            <input
              id="fileInput"
              type="file"
              accept=".pdf,.docx,.pptx,.txt"
              className="hidden"
              onChange={handleFileInputChange}
              disabled={isUploading}
            />
            <p className="text-white/80">
              {isUploading ? (
                <>Subiendo...</>
              ) : (
                <>
                  Arrastra un <strong>PDF, DOCX, PPTX o TXT</strong> o haz click para seleccionar
                </>
              )}
            </p>
            <p className="text-xs text-white/60 mt-1">
              Máximo {user?.max_file_size_bytes ? Math.round(user.max_file_size_bytes / 1024 / 1024) : 50} MB por archivo
            </p>
          </div>
        </section>

        {/* Documents List */}
        <section className="mx-auto max-w-3xl">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-0 mb-4">
            <h2 className="text-2xl font-bold tracking-tight text-white">Mis documentos</h2>
            <div className="text-sm text-white/60">
              Total: <span className="text-white font-medium">{documents.length}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-5 w-1/3 bg-white/10 rounded"></div>
                    <div className="h-4 w-2/3 bg-white/10 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-white/60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7.5l8.485-4.243a2 2 0 011.03-.257L21 3.75M3 7.5V18a2.25 2.25 0 002.25 2.25H18A2.25 2.25 0 0020.25 18V6M3 7.5l9 4.5 8.25-4.125"
                />
              </svg>
              <div>
                <div className="font-medium text-white">Aún no tienes documentos</div>
                <div className="text-white/60 text-xs">Sube uno arriba para comenzar</div>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 hover:bg-white/10 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white truncate">{doc.title}</h3>
                      <p className="text-sm text-white/60 mt-1">
                        {doc.file_type.toUpperCase()} • {Math.round(doc.file_size_bytes / 1024)} KB
                        {" • "}
                        {new Date(doc.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                      className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      Borrar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
