/**
 * Custom hook for managing study space data
 * Centralizes all data fetching logic for study spaces
 */
import { useState, useEffect, useCallback } from 'react';
import {
  getStudySpace,
  getStudySpaceStats,
  getStudySpaceQuizzes,
  getUserPerformance,
} from '@/services/api';
import type {
  StudySpaceDetailResponse,
  StudySpaceStatsResponse,
  QuizResponse,
  UserPerformance,
} from '@/types';

export interface UseStudySpaceReturn {
  space: StudySpaceDetailResponse | null;
  stats: StudySpaceStatsResponse | null;
  quizzes: QuizResponse[];
  performance: UserPerformance | null;
  isLoading: boolean;
  error: string | null;
  refreshSpace: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshQuizzes: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export function useStudySpace(spaceId: string | undefined): UseStudySpaceReturn {
  const [space, setSpace] = useState<StudySpaceDetailResponse | null>(null);
  const [stats, setStats] = useState<StudySpaceStatsResponse | null>(null);
  const [quizzes, setQuizzes] = useState<QuizResponse[]>([]);
  const [performance, setPerformance] = useState<UserPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSpace = useCallback(async (id: string) => {
    try {
      const data = await getStudySpace(id);
      setSpace(data);
      setError(null);
    } catch (err) {
      console.error('Error loading study space:', err);
      setError('No se pudo cargar el espacio de estudio');
      throw err;
    }
  }, []);

  const loadStats = useCallback(async (id: string) => {
    try {
      const data = await getStudySpaceStats(id);
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, []);

  const loadQuizzes = useCallback(async (id: string) => {
    try {
      const response = await getStudySpaceQuizzes(id);
      setQuizzes(response.items);
    } catch (err) {
      console.error('Error loading quizzes:', err);
    }
  }, []);

  const loadPerformance = useCallback(async () => {
    try {
      const data = await getUserPerformance(10);
      setPerformance(data);
    } catch (err) {
      console.error('Error loading performance:', err);
    }
  }, []);

  const loadAllData = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadSpace(id),
        loadStats(id),
        loadQuizzes(id),
        loadPerformance(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [loadSpace, loadStats, loadQuizzes, loadPerformance]);

  // Load data on mount and when spaceId changes
  useEffect(() => {
    if (spaceId) {
      loadAllData(spaceId);
    }
  }, [spaceId, loadAllData]);

  const refreshSpace = useCallback(async () => {
    if (spaceId) {
      await loadSpace(spaceId);
    }
  }, [spaceId, loadSpace]);

  const refreshStats = useCallback(async () => {
    if (spaceId) {
      await loadStats(spaceId);
    }
  }, [spaceId, loadStats]);

  const refreshQuizzes = useCallback(async () => {
    if (spaceId) {
      await loadQuizzes(spaceId);
    }
  }, [spaceId, loadQuizzes]);

  const refreshAll = useCallback(async () => {
    if (spaceId) {
      await loadAllData(spaceId);
    }
  }, [spaceId, loadAllData]);

  return {
    space,
    stats,
    quizzes,
    performance,
    isLoading,
    error,
    refreshSpace,
    refreshStats,
    refreshQuizzes,
    refreshAll,
  };
}
