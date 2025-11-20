// frontend/src/pages/summaries.tsx
/**
 * Página de gestión de resúmenes.
 * Permite crear resúmenes desde documentos existentes y visualizar todos los resúmenes.
 */
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  listSummaries,
  createSummaryFromDocuments,
  deleteSummary,
  listDocuments,
  getCurrentUser,
} from "../services/api";
import type {
  SummaryResponse,
  DocumentResponse,
  ExpertiseLevel,
} from "../types/api.types";

export default function SummariesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estado de resúmenes
  const [summaries, setSummaries] = useState<SummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Estado de creación de resumen
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [expertiseLevel, setExpertiseLevel] = useState<ExpertiseLevel>("medio");
  const [summaryTitle, setSummaryTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Máximo de documentos permitidos
  const [maxDocs, setMaxDocs] = useState(2);

  useEffect(() => {
    loadSummaries();
    loadUserConfig();
  }, []);

  async function loadUserConfig() {
    try {
      const userData = await getCurrentUser();
      setMaxDocs(userData.max_documents_per_summary || 2);
    } catch (error) {
      console.error("Error loading user config:", error);
    }
  }

  async function loadSummaries() {
    try {
      setIsLoading(true);
      const response = await listSummaries();
      setSummaries(response.items);
    } catch (error) {
      console.error("Error loading summaries:", error);
      showToast("No se pudieron cargar los resúmenes");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDocuments() {
    try {
      const response = await listDocuments();
      setDocuments(response.items);
    } catch (error) {
      console.error("Error loading documents:", error);
      showToast("No se pudieron cargar los documentos");
    }
  }

  function showToast(msg: string, ms = 3000) {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }

  function handleOpenCreateModal() {
    setShowCreateModal(true);
    setSelectedDocIds([]);
    setSummaryTitle("");
    setExpertiseLevel("medio");
    loadDocuments();
  }

  function toggleDocumentSelection(docId: string) {
    if (selectedDocIds.includes(docId)) {
      setSelectedDocIds(selectedDocIds.filter((id) => id !== docId));
    } else {
      if (selectedDocIds.length >= maxDocs) {
        showToast(`Solo puedes seleccionar hasta ${maxDocs} documentos`);
        return;
      }
      setSelectedDocIds([...selectedDocIds, docId]);
    }
  }

  async function handleCreateSummary() {
    if (selectedDocIds.length === 0) {
      showToast("Debes seleccionar al menos un documento");
      return;
    }

    try {
      setIsCreating(true);
      await createSummaryFromDocuments({
        document_ids: selectedDocIds,
        expertise_level: expertiseLevel,
        title: summaryTitle || undefined,
      });
      showToast("Resumen creado exitosamente");
      setShowCreateModal(false);
      loadSummaries();
    } catch (error: any) {
      console.error("Error creating summary:", error);
      showToast(
        error.response?.data?.detail || "Error al crear el resumen"
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteSummary(summaryId: string, title: string) {
    if (!confirm(`¿Eliminar el resumen "${title}"?`)) return;

    try {
      await deleteSummary(summaryId);
      showToast("Resumen eliminado");
      setSummaries(summaries.filter((s) => s.id !== summaryId));
    } catch (error) {
      console.error("Error deleting summary:", error);
      showToast("No se pudo eliminar el resumen");
    }
  }

  function handleViewSummary(summaryId: string) {
    navigate(`/summaries/${summaryId}`);
  }

  const getExpertiseLevelBadgeColor = (level: ExpertiseLevel) => {
    const colors = {
      basico: "bg-green-500/20 text-green-400 border-green-500/30",
      medio: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      avanzado: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colors[level] || colors.medio;
  };

  const getExpertiseLevelLabel = (level: ExpertiseLevel) => {
    const labels = {
      basico: "Básico",
      medio: "Medio",
      avanzado: "Avanzado",
    };
    return labels[level] || "Medio";
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden text-slate-50">
      {/* Aurora background */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `
          radial-gradient(1200px 600px at 20% -20%, rgba(139,92,246,0.10), transparent 55%),
          radial-gradient(900px 500px at 120% 10%, rgba(34,211,238,0.10), transparent 55%),
          #0b1220
        `,
        }}
      ></div>

      {/* Navbar */}
      <Navbar />

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Mis Resúmenes
            </h1>
            <p className="text-slate-400 mt-1">
              Resúmenes generados por IA adaptados a tu nivel
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Crear resumen
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
              <p className="mt-4 text-slate-300">Cargando resúmenes...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && summaries.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex h-20 w-20 rounded-full bg-slate-800/50 items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              No tienes resúmenes aún
            </h3>
            <p className="text-slate-400 mb-6">
              Crea tu primer resumen desde tus documentos
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold transition-all"
            >
              Crear resumen
            </button>
          </div>
        )}

        {/* Summaries Grid */}
        {!isLoading && summaries.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {summaries.map((summary) => (
              <div
                key={summary.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:border-violet-500/50 transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-400 transition-colors line-clamp-2">
                      {summary.title}
                    </h3>
                    <span
                      className={`inline-block px-2 py-1 rounded-lg text-xs font-medium border ${getExpertiseLevelBadgeColor(summary.expertise_level)}`}
                    >
                      {getExpertiseLevelLabel(summary.expertise_level)}
                    </span>
                  </div>
                </div>

                {/* Topics */}
                {summary.topics && summary.topics.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-400 mb-2">Temas:</p>
                    <div className="flex flex-wrap gap-1">
                      {summary.topics.slice(0, 3).map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-violet-500/10 text-violet-300 rounded-lg text-xs"
                        >
                          {topic}
                        </span>
                      ))}
                      {summary.topics.length > 3 && (
                        <span className="px-2 py-1 bg-slate-700/50 text-slate-400 rounded-lg text-xs">
                          +{summary.topics.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Key Concepts */}
                {summary.key_concepts && summary.key_concepts.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-400 mb-2">
                      Conceptos clave:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {summary.key_concepts.slice(0, 3).map((concept, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-pink-500/10 text-pink-300 rounded-lg text-xs"
                        >
                          {concept}
                        </span>
                      ))}
                      {summary.key_concepts.length > 3 && (
                        <span className="px-2 py-1 bg-slate-700/50 text-slate-400 rounded-lg text-xs">
                          +{summary.key_concepts.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                  <span className="text-xs text-slate-500">
                    {new Date(summary.created_at).toLocaleDateString("es-ES")}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewSummary(summary.id)}
                      className="px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 text-xs font-medium transition-colors"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteSummary(summary.id, summary.title)
                      }
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-medium transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Summary Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            ></div>

            {/* Modal */}
            <div className="relative bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700/50 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Crear resumen</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Título (opcional)
                    </label>
                    <input
                      type="text"
                      value={summaryTitle}
                      onChange={(e) => setSummaryTitle(e.target.value)}
                      placeholder="Ej: Resumen de Matemáticas"
                      className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  {/* Expertise Level */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nivel de experiencia
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["basico", "medio", "avanzado"] as ExpertiseLevel[]).map(
                        (level) => (
                          <button
                            key={level}
                            onClick={() => setExpertiseLevel(level)}
                            className={`px-4 py-3 rounded-xl font-medium transition-all ${
                              expertiseLevel === level
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                                : "bg-slate-900/50 text-slate-400 border border-slate-700/50 hover:border-violet-500/50"
                            }`}
                          >
                            {getExpertiseLevelLabel(level)}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Document Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Selecciona documentos ({selectedDocIds.length} / {maxDocs})
                    </label>
                    {documents.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        No tienes documentos. Sube algunos primero.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => toggleDocumentSelection(doc.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                              selectedDocIds.includes(doc.id)
                                ? "bg-violet-500/20 border-violet-500/50"
                                : "bg-slate-900/50 border-slate-700/50 hover:border-violet-500/30"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  selectedDocIds.includes(doc.id)
                                    ? "bg-violet-500 border-violet-500"
                                    : "border-slate-600"
                                }`}
                              >
                                {selectedDocIds.includes(doc.id) && (
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-medium">
                                  {doc.title}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {doc.file_type.toUpperCase()} •{" "}
                                  {(doc.file_size_bytes / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-700/50 flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateSummary}
                  disabled={isCreating || selectedDocIds.length === 0}
                  className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? "Generando..." : "Generar resumen"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-8 right-8 z-50 px-6 py-3 bg-slate-800/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl">
            <p className="text-white">{toast}</p>
          </div>
        )}
      </main>
    </div>
  );
}
