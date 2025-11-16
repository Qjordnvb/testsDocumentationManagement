/**
 * Projects List Page
 * Landing page showing all projects
 * Allows creating new projects and selecting existing ones
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '@/entities/project';
import { useProject } from '@/app/providers/ProjectContext';
import { CreateProjectModal } from '@/features/project-management';
import type { Project } from '@/entities/project';

export const ProjectsListPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { setCurrentProject } = useProject();
  const navigate = useNavigate();

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectApi.getAll();
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
    navigate(`/projects/${project.id}/dashboard`);
  };

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center animate-fade-in-up">
          <div className="animate-spin text-6xl mb-4">⚙️</div>
          <p className="text-gray-600 text-lg">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="card max-w-md text-center animate-fade-in-up">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error al cargar proyectos</h2>
          <p className="text-gray-600 mb-6">{error}</p>
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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Container with max width */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Proyectos QA</h1>
            <p className="text-gray-600 mt-2">
              Selecciona un proyecto o crea uno nuevo
            </p>
          </div>
          <button
            onClick={handleCreateProject}
            className="btn btn-primary flex items-center gap-2"
          >
            <span>➕</span>
            <span>Nuevo Proyecto</span>
          </button>
        </div>

        {/* Projects Grid */}
        <div>
        {projects.length === 0 ? (
          <div className="card text-center py-16 animate-fade-in-up">
            <div className="text-7xl mb-6">📁</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              No hay proyectos todavía
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Crea tu primer proyecto para empezar a gestionar test cases
            </p>
            <button
              onClick={handleCreateProject}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <span>➕</span>
              <span>Crear Primer Proyecto</span>
            </button>
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
                    <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
                      {project.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">
                      {project.id}
                    </p>
                  </div>
                  <span
                    className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                      project.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'archived'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                {/* Project Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                  {project.description || 'Sin descripción'}
                </p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-center bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {project.total_user_stories}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Stories</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {project.total_test_cases}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Tests</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {project.test_coverage.toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Coverage</p>
                  </div>
                </div>

                {/* Project Footer */}
                <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-sm">
                  <span className="text-gray-600 truncate">
                    {project.client || 'Sin cliente'}
                  </span>
                  <span className="text-gray-500 flex items-center gap-1 flex-shrink-0 ml-2">
                    <span className="font-semibold">{project.total_bugs}</span>
                    <span>🐛</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
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
