/**
 * Manager Dashboard business logic
 * Centralizes state management and data fetching
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/providers';
import { getProjectsAtRisk, getTopProjects, getActiveProjects } from '@/entities/project';
import { filterProjectsByQuery } from '@/shared/lib';
import { useProjects } from '@/shared/hooks';
import type { GlobalStats, FilterState, BreakdownType } from './types';

export const useManagerDashboard = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { projects, loading, reload } = useProjects();

  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    showOnlyActive: false,
    showOnlyAtRisk: false,
    searchQuery: '',
  });

  // Modal states
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [breakdownType, setBreakdownType] = useState<BreakdownType>(null);

  // Downloading states
  const [downloadingReport, setDownloadingReport] = useState(false);

  // Redirect if not manager
  useEffect(() => {
    if (!hasRole('manager')) {
      navigate('/');
      toast.error('Acceso denegado: Solo managers');
    }
  }, [hasRole, navigate]);

  // Calculate global stats
  const globalStats: GlobalStats = useMemo(() => {
    const activeProjects = getActiveProjects(projects).length;
    const totalStories = projects.reduce((sum, p) => sum + p.total_user_stories, 0);
    const totalTests = projects.reduce((sum, p) => sum + p.total_test_cases, 0);
    const totalBugs = projects.reduce((sum, p) => sum + p.total_bugs, 0);
    const avgCoverage =
      projects.length > 0
        ? projects.reduce((sum, p) => sum + p.test_coverage, 0) / projects.length
        : 0;

    return {
      totalProjects: projects.length,
      activeProjects,
      totalStories,
      totalTests,
      totalBugs,
      avgCoverage,
    };
  }, [projects]);

  // Apply filters
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // Active filter
    if (filters.showOnlyActive) {
      filtered = getActiveProjects(filtered);
    }

    // At-risk filter
    if (filters.showOnlyAtRisk) {
      filtered = getProjectsAtRisk(filtered);
    }

    // Search filter
    if (filters.searchQuery) {
      filtered = filterProjectsByQuery(filtered, filters.searchQuery);
    }

    return filtered;
  }, [projects, filters]);

  // Projects at risk
  const projectsAtRisk = useMemo(() => getProjectsAtRisk(projects), [projects]);

  // Top performing projects
  const topProjects = useMemo(() => getTopProjects(projects, 3), [projects]);

  // Download consolidated report
  const handleDownloadConsolidatedReport = async () => {
    try {
      setDownloadingReport(true);
      toast.loading('Generando reporte consolidado de todos los proyectos...');

      const response = await fetch('/api/v1/reports/consolidated');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate consolidated report');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Consolidated_Report_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success('✅ Reporte consolidado descargado exitosamente!');
    } catch (error) {
      toast.dismiss();
      toast.error(
        error instanceof Error ? error.message : 'Error al generar reporte consolidado'
      );
    } finally {
      setDownloadingReport(false);
    }
  };

  // Show breakdown modal
  const handleShowBreakdown = (type: BreakdownType) => {
    setBreakdownType(type);
    setShowBreakdownModal(true);
  };

  // Filter actions
  const toggleActiveFilter = () => {
    const newValue = !filters.showOnlyActive;
    setFilters((prev) => ({ ...prev, showOnlyActive: newValue, showOnlyAtRisk: false }));

    if (newValue) {
      toast.success(
        `Filtrando solo proyectos activos (${getActiveProjects(projects).length})`
      );
    } else {
      toast('Mostrando todos los proyectos', { icon: 'ℹ️' });
    }
  };

  const toggleAtRiskFilter = () => {
    const newValue = !filters.showOnlyAtRisk;
    setFilters((prev) => ({ ...prev, showOnlyAtRisk: newValue, showOnlyActive: false }));

    if (newValue) {
      toast(`Filtrando proyectos en riesgo (${getProjectsAtRisk(projects).length})`, {
        icon: '⚠️',
      });
    } else {
      toast('Mostrando todos los proyectos', { icon: 'ℹ️' });
    }
  };

  const setSearchQuery = (query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  };

  const clearFilters = () => {
    setFilters({ showOnlyActive: false, showOnlyAtRisk: false, searchQuery: '' });
    toast('Filtros eliminados - Mostrando todos los proyectos', { icon: 'ℹ️' });
  };

  const hasActiveFilters = !!(filters.searchQuery || filters.showOnlyActive || filters.showOnlyAtRisk);

  return {
    // User data
    user,

    // Projects data
    projects,
    filteredProjects,
    projectsAtRisk,
    topProjects,
    loading,

    // Stats
    globalStats,

    // Filters
    filters,
    hasActiveFilters,
    actions: {
      toggleActiveFilter,
      toggleAtRiskFilter,
      setSearchQuery,
      clearFilters,
      handleDownloadConsolidatedReport,
      handleShowBreakdown,
      setShowCompareModal,
      reload,
    },

    // Modals
    showCompareModal,
    showBreakdownModal,
    breakdownType,
    downloadingReport,
  };
};
