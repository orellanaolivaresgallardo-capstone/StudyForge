/**
 * Summaries Page - REFACTORED VERSION
 * Reduced from 531 → ~240 lines using custom hooks and extracted components
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toast, Modal, LoadingSpinner, EmptyState } from '@/components';
import { SummaryCard } from '@/components/ui/Card';
import { CreateSummaryModal } from './components/CreateSummaryModal';
import { useSummariesData } from '@/hooks/useSummariesData';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';
import { createSummaryFromDocuments, deleteSummary } from '@/services/api';
import type { ExpertiseLevel } from '@/types';

export default function SummariesPage() {
  const navigate = useNavigate();

  // Custom hooks
  const {
    summaries,
    documents,
    studySpaces,
    isLoading,
    error,
    refreshSummaries,
    loadDocumentsAndSpaces,
    removeSummary,
  } = useSummariesData();
  const { toast, showToast, showSuccess, showError, hideToast } = useToast();
  const createModal = useModal();

  // Delete confirmation state
  const [deleteModal, setDeleteModal] = useState<{ id: string; title: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Show error from hook
  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  // ========== Create Summary ==========
  const handleOpenCreateModal = () => {
    createModal.open();
    loadDocumentsAndSpaces();
  };

  const handleCreateSummary = async (data: {
    documentId: string;
    spaceId: string;
    title: string;
    level: ExpertiseLevel;
  }) => {
    if (!data.documentId) {
      showToast('Debes seleccionar un documento', 'warning');
      return;
    }

    if (!data.spaceId) {
      showToast('Debes seleccionar un espacio de estudio', 'warning');
      return;
    }

    try {
      setIsCreating(true);
      await createSummaryFromDocuments({
        document_id: data.documentId,
        study_space_id: data.spaceId,
        expertise_level: data.level,
        title: data.title || undefined,
      });
      showSuccess('Resumen creado exitosamente');
      createModal.close();
      await refreshSummaries();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error al crear el resumen';
      showError(errorMessage);
      console.error('Error creating summary:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // ========== Delete Summary ==========
  const handleDeleteClick = (id: string, title: string) => {
    setDeleteModal({ id, title });
  };

  const confirmDeleteSummary = async () => {
    if (!deleteModal) return;

    try {
      await deleteSummary(deleteModal.id);
      showSuccess('Resumen eliminado');
      removeSummary(deleteModal.id);
      setDeleteModal(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error al eliminar el resumen';
      showError(errorMessage);
      console.error('Error deleting summary:', err);
    }
  };

  // ========== Render ==========
  return (
    <>
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
              label: 'Crear resumen',
              onClick: handleOpenCreateModal,
            }}
          />
        )}

        {/* Summaries Grid */}
        {!isLoading && summaries.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {summaries.map((summary) => (
              <SummaryCard
                key={summary.id}
                summary={summary}
                onDelete={(id) => handleDeleteClick(id, summary.title)}
              />
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
                  ¿Estás seguro de que quieres eliminar el resumen{' '}
                  <strong>"{deleteModal.title}"</strong>?
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
        <CreateSummaryModal
          isOpen={createModal.isOpen}
          onClose={createModal.close}
          documents={documents}
          studySpaces={studySpaces}
          onSubmit={handleCreateSummary}
          isCreating={isCreating}
        />

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </>
  );
}
