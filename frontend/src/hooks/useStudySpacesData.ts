/**
 * Custom hook for managing study spaces data fetching and state
 */
import { useState, useEffect } from 'react';
import { listStudySpacesWithStats } from '@/services/api';
import type { StudySpaceWithStatsResponse } from '@/types';

export interface UseStudySpacesDataReturn {
  spaces: StudySpaceWithStatsResponse[];
  isLoading: boolean;
  error: string | null;
  refreshSpaces: () => Promise<void>;
  removeSpace: (id: string) => void;
}

export function useStudySpacesData(): UseStudySpacesDataReturn {
  const [spaces, setSpaces] = useState<StudySpaceWithStatsResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSpaces = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await listStudySpacesWithStats();
      setSpaces(response.items);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'No se pudieron cargar los espacios de estudio';
      setError(errorMessage);
      console.error('Error loading study spaces:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const removeSpace = (id: string) => {
    setSpaces((prev) => prev.filter((s) => s.id !== id));
  };

  useEffect(() => {
    refreshSpaces();
  }, []);

  return {
    spaces,
    isLoading,
    error,
    refreshSpaces,
    removeSpace,
  };
}
