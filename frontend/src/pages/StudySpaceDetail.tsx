// frontend/src/pages/StudySpaceDetail.tsx
/**
 * Página de detalle de espacio de estudio.
 * Muestra documentos, resúmenes, quizzes y estadísticas del espacio.
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Toast, { ToastType } from "../components/Toast";
import Modal from "../components/Modal";
import QuizCard from "../components/QuizCard";
import {
  getStudySpace,
  getStudySpaceStats,
  getStudySpaceQuizzes,
  updateStudySpace,
  addSummaryToSpace,
  removeSummaryFromSpace,
  addDocumentToSpace,
  removeDocumentFromSpace,
  listSummaries,
  listDocuments,
  createQuizFromSpace,
} from "../services/api";
import type {
  StudySpaceDetailResponse,
  StudySpaceStatsResponse,
  StudySpaceUpdate,
  SummaryResponse,
  DocumentResponse,
  QuizResponse,
} from "../types/api.types";

export default function StudySpaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [space, setSpace] = useState<StudySpaceDetailResponse | null>(null);
  const [stats, setStats] = useState<StudySpaceStatsResponse | null>(null);
  const [quizzes, setQuizzes] = useState<QuizResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Modal para editar espacio
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", color: "" });
  const [isUpdating, setIsUpdating] = useState(false);

  // Modal para agregar recursos
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<"summary" | "document">("summary");
  const [availableResources, setAvailableResources] = useState<(SummaryResponse | DocumentResponse)[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);

  // Estado para crear quiz
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);

  useEffect(() => {
    if (id) {
      loadSpace(id);
      loadStats(id);
      loadQuizzes(id);
    }
  }, [id]);

  async function loadSpace(spaceId: string) {
    try {
      setIsLoading(true);
      const data = await getStudySpace(spaceId);
      setSpace(data);
      setEditForm({
        name: data.name,
        description: data.description || "",
        color: data.color,
      });
    } catch (error) {
      console.error("Error loading study space:", error);
      showToast("No se pudo cargar el espacio de estudio", "error");
      setTimeout(() => navigate("/study-spaces"), 2000);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadStats(spaceId: string) {
    try {
      const data = await getStudySpaceStats(spaceId);
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  async function loadQuizzes(spaceId: string) {
    try {
      const response = await getStudySpaceQuizzes(spaceId);
      setQuizzes(response.items);
    } catch (error) {
      console.error("Error loading quizzes:", error);
    }
  }

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ message: msg, type });
  }

  function handleOpenEditModal() {
    if (space) {
      setEditForm({
        name: space.name,
        description: space.description || "",
        color: space.color,
      });
      setShowEditModal(true);
    }
  }

  async function handleUpdateSpace() {
    if (!id) return;

    try {
      setIsUpdating(true);
      const updateData: StudySpaceUpdate = {
        name: editForm.name.trim() || undefined,
        description: editForm.description.trim() || undefined,
        color: editForm.color || undefined,
      };
      await updateStudySpace(id, updateData);
      showToast("Espacio actualizado exitosamente", "success");
      setShowEditModal(false);
      loadSpace(id);
    } catch (error: any) {
      console.error("Error updating space:", error);
      showToast(error.response?.data?.detail || "Error al actualizar el espacio", "error");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleOpenAddModal(type: "summary" | "document") {
    setAddModalType(type);
    setShowAddModal(true);
    setIsLoadingResources(true);

    try {
      if (type === "summary") {
        const response = await listSummaries();
        const filtered = response.items.filter(
          (item) => !space?.summaries.find((s) => s.id === item.id)
        );
        setAvailableResources(filtered);
      } else {
        const response = await listDocuments();
        const filtered = response.items.filter(
          (item) => !space?.documents.find((d) => d.id === item.id)
        );
        setAvailableResources(filtered);
      }
    } catch (error) {
      console.error("Error loading resources:", error);
      showToast("No se pudieron cargar los recursos", "error");
    } finally {
      setIsLoadingResources(false);
    }
  }

  async function handleAddResource(resourceId: string) {
    if (!id) return;

    try {
      if (addModalType === "summary") {
        await addSummaryToSpace(id, { resource_id: resourceId });
        showToast("Resumen agregado al espacio", "success");
      } else {
        await addDocumentToSpace(id, { resource_id: resourceId });
        showToast("Documento agregado al espacio", "success");
      }
      setShowAddModal(false);
      loadSpace(id);
      loadStats(id);
    } catch (error: any) {
      console.error("Error adding resource:", error);
      showToast(error.response?.data?.detail || "Error al agregar el recurso", "error");
    }
  }

  async function handleRemoveResource(
    resourceId: string,
    type: "summary" | "document",
    name: string
  ) {
    if (!id) return;
    if (!confirm(`¿Remover "${name}" del espacio?`)) return;

    try {
      if (type === "summary") {
        await removeSummaryFromSpace(id, resourceId);
        showToast("Resumen removido del espacio", "success");
      } else {
        await removeDocumentFromSpace(id, resourceId);
        showToast("Documento removido del espacio", "success");
      }
      loadSpace(id);
      loadStats(id);
    } catch (error) {
      console.error("Error removing resource:", error);
      showToast("No se pudo remover el recurso", "error");
    }
  }

  async function handleCreateQuiz() {
    if (!id) return;

    if (!space?.summaries || space.summaries.length === 0) {
      showToast("Necesitas al menos un resumen para crear un quiz", "warning");
      return;
    }

    if (!confirm("¿Crear un quiz desde los resúmenes de este espacio?")) return;

    try {
      setIsCreatingQuiz(true);
      const quiz = await createQuizFromSpace(id, { topic: "general", max_questions: 10 });
      showToast("Quiz creado exitosamente", "success");
      loadStats(id);
      loadQuizzes(id);
      setTimeout(() => navigate(`/quizzes/${quiz.id}`), 1500);
    } catch (error: any) {
      console.error("Error creating quiz:", error);
      showToast(error.response?.data?.detail || "Error al crear el quiz", "error");
    } finally {
      setIsCreatingQuiz(false);
    }
  }

  if (isLoading || !space) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/study-spaces")}
          className="flex items-center gap-2 text-slate-400 hover:text-pink-400 transition-colors mb-6"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Espacios
        </button>

        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: space.color }}
            >
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-300">
                {space.name}
              </h1>
              {space.description && (
                <p className="text-slate-400 mt-2">{space.description}</p>
              )}
            </div>
            <button
              onClick={handleOpenEditModal}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Editar
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-slate-900/50 rounded-xl p-4">
                <div className="text-2xl font-bold text-pink-400">{stats.num_documents}</div>
                <div className="text-sm text-slate-400">Documentos</div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <div className="text-2xl font-bold text-purple-400">{stats.num_summaries}</div>
                <div className="text-sm text-slate-400">Resúmenes</div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-400">{stats.num_quizzes}</div>
                <div className="text-sm text-slate-400">Quizzes</div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <div className="text-2xl font-bold text-green-400">{stats.avg_score.toFixed(1)}%</div>
                <div className="text-sm text-slate-400">Promedio</div>
              </div>
            </div>
          )}
        </div>

        {/* Quizzes Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Quizzes</h2>
            <button
              onClick={handleCreateQuiz}
              disabled={isCreatingQuiz || !space.summaries || space.summaries.length === 0}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreatingQuiz ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Creando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Crear Quiz
                </>
              )}
            </button>
          </div>

          {quizzes.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center">
              <p className="text-slate-400">No hay quizzes en este espacio</p>
              {(!space.summaries || space.summaries.length === 0) && (
                <p className="text-sm text-slate-500 mt-2">
                  Necesitas al menos un resumen para crear un quiz
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} showSpaceBadge={false} />
              ))}
            </div>
          )}
        </div>

        {/* Documentos */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Documentos</h2>
            <button
              onClick={() => handleOpenAddModal("document")}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
            >
              + Agregar Documento
            </button>
          </div>

          {space.documents.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center">
              <p className="text-slate-400">No hay documentos en este espacio</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {space.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-semibold flex-1 line-clamp-1">{doc.title}</h3>
                    <button
                      onClick={() => handleRemoveResource(doc.id, "document", doc.title)}
                      className="text-slate-400 hover:text-red-400 transition-colors ml-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-slate-400">{doc.file_name}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {(doc.file_size_bytes / 1024).toFixed(1)} KB
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resúmenes */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Resúmenes</h2>
            <button
              onClick={() => handleOpenAddModal("summary")}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
            >
              + Agregar Resumen
            </button>
          </div>

          {space.summaries.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center">
              <p className="text-slate-400">No hay resúmenes en este espacio</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {space.summaries.map((summary) => (
                <div
                  key={summary.id}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/summaries/${summary.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-semibold flex-1">{summary.title}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveResource(summary.id, "summary", summary.title);
                      }}
                      className="text-slate-400 hover:text-red-400 transition-colors ml-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {summary.topics.slice(0, 3).map((topic, idx) => (
                      <span
                        key={idx}
                        className="bg-pink-500/20 text-pink-300 px-2 py-1 rounded-lg text-xs"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal Editar Espacio */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Espacio"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              id="name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="Nombre del espacio"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              id="description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              placeholder="Descripción del espacio (opcional)"
            />
          </div>

          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="color"
                value={editForm.color}
                onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                className="h-10 w-20 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600">{editForm.color}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleUpdateSpace}
              disabled={isUpdating || !editForm.name.trim()}
              className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
            >
              {isUpdating ? "Guardando..." : "Guardar Cambios"}
            </button>
            <button
              onClick={() => setShowEditModal(false)}
              className="px-6 py-2.5 border border-gray-300 hover:bg-gray-50 rounded-lg font-semibold transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Agregar Recurso */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Agregar ${addModalType === "summary" ? "Resumen" : "Documento"}`}
        size="lg"
      >
        {isLoadingResources ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
          </div>
        ) : availableResources.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay {addModalType === "summary" ? "resúmenes" : "documentos"} disponibles para agregar
          </p>
        ) : (
          <div className="space-y-3">
            {availableResources.map((resource) => (
              <div
                key={resource.id}
                onClick={() => handleAddResource(resource.id)}
                className="border border-gray-200 hover:border-brand-500 rounded-lg p-4 cursor-pointer transition-colors"
              >
                <h3 className="font-semibold text-gray-900">{resource.title}</h3>
                {"file_name" in resource && (
                  <p className="text-sm text-gray-500 mt-1">{resource.file_name}</p>
                )}
                {"topics" in resource && resource.topics && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {resource.topics.slice(0, 3).map((topic: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-brand-100 text-brand-700 px-2 py-1 rounded text-xs"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
