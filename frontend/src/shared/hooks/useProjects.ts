/**
 * Custom hook for fetching and managing projects
 */

import { useState, useEffect } from 'react';
import { projectApi, type Project } from '@/entities/project';

export interface UseProjectsOptions {
  filterByUser?: string;
  autoLoad?: boolean;
}

export const useProjects = (options: UseProjectsOptions = {}) => {
  const { filterByUser, autoLoad = true } = options;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectApi.getAll(filterByUser);
      setProjects(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading projects';
      setError(errorMessage);
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      loadProjects();
    }
  }, [autoLoad, filterByUser]);

  return {
    projects,
    loading,
    error,
    reload: loadProjects,
  };
};
