/**
 * Projects List Main Component
 * Landing page showing all projects
 */

import { AlertCircle } from 'lucide-react';
import { SkeletonCard } from '@/shared/ui';
import { CreateProjectModal } from '@/features/project-management';
import { useAuth } from '@/app/providers';
import { colors, getTypographyPreset } from '@/shared/design-system/tokens';
import type { Project } from '@/entities/project';
import { useProjectsList } from '../model';

export const ProjectsList = () => {
  const { hasRole } = useAuth();
  const isDev = hasRole('dev');

  const {
    projects,
    loading,
    error,
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="card max-w-md text-center animate-fade-in-up">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className={`${headingMedium.className} font-bold ${colors.gray.text900} mb-2`}>
            Error al cargar proyectos
          </h2>
          <p className={`${colors.gray.text600} ${body.className} mb-6`}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary flex items-center gap-2 mx-auto"
          >
            <span>🔄</span>
            <span>Reintentar</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions bar - Only QA can create projects */}
      {hasRole('qa') && (
        <div className="flex justify-end items-center">
          <button
            onClick={handleCreateProject}
            className="btn btn-primary flex items-center gap-2"
          >
            <span>➕</span>
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      )}

      {/* Projects Grid */}
      <div>
        {projects.length === 0 ? (
          <div className="card text-center py-16 animate-fade-in-up">
            {isDev ? (
              <>
                {/* DEV role: No projects with assigned bugs */}
                <AlertCircle className={`w-16 h-16 mx-auto mb-6 ${colors.gray.text400}`} />
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
                {/* Other roles: No projects exist */}
                <div className="text-7xl mb-6">📁</div>
                <h2 className={`${headingLarge.className} font-bold ${colors.gray.text900} mb-3`}>
                  No hay proyectos todavía
                </h2>
                <p className={`${colors.gray.text600} mb-8 ${body.className}`}>
                  {hasRole('qa')
                    ? 'Crea tu primer proyecto para empezar a gestionar test cases'
                    : 'Espera a que QA cree un proyecto'}
                </p>
                {/* Only QA can create projects */}
                {hasRole('qa') && (
                  <button
                    onClick={handleCreateProject}
                    className="btn btn-primary inline-flex items-center gap-2"
                  >
                    <span>➕</span>
                    <span>Crear Primer Proyecto</span>
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
            {projects.map((project: Project) => (
              <div
                key={project.id}
                onClick={() => handleSelectProject(project)}
                className="card cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                {/* Project Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`${headingMedium.className} font-bold ${colors.gray.text900} mb-1 truncate`}
                    >
                      {project.name}
                    </h3>
                    <p className={`${bodySmall.className} ${colors.gray.text500} font-mono`}>
                      {project.id}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      project.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {project.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Project Description */}
                {project.description && (
                  <p className={`${body.className} ${colors.gray.text600} mb-4 line-clamp-2`}>
                    {project.description}
                  </p>
                )}

                {/* Project Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {project.total_user_stories}
                    </div>
                    <div className={`${bodySmall.className} ${colors.gray.text600}`}>
                      User Stories
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {project.total_test_cases}
                    </div>
                    <div className={`${bodySmall.className} ${colors.gray.text600}`}>
                      Test Cases
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-red-600">
                      {project.total_bugs}
                    </div>
                    <div className={`${bodySmall.className} ${colors.gray.text600}`}>Bugs</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">
                      {project.test_coverage.toFixed(0)}%
                    </div>
                    <div className={`${bodySmall.className} ${colors.gray.text600}`}>
                      Coverage
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
