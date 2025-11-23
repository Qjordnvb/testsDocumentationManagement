/**
 * Custom hook for fetching project statistics
 */

import { useState, useEffect } from 'react';
import { projectApi, type ProjectStats } from '@/entities/project';

export const useProjectStats = (projectId: string | undefined) => {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await projectApi.getStats(projectId);
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading stats';
      setError(errorMessage);
      console.error('Error loading project stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [projectId]);

  return {
    stats,
    loading,
    error,
    reload: loadStats,
  };
};
