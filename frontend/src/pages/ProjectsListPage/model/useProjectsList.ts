/**
 * Projects List business logic
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@/app/providers/ProjectContext';
import { useAuth } from '@/app/providers';
import { useProjects } from '@/shared/hooks';
import type { Project } from '@/entities/project';

export type ProjectFilterStatus = 'all' | 'active' | 'archived' | 'completed';
export type ViewMode = 'grid' | 'list';
export type SortBy = 'name' | 'recent' | 'coverage' | 'bugs';

export const useProjectsList = () => {
  const { setCurrentProject } = useProject();
  const { user, hasRole } = useAuth();
  const isDev = hasRole('dev');
  const navigate = useNavigate();

  // UI State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ProjectFilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('recent');

  // Load projects (filtered by user if DEV role)
  const { projects, loading, error, reload } = useProjects({
    filterByUser: isDev ? user?.email : undefined,
  });

  // Clear current project when viewing all projects (only on mount)
  useEffect(() => {
    setCurrentProject(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered and sorted projects
  const filteredProjects = useMemo(() => {
    let result = projects;

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter((p) => p.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.id.toLowerCase().includes(query)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime();
        case 'coverage':
          return b.test_coverage - a.test_coverage;
        case 'bugs':
          return b.total_bugs - a.total_bugs;
        default:
          return 0;
      }
    });

    return result;
  }, [projects, filterStatus, searchQuery, sortBy]);

  // Count by status
  const statusCounts = useMemo(() => {
    return {
      all: projects.length,
      active: projects.filter((p) => p.status === 'active').length,
      archived: projects.filter((p) => p.status === 'archived').length,
      completed: projects.filter((p) => p.status === 'completed').length,
    };
  }, [projects]);

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    // Role-based navigation
    if (isDev) {
      // DEV: Go directly to Mis Bugs
      navigate(`/projects/${project.id}/bugs`);
    } else {
      // QA, Manager: Go to dashboard
      navigate(`/projects/${project.id}/dashboard`);
    }
  };

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    reload();
  };

  return {
    // Data
    projects: filteredProjects,
    allProjects: projects,
    loading,
    error,
    statusCounts,

    // Filters
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,

    // View
    viewMode,
    setViewMode,

    // Modal
    showCreateModal,
    setShowCreateModal,

    // Actions
    handleSelectProject,
    handleCreateProject,
    handleCreateSuccess,
    reload,
  };
};
