/**
 * Study Space Detail Page - REFACTORED VERSION
 * Reduced from 910 → ~280 lines using custom hooks and extracted components
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Toast, LoadingSpinner, QuizConfigModal, ConfirmModal } from '@/components';
import { SpaceHeader } from './components';
import { EditSpaceModal, AddResourceModal, CreateSummaryModal } from './components/modals';
import { DocumentsSection, SummariesSection, QuizzesSection, ProgressSection } from './components/sections';
import { useStudySpace } from '@/hooks/useStudySpace';
import { useStudySpaceModals } from '@/hooks/useStudySpaceModals';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';
import {
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
} from '@/services/api';
import type { StudySpaceUpdate, DocumentResponse, SummaryResponse } from '@/types';

export default function StudySpaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Custom hooks
  const { space, stats, quizzes, performance, isLoading, error, refreshSpace, refreshStats, refreshQuizzes } = useStudySpace(id);
  const modals = useStudySpaceModals();
  const { toast, showToast, showSuccess, showError, hideToast } = useToast();
  const confirmModal = useModal();

  // Confirm removal state
  const [removalTarget, setRemovalTarget] = useState<{
    id: string;
    type: 'summary' | 'document';
    name: string;
  } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Handle errors
  useEffect(() => {
    if (error) {
      showError(error);
      setTimeout(() => navigate('/study-spaces'), 2000);
    }
  }, [error, navigate, showError]);

  // Initialize edit form when space loads
  useEffect(() => {
    if (space) {
      modals.editModal.setForm({
        name: space.name,
        description: space.description || '',
        color: space.color,
      });
    }
  }, [space]); // eslint-disable-line react-hooks/exhaustive-deps

  // ========== Edit Space ==========
  const handleUpdateSpace = async (data: StudySpaceUpdate) => {
    if (!id) return;

    try {
      modals.editModal.setIsUpdating(true);
      await updateStudySpace(id, data);
      showSuccess('Espacio actualizado exitosamente');
      modals.editModal.close();
      await refreshSpace();
    } catch (err: any) {
      showError(err.response?.data?.detail || 'Error al actualizar el espacio');
    } finally {
      modals.editModal.setIsUpdating(false);
    }
  };

  // ========== Add Resources ==========
  const handleOpenAddModal = async (type: 'summary' | 'document') => {
    modals.addResourceModal.open(type);
    modals.addResourceModal.setIsLoading(true);

    try {
      if (type === 'summary') {
        const response = await listSummaries();
        const filtered = response.items.filter(item => !space?.summaries.find(s => s.id === item.id));
        modals.addResourceModal.setAvailableResources(filtered);
      } else {
        const response = await listDocuments();
        const filtered = response.items.filter(item => !space?.documents.find(d => d.id === item.id));
        modals.addResourceModal.setAvailableResources(filtered);
      }
    } catch (err) {
      showError('No se pudieron cargar los recursos');
    } finally {
      modals.addResourceModal.setIsLoading(false);
    }
  };

  const handleAddResource = async (resourceId: string) => {
    if (!id) return;

    try {
      if (modals.addResourceModal.type === 'summary') {
        await addSummaryToSpace(id, { resource_id: resourceId });
        showSuccess('Resumen agregado al espacio');
      } else {
        await addDocumentToSpace(id, { resource_id: resourceId });
        showSuccess('Documento agregado al espacio');
      }
      modals.addResourceModal.close();
      await Promise.all([refreshSpace(), refreshStats()]);
    } catch (err: any) {
      showError(err.response?.data?.detail || 'Error al agregar el recurso');
    }
  };

  // ========== Remove Resources ==========
  const handleRemoveResource = (resourceId: string, type: 'summary' | 'document', name: string) => {
    setRemovalTarget({ id: resourceId, type, name });
    confirmModal.open();
  };

  const handleConfirmRemoval = async () => {
    if (!id || !removalTarget) return;

    try {
      setIsRemoving(true);
      if (removalTarget.type === 'summary') {
        await removeSummaryFromSpace(id, removalTarget.id);
        showSuccess('Resumen removido del espacio');
      } else {
        await removeDocumentFromSpace(id, removalTarget.id);
        showSuccess('Documento removido del espacio');
      }
      await Promise.all([refreshSpace(), refreshStats()]);
      confirmModal.close();
      setRemovalTarget(null);
    } catch (err) {
      showError('No se pudo remover el recurso');
    } finally {
      setIsRemoving(false);
    }
  };

  // ========== Create Summary ==========
  const handleCreateSummary = async () => {
    if (!id || !modals.createSummaryModal.selectedDocument) return;

    try {
      modals.createSummaryModal.setIsCreating(true);
      await createSummaryFromDocuments({
        document_id: modals.createSummaryModal.selectedDocument.id,
        study_space_id: id,
        expertise_level: modals.createSummaryModal.expertiseLevel,
      });
      showSuccess('Resumen creado exitosamente');
      modals.createSummaryModal.close();
      await Promise.all([refreshSpace(), refreshStats()]);
    } catch (err: any) {
      showError(err.response?.data?.detail || 'Error al crear el resumen');
    } finally {
      modals.createSummaryModal.setIsCreating(false);
    }
  };

  // ========== Create Quiz ==========
  const handleOpenQuizModal = (type: 'space' | 'document' | 'summary', resource?: DocumentResponse | SummaryResponse) => {
    if (type === 'space' && (!space?.summaries || space.summaries.length === 0)) {
      showToast('Necesitas al menos un resumen para crear un quiz desde el espacio', 'warning');
      return;
    }
    modals.quizConfigModal.open({ type, data: resource || null });
  };

  const handleGenerateQuiz = async (numQuestions: number) => {
    if (!id || !modals.quizConfigModal.source) return;

    try {
      modals.quizConfigModal.setIsCreating(true);
      let quiz;

      switch (modals.quizConfigModal.source.type) {
        case 'space':
          quiz = await createQuizFromSpace(id, { max_questions: numQuestions });
          break;
        case 'document':
          if (!modals.quizConfigModal.source.data) return;
          quiz = await createQuizFromDocument(
            (modals.quizConfigModal.source.data as DocumentResponse).id,
            id,
            numQuestions
          );
          break;
        case 'summary':
          if (!modals.quizConfigModal.source.data) return;
          quiz = await createQuizFromSummary({
            summary_id: (modals.quizConfigModal.source.data as SummaryResponse).id,
            study_space_id: id,
            max_questions: numQuestions,
          });
          break;
      }

      showSuccess('Quiz creado exitosamente');
      modals.quizConfigModal.close();
      await Promise.all([refreshStats(), refreshQuizzes()]);
      setTimeout(() => navigate(`/quizzes/${quiz.id}/attempt`), 1000);
    } catch (err: any) {
      showError(err.response?.data?.detail || 'Error al crear el quiz');
      throw err;
    } finally {
      modals.quizConfigModal.setIsCreating(false);
    }
  };

  const getQuizModalDescription = () => {
    if (!modals.quizConfigModal.source) return '';

    switch (modals.quizConfigModal.source.type) {
      case 'space':
        return 'Se generará un cuestionario basado en los resúmenes de este espacio para evaluar tu comprensión del material.';
      case 'document':
        return (
          <>
            Se generará un cuestionario basado en el documento{' '}
            <span className="font-semibold text-violet-400">
              {(modals.quizConfigModal.source.data as DocumentResponse)?.title}
            </span>.
          </>
        );
      case 'summary':
        return (
          <>
            Se generará un cuestionario basado en el resumen{' '}
            <span className="font-semibold text-violet-400">
              {(modals.quizConfigModal.source.data as SummaryResponse)?.title}
            </span>.
          </>
        );
      default:
        return '';
    }
  };

  // ========== Render ==========
  if (isLoading || !space) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner message="Cargando espacio de estudio..." />
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <SpaceHeader
          space={space}
          onEdit={modals.editModal.open}
          onCreateQuiz={() => handleOpenQuizModal('space')}
        />

        <div className="space-y-8 mt-8">
          <ProgressSection stats={stats} performance={performance} />

          <DocumentsSection
            documents={space.documents}
            onAddDocument={() => handleOpenAddModal('document')}
            onRemoveDocument={(id, title) => handleRemoveResource(id, 'document', title)}
            onCreateSummary={modals.createSummaryModal.open}
            onCreateQuiz={(doc) => handleOpenQuizModal('document', doc)}
          />

          <SummariesSection
            summaries={space.summaries}
            onRemoveSummary={(id, title) => handleRemoveResource(id, 'summary', title)}
            onCreateQuiz={(summary) => handleOpenQuizModal('summary', summary)}
          />

          <QuizzesSection
            quizzes={quizzes}
            onCreateQuiz={() => handleOpenQuizModal('space')}
          />
        </div>
      </div>

      {/* Modals */}
      <EditSpaceModal
        isOpen={modals.editModal.isOpen}
        onClose={modals.editModal.close}
        space={space}
        form={modals.editModal.form}
        onFormChange={modals.editModal.setForm}
        onSubmit={handleUpdateSpace}
        isUpdating={modals.editModal.isUpdating}
      />

      <AddResourceModal
        isOpen={modals.addResourceModal.isOpen}
        onClose={modals.addResourceModal.close}
        type={modals.addResourceModal.type}
        resources={modals.addResourceModal.availableResources}
        isLoading={modals.addResourceModal.isLoading}
        onAddResource={handleAddResource}
      />

      <CreateSummaryModal
        isOpen={modals.createSummaryModal.isOpen}
        onClose={modals.createSummaryModal.close}
        document={modals.createSummaryModal.selectedDocument}
        expertiseLevel={modals.createSummaryModal.expertiseLevel}
        onExpertiseLevelChange={modals.createSummaryModal.setExpertiseLevel}
        onSubmit={handleCreateSummary}
        isCreating={modals.createSummaryModal.isCreating}
      />

      <QuizConfigModal
        isOpen={modals.quizConfigModal.isOpen}
        onClose={modals.quizConfigModal.close}
        onGenerate={handleGenerateQuiz}
        isGenerating={modals.quizConfigModal.isCreating}
        description={getQuizModalDescription()}
      />

      {removalTarget && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={confirmModal.close}
          onConfirm={handleConfirmRemoval}
          title="Remover recurso"
          message={`¿Estás seguro de que deseas remover "${removalTarget.name}" de este espacio? ${
            removalTarget.type === 'summary'
              ? 'El resumen será eliminado permanentemente.'
              : 'El documento solo será removido del espacio, no se eliminará.'
          }`}
          confirmText="Sí, remover"
          variant={removalTarget.type === 'summary' ? 'danger' : 'warning'}
          isLoading={isRemoving}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </>
  );
}
