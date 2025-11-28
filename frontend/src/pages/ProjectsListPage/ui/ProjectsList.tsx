/**
 * Projects List Main Component
 * Landing page showing all projects with advanced filtering
 */

import { AlertCircle, FolderKanban } from 'lucide-react';
import { SkeletonCard, EmptyState } from '@/shared/ui';
import { CreateProjectModal } from '@/features/project-management';
import { useAuth } from '@/app/providers';
import { colors, getTypographyPreset } from '@/shared/design-system/tokens';
import { useProjectsList } from '../model';
import { FilterPills } from './FilterPills';
import { ProjectsToolbar } from './ProjectsToolbar';
import { ProjectCard } from './ProjectCard';

export const ProjectsList = () => {
  const { hasRole } = useAuth();
  const isDev = hasRole('dev');

  const {
    projects,
    allProjects,
    loading,
    error,
    statusCounts,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    showCreateModal,
    setShowCreateModal,
    handleSelectProject,
    handleCreateProject,
    handleCreateSuccess,
  } = useProjectsList();

  const bodySmall = getTypographyPreset('bodySmall');
  const body = getTypographyPreset('body');
  const headingMedium = getTypographyPreset('headingMedium');
  const headingLarge = getTypographyPreset('headingLarge');
  const h2 = getTypographyPreset('h2');

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Skeleton header */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>

          {/* Skeleton filters */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            ))}
          </div>

          {/* Skeleton toolbar */}
          <div className="h-16 bg-white rounded-lg border border-gray-200 animate-pulse"></div>

          {/* Skeleton grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className={`${headingMedium.className} font-bold ${colors.gray.text900} mb-2`}>
            Error al cargar proyectos
          </h2>
          <p className={`${colors.gray.text600} ${body.className} mb-6`}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Empty state (no projects at all)
  if (allProjects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-12 max-w-lg text-center">
          {isDev ? (
            <>
              <AlertCircle className={`w-20 h-20 mx-auto mb-6 ${colors.gray.text400}`} />
              <h2 className={`${headingLarge.className} font-bold ${colors.gray.text900} mb-3`}>
                No tienes bugs asignados
              </h2>
              <p className={`${colors.gray.text600} ${body.className}`}>
                No tienes bugs asignados en ningún proyecto actualmente.
              </p>
              <p className={`${colors.gray.text500} mt-2 ${bodySmall.className}`}>
                Contacta con tu QA o Project Manager para que te asignen bugs.
              </p>
            </>
          ) : (
            <>
              <FolderKanban className={`w-20 h-20 mx-auto mb-6 ${colors.gray.text400}`} />
              <h2 className={`${headingLarge.className} font-bold ${colors.gray.text900} mb-3`}>
                No hay proyectos todavía
              </h2>
              <p className={`${colors.gray.text600} mb-8 ${body.className}`}>
                {hasRole('qa')
                  ? 'Crea tu primer proyecto para empezar a gestionar test cases'
                  : 'Espera a que QA cree un proyecto'}
              </p>
              {hasRole('qa') && (
                <button
                  onClick={handleCreateProject}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-200 inline-flex items-center gap-2"
                >
                  <span>➕</span>
                  <span>Crear Primer Proyecto</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>Inicio</span>
            <span>›</span>
            <span className="text-gray-900 font-medium">Proyectos</span>
          </div>
          <h1 className={`${h2.className} font-bold ${colors.gray.text900} mb-2`}>
            Proyectos
          </h1>
          <p className={`${body.className} ${colors.gray.text600}`}>
            Vista principal de proyectos para QA, Dev, Managers y Admin.
          </p>
        </div>

        {/* Filter Pills */}
        <FilterPills
          activeFilter={filterStatus}
          onFilterChange={setFilterStatus}
          counts={statusCounts}
        />

        {/* Toolbar */}
        <ProjectsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onCreateProject={hasRole('qa') ? handleCreateProject : undefined}
          canCreateProject={hasRole('qa')}
        />

        {/* Results count */}
        <div className={`${bodySmall.className} ${colors.gray.text600}`}>
          Mostrando {projects.length} de {statusCounts.all} proyectos
        </div>

        {/* Projects Grid/List */}
        {projects.length === 0 ? (
          <EmptyState
            icon={<AlertCircle className="w-16 h-16" />}
            message="No se encontraron proyectos"
            description="No hay proyectos que coincidan con los filtros actuales."
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={handleSelectProject}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in-up">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleSelectProject(project)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className={`${headingMedium.className} font-bold ${colors.gray.text900} group-hover:text-blue-600 transition-colors`}>
                      {project.name}
                    </h3>
                    <p className={`${bodySmall.className} ${colors.gray.text500} mt-1`}>
                      {project.description || 'Sin descripción'}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{project.total_user_stories}</p>
                      <p className="text-xs text-gray-500">Stories</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{project.total_test_cases}</p>
                      <p className="text-xs text-gray-500">Tests</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{project.total_bugs}</p>
                      <p className="text-xs text-gray-500">Bugs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{project.test_coverage.toFixed(0)}%</p>
                      <p className="text-xs text-gray-500">Coverage</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};
