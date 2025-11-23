/**
 * Projects List business logic
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@/app/providers/ProjectContext';
import { useAuth } from '@/app/providers';
import { useProjects } from '@/shared/hooks';

export const useProjectsList = () => {
  const { setCurrentProject } = useProject();
  const { user, hasRole } = useAuth();
  const isDev = hasRole('dev');
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load projects (filtered by user if DEV role)
  const { projects, loading, error, reload } = useProjects({
    filterByUser: isDev ? user?.email : undefined,
  });

  // Clear current project when viewing all projects (only on mount)
  useEffect(() => {
    setCurrentProject(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectProject = (project: any) => {
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
    projects,
    loading,
    error,
    showCreateModal,
    setShowCreateModal,
    handleSelectProject,
    handleCreateProject,
    handleCreateSuccess,
  };
};
