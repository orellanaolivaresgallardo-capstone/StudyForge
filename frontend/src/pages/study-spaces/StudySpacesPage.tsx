/**
 * Study Spaces Page - REFACTORED VERSION
 * Reduced from 418 → ~175 lines using custom hooks and extracted components
 */
import { useState, useEffect } from 'react';
import { Navbar, Toast, LoadingSpinner, EmptyState } from '@/components';
import { SpaceCard } from '@/components/ui/Card';
import { CreateEditSpaceModal } from './components/CreateEditSpaceModal';
import { useStudySpacesData } from '@/hooks/useStudySpacesData';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';
import { createStudySpace, deleteStudySpace, updateStudySpace } from '@/services/api';
import type { StudySpaceWithStatsResponse } from '@/types';

export default function StudySpacesPage() {
  // Custom hooks
  const { spaces, isLoading, error, refreshSpaces, removeSpace } = useStudySpacesData();
  const { toast, showToast, showSuccess, showError, hideToast } = useToast();
  const modal = useModal();

  // Edit state
  const [editingSpace, setEditingSpace] = useState<StudySpaceWithStatsResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Show error from hook
  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  // ========== Create Space ==========
  const handleOpenCreateModal = () => {
    setEditingSpace(null);
    modal.open();
  };

  // ========== Edit Space ==========
  const handleOpenEditModal = (space: StudySpaceWithStatsResponse) => {
    setEditingSpace(space);
    modal.open();
  };

  // ========== Save Space ==========
  const handleSaveSpace = async (data: { name: string; description: string | null; color: string }) => {
    if (!data.name.trim()) {
      showToast('El nombre del espacio es obligatorio', 'warning');
      return;
    }

    try {
      setIsSaving(true);
      if (editingSpace) {
        // Update existing space
        await updateStudySpace(editingSpace.id, data);
        showSuccess('Espacio actualizado exitosamente');
      } else {
        // Create new space
        await createStudySpace(data);
        showSuccess('Espacio creado exitosamente');
      }
      modal.close();
      await refreshSpaces();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error al guardar el espacio';
      showError(errorMessage);
      console.error('Error saving study space:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ========== Delete Space ==========
  const handleDeleteSpace = async (spaceId: string, name: string) => {
    const password = prompt(
      `Para eliminar el espacio "${name}", por favor ingresa tu contraseña:`
    );
    if (!password) return;

    try {
      await deleteStudySpace(spaceId, password);
      showSuccess('Espacio eliminado');
      removeSpace(spaceId);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'No se pudo eliminar el espacio';
      showError(errorMessage);
      console.error('Error deleting study space:', err);
    }
  };

  // ========== Render ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-cyan-600/10"
        aria-hidden="true"
      />

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Espacios de Estudio</h1>
            <p className="text-white/60 mt-2">
              Organiza tus documentos y resúmenes en espacios temáticos
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            + Crear Espacio
          </button>
        </div>

        {/* Loading State */}
        {isLoading && <LoadingSpinner message="Cargando espacios de estudio..." />}

        {/* Empty State */}
        {!isLoading && spaces.length === 0 && (
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            }
            title="No tienes espacios de estudio aún"
            description="Crea tu primer espacio para comenzar a organizar tu estudio"
            action={{
              label: '+ Crear Espacio',
              onClick: handleOpenCreateModal,
            }}
          />
        )}

        {/* Spaces Grid */}
        {!isLoading && spaces.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces.map((space) => (
              <SpaceCard
                key={space.id}
                space={space}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteSpace}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <CreateEditSpaceModal
          isOpen={modal.isOpen}
          onClose={modal.close}
          isEditing={!!editingSpace}
          editingSpace={editingSpace}
          onSubmit={handleSaveSpace}
          isSaving={isSaving}
        />
      </main>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
