// frontend/src/pages/summaries/SummariesPage.tsx
/**
 * Página de gestión de resúmenes.
 * Permite crear resúmenes desde documentos existentes y visualizar todos los resúmenes.
 */
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Navbar, Toast, Modal, LoadingSpinner, EmptyState } from "@/components";
import type { ToastType } from "@/components";
import {
  listSummaries,
  createSummaryFromDocuments,
  deleteSummary,
  listDocuments,
  getCurrentUser,
} from "@/services/api";
import type {
  SummaryResponse,
  DocumentResponse,
  ExpertiseLevel,
} from "@/types/api.types";

export default function SummariesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estado de resúmenes
  const [summaries, setSummaries] = useState<SummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Estado de creación de resumen
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [expertiseLevel, setExpertiseLevel] = useState<ExpertiseLevel>("medio");
  const [summaryTitle, setSummaryTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Estado de modal de confirmación de eliminación
  const [deleteModal, setDeleteModal] = useState<{ id: string; title: string } | null>(null);

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
      setToast({ message: "No se pudieron cargar los resúmenes", type: "error" });
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
      setToast({ message: "No se pudieron cargar los documentos", type: "error" });
    }
  }

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ message: msg, type });
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
        showToast(`Solo puedes seleccionar hasta ${maxDocs} documentos`, "warning");
        return;
      }
      setSelectedDocIds([...selectedDocIds, docId]);
    }
  }

  async function handleCreateSummary() {
    if (selectedDocIds.length === 0) {
      showToast("Debes seleccionar al menos un documento", "warning");
      return;
    }

    try {
      setIsCreating(true);
      await createSummaryFromDocuments({
        document_ids: selectedDocIds,
        expertise_level: expertiseLevel,
        title: summaryTitle || undefined,
      });
      showToast("Resumen creado exitosamente", "success");
      setShowCreateModal(false);
      loadSummaries();
    } catch (error: unknown) {
      console.error("Error creating summary:", error);
      const errorMessage =
        error instanceof Error && 'response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response && typeof error.response.data === 'object' && error.response.data !== null && 'detail' in error.response.data
          ? String(error.response.data.detail)
          : "Error al crear el resumen";
      showToast(errorMessage, "error");
    } finally {
      setIsCreating(false);
    }
  }

  async function confirmDeleteSummary() {
    if (!deleteModal) return;

    try {
      await deleteSummary(deleteModal.id);
      showToast("Resumen eliminado", "success");
      setSummaries(summaries.filter((s) => s.id !== deleteModal.id));
      setDeleteModal(null);
    } catch (error) {
      console.error("Error deleting summary:", error);
      showToast("No se pudo eliminar el resumen", "error");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
        aria-hidden="true"
      />

      {/* Navbar */}
      <Navbar />

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Mis Resúmenes
            </h1>
            <p className="text-white/60 mt-1">
              Resúmenes generados por IA adaptados a tu nivel
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 font-semibold transition-colors flex items-center gap-2"
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
        {isLoading && <LoadingSpinner message="Cargando resúmenes..." />}

        {/* Empty State */}
        {!isLoading && summaries.length === 0 && (
          <EmptyState
            icon={
              <svg
                className="w-10 h-10 text-white/60"
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
            }
            title="No tienes resúmenes aún"
            description="Crea tu primer resumen desde tus documentos"
            action={{
              label: "Crear resumen",
              onClick: handleOpenCreateModal
            }}
          />
        )}

        {/* Summaries Grid */}
        {!isLoading && summaries.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {summaries.map((summary) => (
              <div
                key={summary.id}
                className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 hover:border-violet-400/30 transition-all group"
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
                    <p className="text-xs text-white/60 mb-2">Temas:</p>
                    <div className="flex flex-wrap gap-1">
                      {summary.topics.slice(0, 3).map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-violet-500/20 text-violet-300 rounded-lg text-xs"
                        >
                          {topic}
                        </span>
                      ))}
                      {summary.topics.length > 3 && (
                        <span className="px-2 py-1 bg-white/10 text-white/60 rounded-lg text-xs">
                          +{summary.topics.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Key Concepts */}
                {summary.key_concepts && summary.key_concepts.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-white/60 mb-2">
                      Conceptos clave:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {summary.key_concepts.slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-pink-500/20 text-pink-300 rounded-lg text-xs"
                        >
                          {item.concept}
                        </span>
                      ))}
                      {summary.key_concepts.length > 3 && (
                        <span className="px-2 py-1 bg-white/10 text-white/60 rounded-lg text-xs">
                          +{summary.key_concepts.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Study Spaces */}
                {summary.study_space_names && summary.study_space_names.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-white/60 mb-2">
                      Espacios de estudio:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {summary.study_space_names.map((spaceName, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-1 rounded-lg text-xs font-medium bg-pink-500/20 text-pink-300 border border-pink-500/30"
                        >
                          <svg
                            className="w-3 h-3 inline mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                            />
                          </svg>
                          {spaceName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-xs text-white/60">
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
                        setDeleteModal({ id: summary.id, title: summary.title })
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

        {/* Delete Confirmation Modal */}
        {deleteModal && (
          <Modal
            isOpen={!!deleteModal}
            onClose={() => setDeleteModal(null)}
            title="Confirmar eliminación"
            size="sm"
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-white/80">
                  ¿Estás seguro de que quieres eliminar el resumen <strong>"{deleteModal.title}"</strong>?
                </p>
                <p className="text-sm text-white/60">
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteSummary}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Create Summary Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Crear resumen"
          size="lg"
        >
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-white/80 font-semibold mb-2">
                Título (opcional)
              </label>
              <input
                type="text"
                value={summaryTitle}
                onChange={(e) => setSummaryTitle(e.target.value)}
                placeholder="Ej: Resumen de Matemáticas"
                className="w-full bg-slate-900/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {/* Expertise Level */}
            <div>
              <label className="block text-white/80 font-semibold mb-2">
                Nivel de experiencia
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["basico", "medio", "avanzado"] as ExpertiseLevel[]).map(
                  (level) => (
                    <button
                      key={level}
                      onClick={() => setExpertiseLevel(level)}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        expertiseLevel === level
                          ? "bg-violet-600 text-white"
                          : "bg-white/5 text-white/60 border border-white/10 hover:border-violet-400/50"
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
              <label className="block text-white/80 font-semibold mb-2">
                Selecciona documentos ({selectedDocIds.length} / {maxDocs})
              </label>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-white/60">
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
                          : "bg-white/5 border-white/10 hover:border-violet-400/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedDocIds.includes(doc.id)
                              ? "bg-violet-500 border-violet-500"
                              : "border-white/30"
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
                          <p className="text-xs text-white/60">
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

            {/* Footer Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSummary}
                disabled={isCreating || selectedDocIds.length === 0}
                className="flex-1 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "Generando..." : "Generar resumen"}
              </button>
            </div>
          </div>
        </Modal>

      </main>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
