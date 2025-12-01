// frontend/src/pages/summaries/SummaryDetailPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Toast, Modal, LoadingSpinner, QuizConfigModal } from "@/components";
import type { ToastType } from "@/components";
import { getSummary, deleteSummary, createQuizFromSummary } from "@/services/api";
import type { SummaryDetailResponse } from "@/types";
import {
  SummaryHeader,
  DocumentsSection,
  TopicsSection,
  KeyConceptsSection,
  SummaryContentSection,
} from "./components";

export default function SummaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<SummaryDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  useEffect(() => {
    if (id) loadSummary(id);
  }, [id]);

  async function loadSummary(summaryId: string) {
    try {
      setIsLoading(true);
      const data = await getSummary(summaryId);
      setSummary(data);
    } catch (error) {
      console.error("Error loading summary:", error);
      showToast("No se pudo cargar el resumen", "error");
      setTimeout(() => navigate("/summaries"), 2000);
    } finally {
      setIsLoading(false);
    }
  }

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ message: msg, type });
  }

  async function handleDelete() {
    if (!id) return;
    try {
      await deleteSummary(id);
      showToast("Resumen eliminado", "success");
      setTimeout(() => navigate("/summaries"), 1000);
    } catch (error) {
      console.error("Error deleting summary:", error);
      showToast("No se pudo eliminar el resumen", "error");
    } finally {
      setShowDeleteConfirm(false);
    }
  }

  async function handleGenerateQuiz(numQuestions: number) {
    if (!id || !summary) return;
    try {
      setIsGeneratingQuiz(true);
      const quiz = await createQuizFromSummary({
        summary_id: id,
        study_space_id: summary.study_space_id,
        max_questions: numQuestions,
      });
      showToast("Quiz generado exitosamente", "success");
      setShowQuizModal(false);
      setTimeout(() => navigate(`/quizzes/${quiz.id}/attempt`), 1000);
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      showToast(error.response?.data?.detail || "Error al generar el cuestionario", "error");
      throw error;
    } finally {
      setIsGeneratingQuiz(false);
    }
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {isLoading && <LoadingSpinner message="Cargando resumen..." />}
      {!isLoading && summary && (
        <>
          <SummaryHeader
            summary={summary}
            onDelete={() => setShowDeleteConfirm(true)}
            onGenerateQuiz={() => setShowQuizModal(true)}
          />
          <DocumentsSection document={summary.document} />
          <TopicsSection topics={summary.topics || []} />
          <KeyConceptsSection keyConcepts={summary.key_concepts || []} />
          <SummaryContentSection content={(summary.content.summary as string) || ""} />
        </>
      )}

      <QuizConfigModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        onGenerate={handleGenerateQuiz}
        isGenerating={isGeneratingQuiz}
        description="Se generará un cuestionario basado en este resumen para evaluar tu comprensión del material."
      />

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Confirmar eliminación" size="sm">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-slate-100">¿Estás seguro de que deseas eliminar este resumen? Esta acción no se puede deshacer.</p>
            <p className="text-sm text-slate-300">Los documentos asociados <strong>no se eliminarán</strong> y podrás usarlos en otros resúmenes.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors">
              Cancelar
            </button>
            <button onClick={handleDelete} className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors">
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
