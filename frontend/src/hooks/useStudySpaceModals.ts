/**
 * Custom hook for managing study space modal states
 * Separates UI state management from business logic
 */
import { useState, useCallback } from 'react';
import type { DocumentResponse, SummaryResponse, ExpertiseLevel } from '@/types';

interface QuizSource {
  type: 'space' | 'document' | 'summary';
  data: DocumentResponse | SummaryResponse | null;
}

export interface UseStudySpaceModalsReturn {
  // Edit modal
  editModal: {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    form: { name: string; description: string; color: string };
    setForm: (form: { name: string; description: string; color: string }) => void;
    isUpdating: boolean;
    setIsUpdating: (value: boolean) => void;
  };

  // Add resource modal
  addResourceModal: {
    isOpen: boolean;
    open: (type: 'summary' | 'document') => void;
    close: () => void;
    type: 'summary' | 'document';
    setType: (type: 'summary' | 'document') => void;
    availableResources: (SummaryResponse | DocumentResponse)[];
    setAvailableResources: (resources: (SummaryResponse | DocumentResponse)[]) => void;
    isLoading: boolean;
    setIsLoading: (value: boolean) => void;
  };

  // Create summary modal
  createSummaryModal: {
    isOpen: boolean;
    open: (document: DocumentResponse) => void;
    close: () => void;
    selectedDocument: DocumentResponse | null;
    expertiseLevel: ExpertiseLevel;
    setExpertiseLevel: (level: ExpertiseLevel) => void;
    isCreating: boolean;
    setIsCreating: (value: boolean) => void;
  };

  // Quiz config modal
  quizConfigModal: {
    isOpen: boolean;
    open: (source: QuizSource) => void;
    close: () => void;
    source: QuizSource | null;
    isCreating: boolean;
    setIsCreating: (value: boolean) => void;
  };
}

export function useStudySpaceModals(): UseStudySpaceModalsReturn {
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', color: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  // Add resource modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<'summary' | 'document'>('summary');
  const [availableResources, setAvailableResources] = useState<(SummaryResponse | DocumentResponse)[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);

  // Create summary modal state
  const [showCreateSummaryModal, setShowCreateSummaryModal] = useState(false);
  const [selectedDocumentForSummary, setSelectedDocumentForSummary] = useState<DocumentResponse | null>(null);
  const [summaryExpertiseLevel, setSummaryExpertiseLevel] = useState<ExpertiseLevel>('medio');
  const [isCreatingSummary, setIsCreatingSummary] = useState(false);

  // Quiz config modal state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizSource, setQuizSource] = useState<QuizSource | null>(null);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);

  const openCreateSummaryModal = useCallback((document: DocumentResponse) => {
    setSelectedDocumentForSummary(document);
    setSummaryExpertiseLevel('medio');
    setShowCreateSummaryModal(true);
  }, []);

  const openQuizConfigModal = useCallback((source: QuizSource) => {
    setQuizSource(source);
    setShowQuizModal(true);
  }, []);

  const openAddResourceModal = useCallback((type: 'summary' | 'document') => {
    setAddModalType(type);
    setShowAddModal(true);
  }, []);

  return {
    editModal: {
      isOpen: showEditModal,
      open: () => setShowEditModal(true),
      close: () => setShowEditModal(false),
      form: editForm,
      setForm: setEditForm,
      isUpdating,
      setIsUpdating,
    },

    addResourceModal: {
      isOpen: showAddModal,
      open: openAddResourceModal,
      close: () => setShowAddModal(false),
      type: addModalType,
      setType: setAddModalType,
      availableResources,
      setAvailableResources,
      isLoading: isLoadingResources,
      setIsLoading: setIsLoadingResources,
    },

    createSummaryModal: {
      isOpen: showCreateSummaryModal,
      open: openCreateSummaryModal,
      close: () => setShowCreateSummaryModal(false),
      selectedDocument: selectedDocumentForSummary,
      expertiseLevel: summaryExpertiseLevel,
      setExpertiseLevel: setSummaryExpertiseLevel,
      isCreating: isCreatingSummary,
      setIsCreating: setIsCreatingSummary,
    },

    quizConfigModal: {
      isOpen: showQuizModal,
      open: openQuizConfigModal,
      close: () => setShowQuizModal(false),
      source: quizSource,
      isCreating: isCreatingQuiz,
      setIsCreating: setIsCreatingQuiz,
    },
  };
}
