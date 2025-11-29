/**
 * Custom hook for managing summaries data fetching and state
 */
import { useState, useEffect } from 'react';
import { listSummaries, listDocuments, listStudySpaces } from '@/services/api';
import type { SummaryResponse, DocumentResponse, StudySpaceResponse } from '@/types';

export interface UseSummariesDataReturn {
  summaries: SummaryResponse[];
  documents: DocumentResponse[];
  studySpaces: StudySpaceResponse[];
  isLoading: boolean;
  error: string | null;
  refreshSummaries: () => Promise<void>;
  loadDocumentsAndSpaces: () => Promise<void>;
  removeSummary: (id: string) => void;
}

export function useSummariesData(): UseSummariesDataReturn {
  const [summaries, setSummaries] = useState<SummaryResponse[]>([]);
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [studySpaces, setStudySpaces] = useState<StudySpaceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSummaries = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await listSummaries();
      setSummaries(response.items);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error al cargar los resúmenes';
      setError(errorMessage);
      console.error('Error loading summaries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocumentsAndSpaces = async () => {
    try {
      const [docsResponse, spacesResponse] = await Promise.all([
        listDocuments(),
        listStudySpaces(),
      ]);
      setDocuments(docsResponse.items);
      setStudySpaces(spacesResponse.items);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error al cargar documentos y espacios';
      setError(errorMessage);
      console.error('Error loading documents and spaces:', err);
    }
  };

  const removeSummary = (id: string) => {
    setSummaries((prev) => prev.filter((s) => s.id !== id));
  };

  useEffect(() => {
    refreshSummaries();
  }, []);

  return {
    summaries,
    documents,
    studySpaces,
    isLoading,
    error,
    refreshSummaries,
    loadDocumentsAndSpaces,
    removeSummary,
  };
}
