import { useState, useEffect } from 'react';
import { apiClient } from '@/shared/api';
import type { CoverageStats } from './types';
import toast from 'react-hot-toast';

export const useCoverage = (projectId: string) => {
  const [coverage, setCoverage] = useState<CoverageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCoverage = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/projects/${projectId}/coverage`);
      setCoverage(data);
    } catch (error) {
      toast.error('Error loading coverage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoverage();
  }, [projectId]);

  return { coverage, loading, reload: loadCoverage };
};
