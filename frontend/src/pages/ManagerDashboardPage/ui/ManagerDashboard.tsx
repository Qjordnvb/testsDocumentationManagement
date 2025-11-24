/**
 * Manager Dashboard Main Component
 * Orchestrates all UI sections
 */

import { BarChart3 } from 'lucide-react';
import { LoadingSpinner } from '@/shared/ui';
import { useManagerDashboard } from '../model';
import { FiltersSection } from './FiltersSection';
import { GlobalStatsCards } from './GlobalStatsCards';
import { SummaryCards } from './SummaryCards';
import { ProjectsTable } from './ProjectsTable';
import { QuickActions } from './QuickActions';

export const ManagerDashboard = () => {
  const {
    user,
    projects,
    filteredProjects,
    projectsAtRisk,
    topProjects,
    loading,
    globalStats,
    filters,
    hasActiveFilters,
    actions,
    downloadingReport,
  } = useManagerDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" label="Cargando dashboard de métricas..." center />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BarChart3 size={32} className="text-blue-600" />
          Dashboard de Métricas
        </h1>
        <p className="text-gray-600 mt-1">
          Bienvenido, {user?.full_name || 'Manager'} - Vista general de todos los proyectos
        </p>
      </div>

      {/* Filters */}
      <FiltersSection
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        totalProjects={projects.length}
        filteredCount={filteredProjects.length}
        onToggleActive={actions.toggleActiveFilter}
        onToggleAtRisk={actions.toggleAtRiskFilter}
        onSearchChange={actions.setSearchQuery}
        onClearFilters={actions.clearFilters}
      />

      {/* Global KPIs */}
      <GlobalStatsCards
        stats={globalStats}
        onShowBreakdown={actions.handleShowBreakdown}
        onToggleActive={actions.toggleActiveFilter}
      />

      {/* Two-column layout: Left - Summary Cards (30%) | Right - Projects Table (70%) */}
      <div className="grid grid-cols-1 lg:grid-cols-[30%_1fr] gap-6">
        {/* Left Column: Summary Cards */}
        <SummaryCards projectsAtRisk={projectsAtRisk} topProjects={topProjects} />

        {/* Right Column: Projects Table */}
        <ProjectsTable projects={filteredProjects} />
      </div>

      {/* Quick Actions */}
      <QuickActions
        downloadingReport={downloadingReport}
        onDownloadReport={actions.handleDownloadConsolidatedReport}
        onCompareProjects={() => actions.setShowCompareModal(true)}
      />

      {/* TODO: Add modals for Compare and Breakdown (future implementation) */}
    </div>
  );
};
