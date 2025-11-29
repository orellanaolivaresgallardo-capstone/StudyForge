// frontend/src/pages/study-spaces/StudySpaceDetailPage.tsx
/**
 * Página de detalle de espacio de estudio.
 * Muestra documentos, resúmenes, quizzes y estadísticas del espacio.
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar, Toast, Modal, LoadingSpinner, EmptyState, QuizCard, PerformanceChart, QuizConfigModal } from "@/components";
import type { ToastType } from "@/components";
import { SpaceHeader } from "./components";
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
  createQuizFromDocument,
  createQuizFromSummary,
  createSummaryFromDocuments,
  getUserPerformance,
} from "@/services/api";
import type {
  StudySpaceDetailResponse,
  StudySpaceStatsResponse,
  StudySpaceUpdate,
  SummaryResponse,
  DocumentResponse,
  QuizResponse,
  UserPerformance,
  ExpertiseLevel,
} from "@/types";

export default function StudySpaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [space, setSpace] = useState<StudySpaceDetailResponse | null>(null);
  const [stats, setStats] = useState<StudySpaceStatsResponse | null>(null);
  const [quizzes, setQuizzes] = useState<QuizResponse[]>([]);
  const [performance, setPerformance] = useState<UserPerformance | null>(null);
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

  // Estado para crear resumen desde documento
  const [showCreateSummaryModal, setShowCreateSummaryModal] = useState(false);
  const [selectedDocumentForSummary, setSelectedDocumentForSummary] = useState<DocumentResponse | null>(null);
  const [summaryExpertiseLevel, setSummaryExpertiseLevel] = useState<ExpertiseLevel>("medio");
  const [isCreatingSummary, setIsCreatingSummary] = useState(false);

  // Estado para crear quiz
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);

  // Modal de configuración de quiz (unificado para todos los orígenes)
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizSource, setQuizSource] = useState<{
    type: 'space' | 'document' | 'summary';
    data: DocumentResponse | SummaryResponse | null;
  } | null>(null);

  useEffect(() => {
    if (id) {
      loadSpace(id);
      loadStats(id);
      loadQuizzes(id);
      loadPerformance();
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

  async function loadPerformance() {
    try {
      const data = await getUserPerformance(10);
      setPerformance(data);
    } catch (error) {
      console.error("Error loading performance:", error);
    }
  }

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ message: msg, type });
  }

  // ========== Crear Resumen desde Documento ==========
  function handleOpenCreateSummaryModal(document: DocumentResponse) {
    setSelectedDocumentForSummary(document);
    setSummaryExpertiseLevel("medio");
    setShowCreateSummaryModal(true);
  }

  async function handleCreateSummary() {
    if (!id || !selectedDocumentForSummary) return;

    try {
      setIsCreatingSummary(true);
      await createSummaryFromDocuments({
        document_id: selectedDocumentForSummary.id, // NEW: Singular (one document per summary)
        study_space_id: id, // NEW: Required field from route param
        expertise_level: summaryExpertiseLevel,
      });
      showToast("Resumen creado exitosamente", "success");
      setShowCreateSummaryModal(false);
      loadSpace(id);
      loadStats(id);
    } catch (error: any) {
      console.error("Error creating summary:", error);
      showToast(error.response?.data?.detail || "Error al crear el resumen", "error");
    } finally {
      setIsCreatingSummary(false);
    }
  }

  // ========== Abrir Modal de Configuración de Quiz ==========
  function handleOpenQuizModal(
    type: 'space' | 'document' | 'summary',
    resource?: DocumentResponse | SummaryResponse
  ) {
    // Validación específica por tipo
    if (type === 'space' && (!space?.summaries || space.summaries.length === 0)) {
      showToast("Necesitas al menos un resumen para crear un quiz desde el espacio", "warning");
      return;
    }

    // Configurar origen del quiz
    setQuizSource({
      type,
      data: resource || null,
    });

    // Abrir modal
    setShowQuizModal(true);
  }

  // ========== Descripción del Modal según Origen ==========
  function getQuizModalDescription() {
    if (!quizSource) return "";

    switch (quizSource.type) {
      case 'space':
        return "Se generará un cuestionario basado en los resúmenes de este espacio para evaluar tu comprensión del material.";

      case 'document':
        return (
          <>
            Se generará un cuestionario basado en el documento{' '}
            <span className="font-semibold text-violet-400">
              {(quizSource.data as DocumentResponse)?.title}
            </span>.
          </>
        );

      case 'summary':
        return (
          <>
            Se generará un cuestionario basado en el resumen{' '}
            <span className="font-semibold text-violet-400">
              {(quizSource.data as SummaryResponse)?.title}
            </span>.
          </>
        );

      default:
        return "";
    }
  }

  // ========== Generar Quiz (Unificado) ==========
  async function handleGenerateQuiz(numQuestions: number) {
    if (!id || !quizSource) return;

    try {
      setIsCreatingQuiz(true);
      let quiz;

      // Llamar al endpoint apropiado según el tipo de origen
      switch (quizSource.type) {
        case 'space':
          quiz = await createQuizFromSpace(id, { max_questions: numQuestions });
          break;

        case 'document':
          if (!quizSource.data) return;
          quiz = await createQuizFromDocument(
            (quizSource.data as DocumentResponse).id,
            id, // NEW: study_space_id from route param
            numQuestions
          );
          break;

        case 'summary':
          if (!quizSource.data) return;
          quiz = await createQuizFromSummary({
            summary_id: (quizSource.data as SummaryResponse).id,
            study_space_id: id, // NEW: study_space_id from route param
            max_questions: numQuestions,
          });
          break;
      }

      showToast("Quiz creado exitosamente", "success");
      setShowQuizModal(false);
      setQuizSource(null);
      loadStats(id);
      loadQuizzes(id);
      setTimeout(() => navigate(`/quizzes/${quiz.id}`), 1000);
    } catch (error: any) {
      console.error("Error creating quiz:", error);
      showToast(error.response?.data?.detail || "Error al crear el quiz", "error");
      throw error; // Re-throw para que el modal pueda manejarlo
    } finally {
      setIsCreatingQuiz(false);
    }
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

  if (isLoading || !space) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
          aria-hidden="true"
        />
        <Navbar />
        <div className="relative z-10 flex justify-center items-center h-screen">
          <LoadingSpinner message="Cargando espacio de estudio..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
        aria-hidden="true"
      />

      <Navbar />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/study-spaces")}
          className="flex items-center gap-2 text-white/60 hover:text-violet-400 transition-colors mb-6"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Espacios
        </button>

        {/* Header */}
        <SpaceHeader
          space={space}
          stats={stats}
          onEdit={handleOpenEditModal}
        />

        {/* Gráfico de Progreso */}
        {performance && performance.recent_attempts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Progreso en este Espacio</h2>
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
              <PerformanceChart
                attempts={performance.recent_attempts.filter(
                  (attempt) => attempt.study_space_id === id
                )}
              />
              {performance.recent_attempts.filter((a) => a.study_space_id === id).length === 0 && (
                <p className="text-white/60 text-center py-8">
                  Aún no tienes intentos de quiz en este espacio
                </p>
              )}
            </div>
          </div>
        )}

        {/* Documentos Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Quizzes</h2>
            <button
              onClick={() => handleOpenQuizModal('space')}
              disabled={isCreatingQuiz || !space.summaries || space.summaries.length === 0}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
            <EmptyState
              icon={
                <svg
                  className="w-8 h-8 text-white/60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              }
              title="No hay quizzes en este espacio"
              description={
                (!space.summaries || space.summaries.length === 0)
                  ? "Necesitas al menos un resumen para crear un quiz"
                  : "Crea tu primer quiz desde los resúmenes de este espacio"
              }
              action={
                space.summaries && space.summaries.length > 0
                  ? {
                      label: "Crear Quiz",
                      onClick: () => handleOpenQuizModal('space'),
                    }
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
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
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              + Agregar Documento
            </button>
          </div>

          {space.documents.length === 0 ? (
            <EmptyState
              icon={
                <svg
                  className="w-8 h-8 text-white/60"
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
              title="No hay documentos en este espacio"
              description="Agrega documentos para organizar tu contenido de estudio"
              action={{
                label: "+ Agregar Documento",
                onClick: () => handleOpenAddModal("document"),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {space.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-4 hover:bg-white/10 transition-all duration-200 flex flex-col"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-semibold flex-1 line-clamp-1">{doc.title}</h3>
                    <button
                      onClick={() => handleRemoveResource(doc.id, "document", doc.title)}
                      className="text-white/60 hover:text-red-400 transition-colors ml-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-white/60 mb-1">{doc.file_name}</p>
                  <p className="text-xs text-white/50 mb-3">
                    {(doc.file_size_bytes / 1024).toFixed(1)} KB
                  </p>

                  {/* Acciones */}
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => handleOpenCreateSummaryModal(doc)}
                      disabled={isCreatingSummary}
                      className="flex-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Resumen
                    </button>
                    <button
                      onClick={() => handleOpenQuizModal('document', doc)}
                      disabled={isCreatingQuiz}
                      className="flex-1 bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/30 text-pink-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Quiz
                    </button>
                  </div>
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
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              + Agregar Resumen
            </button>
          </div>

          {space.summaries.length === 0 ? (
            <EmptyState
              icon={
                <svg
                  className="w-8 h-8 text-white/60"
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
              title="No hay resúmenes en este espacio"
              description="Agrega resúmenes para organizar tu contenido de estudio"
              action={{
                label: "+ Agregar Resumen",
                onClick: () => handleOpenAddModal("summary"),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {space.summaries.map((summary) => (
                <div
                  key={summary.id}
                  className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-4 hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3
                      className="text-white font-semibold flex-1 cursor-pointer hover:text-violet-300 transition-colors"
                      onClick={() => navigate(`/summaries/${summary.id}`)}
                    >
                      {summary.title}
                    </h3>
                    <button
                      onClick={() => handleRemoveResource(summary.id, "summary", summary.title)}
                      className="text-white/60 hover:text-red-400 transition-colors ml-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Nivel de expertice */}
                  <div className="mb-2">
                    <span
                      className={`border px-2 py-1 rounded-lg text-xs capitalize ${
                        summary.expertise_level === "basico"
                          ? "bg-green-500/20 text-green-300 border-green-500/30"
                          : summary.expertise_level === "medio"
                          ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                          : "bg-red-500/20 text-red-300 border-red-500/30"
                      }`}
                    >
                      {summary.expertise_level}
                    </span>
                  </div>

                  <div className="flex gap-2 flex-wrap mt-2 mb-3">
                    {summary.topics.slice(0, 3).map((topic, idx) => (
                      <span
                        key={idx}
                        className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-1 rounded-lg text-xs"
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

                  {/* Acción */}
                  <button
                    onClick={() => handleOpenQuizModal('summary', summary)}
                    disabled={isCreatingQuiz}
                    className="w-full bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/30 text-pink-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 inline mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Generar Quiz
                  </button>
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
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-white/80 font-semibold mb-2">
              Nombre
            </label>
            <input
              type="text"
              id="name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="Nombre del espacio"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-white/80 font-semibold mb-2">
              Descripción
            </label>
            <textarea
              id="description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors resize-none"
              placeholder="Descripción del espacio (opcional)"
            />
          </div>

          <div>
            <label htmlFor="color" className="block text-white/80 font-semibold mb-2">
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
              <span className="text-sm text-white/60">{editForm.color}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleUpdateSpace}
              disabled={isUpdating || !editForm.name.trim()}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              {isUpdating ? "Guardando..." : "Guardar Cambios"}
            </button>
            <button
              onClick={() => setShowEditModal(false)}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors"
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
            <LoadingSpinner size="sm" />
          </div>
        ) : availableResources.length === 0 ? (
          <p className="text-white/60 text-center py-8">
            No hay {addModalType === "summary" ? "resúmenes" : "documentos"} disponibles para agregar
          </p>
        ) : (
          <div className="space-y-3">
            {availableResources.map((resource) => (
              <div
                key={resource.id}
                onClick={() => handleAddResource(resource.id)}
                className="border border-white/20 hover:border-violet-500 rounded-xl p-4 cursor-pointer transition-colors bg-white/5 hover:bg-white/10"
              >
                <h3 className="font-semibold text-white">{resource.title}</h3>
                {"file_name" in resource && (
                  <p className="text-sm text-white/60 mt-1">{resource.file_name}</p>
                )}
                {"topics" in resource && resource.topics && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {resource.topics.slice(0, 3).map((topic: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-1 rounded text-xs"
                      >
                        {topic}
                      </span>
                    ))}
                    {resource.topics.length > 3 && (
                      <span className="px-2 py-1 bg-white/10 text-white/60 rounded text-xs">
                        +{resource.topics.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal Crear Resumen desde Documento */}
      <Modal
        isOpen={showCreateSummaryModal}
        onClose={() => setShowCreateSummaryModal(false)}
        title="Generar Resumen"
        size="sm"
      >
        <div className="space-y-6">
          <div>
            <p className="text-white/80 mb-2">
              Documento: <strong>{selectedDocumentForSummary?.title}</strong>
            </p>
            <p className="text-sm text-white/60">
              Se generará un resumen automáticamente usando IA
            </p>
          </div>

          <div>
            <label className="block text-white/80 font-semibold mb-3">
              Nivel de Expertise
            </label>
            <div className="space-y-2">
              {[
                { value: "basico", label: "Básico", desc: "Lenguaje simple y directo" },
                { value: "medio", label: "Medio", desc: "Balance entre simplicidad y detalle" },
                { value: "avanzado", label: "Avanzado", desc: "Profundidad técnica" },
              ].map((level) => (
                <label
                  key={level.value}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    summaryExpertiseLevel === level.value
                      ? "bg-violet-600/20 border border-violet-500"
                      : "bg-white/5 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="expertise"
                    value={level.value}
                    checked={summaryExpertiseLevel === level.value}
                    onChange={(e) => setSummaryExpertiseLevel(e.target.value as ExpertiseLevel)}
                    className="w-4 h-4 text-violet-600"
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium">{level.label}</div>
                    <div className="text-xs text-white/60">{level.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowCreateSummaryModal(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateSummary}
              disabled={isCreatingSummary}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-white/10 disabled:to-white/10 disabled:text-white/40 text-white font-semibold transition-all"
            >
              {isCreatingSummary ? "Generando..." : "Generar Resumen"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Unificado para Generar Quiz */}
      <QuizConfigModal
        isOpen={showQuizModal}
        onClose={() => {
          setShowQuizModal(false);
          setQuizSource(null);
        }}
        onGenerate={handleGenerateQuiz}
        isGenerating={isCreatingQuiz}
        description={getQuizModalDescription()}
      />
    </div>
  );
}
