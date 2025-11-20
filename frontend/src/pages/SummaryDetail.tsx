// frontend/src/pages/SummaryDetail.tsx
/**
 * Página de detalle de resumen con documentos asociados.
 * Vista completa del resumen generado por IA.
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getSummary, deleteSummary, createQuizFromSummary } from "../services/api";
import type { SummaryDetailResponse, ExpertiseLevel } from "../types/api.types";

export default function SummaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<SummaryDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState(10);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  useEffect(() => {
    if (id) {
      loadSummary(id);
    }
  }, [id]);

  async function loadSummary(summaryId: string) {
    try {
      setIsLoading(true);
      const data = await getSummary(summaryId);
      setSummary(data);
    } catch (error) {
      console.error("Error loading summary:", error);
      showToast("No se pudo cargar el resumen");
      setTimeout(() => navigate("/summaries"), 2000);
    } finally {
      setIsLoading(false);
    }
  }

  function showToast(msg: string, ms = 3000) {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }

  async function handleDelete() {
    if (!id) return;

    try {
      await deleteSummary(id);
      showToast("Resumen eliminado");
      setTimeout(() => navigate("/summaries"), 1000);
    } catch (error) {
      console.error("Error deleting summary:", error);
      showToast("No se pudo eliminar el resumen");
    } finally {
      setShowDeleteConfirm(false);
    }
  }

  function handleOpenQuizModal() {
    setShowQuizModal(true);
    setQuizQuestions(10);
  }

  async function handleGenerateQuiz() {
    if (!id) return;

    try {
      setIsGeneratingQuiz(true);
      const quiz = await createQuizFromSummary({
        summary_id: id,
        max_questions: quizQuestions,
      });
      showToast("Quiz generado exitosamente");
      setShowQuizModal(false);
      // Redirigir a la página de tomar el quiz
      setTimeout(() => navigate(`/quizzes/${quiz.id}/attempt`), 1000);
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      showToast(
        error.response?.data?.detail || "Error al generar el cuestionario"
      );
    } finally {
      setIsGeneratingQuiz(false);
    }
  }

  const getExpertiseLevelBadge = (level: ExpertiseLevel) => {
    const configs = {
      basico: {
        bg: "bg-green-500/20",
        text: "text-green-400",
        border: "border-green-500/30",
        label: "Básico",
      },
      medio: {
        bg: "bg-yellow-500/20",
        text: "text-yellow-400",
        border: "border-yellow-500/30",
        label: "Medio",
      },
      avanzado: {
        bg: "bg-red-500/20",
        text: "text-red-400",
        border: "border-red-500/30",
        label: "Avanzado",
      },
    };
    return configs[level] || configs.medio;
  };

  const levelConfig = summary
    ? getExpertiseLevelBadge(summary.expertise_level)
    : null;

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

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-10 space-y-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/summaries")}
          className="flex items-center gap-2 text-slate-400 hover:text-violet-400 transition-colors"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver a resúmenes
        </button>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
              <p className="mt-4 text-slate-300">Cargando resumen...</p>
            </div>
          </div>
        )}

        {/* Content */}
        {!isLoading && summary && (
          <>
            {/* Header Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-extrabold tracking-tight mb-3">
                    {summary.title}
                  </h1>
                  {levelConfig && (
                    <span
                      className={`inline-block px-3 py-1 rounded-lg text-sm font-medium border ${levelConfig.bg} ${levelConfig.text} ${levelConfig.border}`}
                    >
                      {levelConfig.label}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Eliminar resumen"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {new Date(summary.created_at).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
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
                  {summary.documents.length}{" "}
                  {summary.documents.length === 1 ? "documento" : "documentos"}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleOpenQuizModal}
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  Generar cuestionario
                </button>
              </div>
            </div>

            {/* Documents Section */}
            {summary.documents.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-violet-400"
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
                  Documentos fuente
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {summary.documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => navigate(`/documents`)}
                      className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:border-violet-500/50 transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-violet-500/20">
                          <svg
                            className="w-6 h-6 text-violet-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white group-hover:text-violet-400 transition-colors truncate">
                            {doc.title}
                          </p>
                          <p className="text-sm text-slate-400 mt-1">
                            {doc.file_type.toUpperCase()} •{" "}
                            {(doc.file_size_bytes / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <svg
                          className="w-5 h-5 text-slate-500 group-hover:text-violet-400 transition-colors flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Topics Section */}
            {summary.topics && summary.topics.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-violet-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  Temas principales
                </h2>
                <div className="flex flex-wrap gap-2">
                  {summary.topics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-violet-500/20 text-violet-300 rounded-xl border border-violet-500/30 text-sm font-medium"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Key Concepts Section */}
            {summary.key_concepts && summary.key_concepts.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-pink-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  Conceptos clave
                </h2>
                <div className="flex flex-wrap gap-2">
                  {summary.key_concepts.map((concept, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-pink-500/20 text-pink-300 rounded-xl border border-pink-500/30 text-sm font-medium"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Content */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-cyan-400"
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
                Resumen
              </h2>
              <div className="prose prose-invert prose-slate max-w-none">
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {summary.content.summary || "No hay contenido disponible"}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Quiz Generation Modal */}
        {showQuizModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowQuizModal(false)}
            ></div>

            {/* Modal */}
            <div className="relative bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700/50 max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Generar cuestionario</h3>
                <button
                  onClick={() => setShowQuizModal(false)}
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

              <p className="text-slate-300 mb-6">
                Se generará un cuestionario basado en este resumen para evaluar
                tu comprensión del material.
              </p>

              {/* Number of Questions */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Número de preguntas
                </label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={quizQuestions}
                  onChange={(e) => setQuizQuestions(parseInt(e.target.value) || 10)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Entre 5 y 30 preguntas (recomendado: 10)
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowQuizModal(false)}
                  disabled={isGeneratingQuiz}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGenerateQuiz}
                  disabled={isGeneratingQuiz}
                  className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingQuiz ? "Generando..." : "Generar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
            ></div>

            {/* Modal */}
            <div className="relative bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700/50 max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Confirmar eliminación</h3>
              <p className="text-slate-300 mb-6">
                ¿Estás seguro de que deseas eliminar este resumen? Esta acción
                no se puede deshacer.
              </p>
              <p className="text-sm text-slate-400 mb-6">
                Los documentos asociados <strong>no se eliminarán</strong> y
                podrás usarlos en otros resúmenes.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 font-semibold transition-colors"
                >
                  Eliminar
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
