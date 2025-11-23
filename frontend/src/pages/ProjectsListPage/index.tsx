/**
 * Projects List Page
 * Landing page showing all projects
 * Allows creating new projects and selecting existing ones
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '@/entities/project';
import { useProject } from '@/app/providers/ProjectContext';
import { useAuth } from '@/app/providers';
import { CreateProjectModal } from '@/features/project-management';
import type { Project } from '@/entities/project';
import { colors, borderRadius, getTypographyPreset } from '@/shared/design-system/tokens';
import { AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/shared/ui';

export const ProjectsListPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { setCurrentProject } = useProject();
  const { user, hasRole } = useAuth();
  const isDev = hasRole('dev');
  const navigate = useNavigate();

  // Clear current project when viewing all projects (only on mount)
  useEffect(() => {
    setCurrentProject(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [isDev, user?.email]); // Reload when role or user changes

  const loadProjects = async () => {
    try {
      setLoading(true);
      // DEV role: Filter projects by bugs assigned to this user
      const filterByUser = isDev ? user?.email : undefined;
      const data = await projectApi.getAll(filterByUser);
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

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

  const bodySmall = getTypographyPreset('bodySmall');
  const body = getTypographyPreset('body');
  const headingMedium = getTypographyPreset('headingMedium');
  const headingLarge = getTypographyPreset('headingLarge');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="xl" variant="emoji" label="Cargando proyectos..." center />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="card max-w-md text-center animate-fade-in-up">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className={`${headingMedium.className} font-bold ${colors.gray.text900} mb-2`}>Error al cargar proyectos</h2>
          <p className={`${colors.gray.text600} ${body.className} mb-6`}>{error}</p>
          <button
            onClick={loadProjects}
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
                    : 'Espera a que QA cree un proyecto'
                  }
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
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleSelectProject(project)}
                className="card cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                {/* Project Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className={`${headingMedium.className} font-bold ${colors.gray.text900} mb-1 truncate`}>
                      {project.name}
                    </h3>
                    <p className={`${bodySmall.className} ${colors.gray.text500} font-mono`}>
                      {project.id}
                    </p>
                  </div>
                  <span
                    className={`ml-2 px-3 py-1 ${bodySmall.className} font-semibold ${borderRadius.full} flex-shrink-0 ${
                      project.status === 'active'
                        ? `${colors.status.success[100]} ${colors.status.success.text800}`
                        : project.status === 'archived'
                        ? `${colors.gray[100]} ${colors.gray.text800}`
                        : `${colors.brand.primary[100]} ${colors.brand.primary.text800}`
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                {/* Project Description */}
                <p className={`${colors.gray.text600} ${bodySmall.className} mb-4 line-clamp-2 min-h-[40px]`}>
                  {project.description || 'Sin descripción'}
                </p>

                {/* Metrics Grid */}
                <div className={`grid grid-cols-3 gap-4 mb-4 text-center ${colors.gray[50]} ${borderRadius.lg} p-3`}>
                  <div>
                    <p className={`${headingLarge.className} font-bold ${colors.brand.primary.text600}`}>
                      {project.total_user_stories}
                    </p>
                    <p className={`${bodySmall.className} ${colors.gray.text500} mt-1`}>Stories</p>
                  </div>
                  <div>
                    <p className={`${headingLarge.className} font-bold ${colors.status.success.text600}`}>
                      {project.total_test_cases}
                    </p>
                    <p className={`${bodySmall.className} ${colors.gray.text500} mt-1`}>Tests</p>
                  </div>
                  <div>
                    <p className={`${headingLarge.className} font-bold ${colors.brand.secondary.text600}`}>
                      {project.test_coverage.toFixed(0)}%
                    </p>
                    <p className={`${bodySmall.className} ${colors.gray.text500} mt-1`}>Coverage</p>
                  </div>
                </div>

                {/* Project Footer */}
                <div className={`pt-4 border-t ${colors.gray.border200} flex justify-between items-center ${bodySmall.className}`}>
                  <span className={`${colors.gray.text600} truncate`}>
                    {project.client || 'Sin cliente'}
                  </span>
                  <span className={`${colors.gray.text500} flex items-center gap-1 flex-shrink-0 ml-2`}>
                    <span className="font-semibold">{project.total_bugs}</span>
                    <span>🐛</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadProjects}
      />
    </div>
  );
};
