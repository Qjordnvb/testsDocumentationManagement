/**
 * Sidebar Navigation Component (project-scoped)
 */

import { Link, useLocation, useParams } from 'react-router-dom';
import { useProject } from '@/app/providers/ProjectContext';
import { useAppStore } from '@/app/providers/appStore';
import { useState, useEffect } from 'react';
import { projectApi } from '@/entities/project';
import type { Project } from '@/entities/project';
import { colors, borderRadius, getTypographyPreset } from '@/shared/design-system/tokens';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export const Sidebar = () => {
  const location = useLocation();
  const params = useParams();

  // Extract projectId from params OR from URL as fallback
  let projectId = params.projectId;

  // Fallback: extract from URL if params doesn't have it
  if (!projectId) {
    const match = location.pathname.match(/\/projects\/([^/]+)/);
    projectId = match ? match[1] : undefined;
  }

  const { currentProject, setCurrentProject } = useProject();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  // Build nav items with dynamic projectId
  const navItems: NavItem[] = projectId ? [
    { path: `/projects/${projectId}/dashboard`, label: 'Dashboard', icon: '📊' },
    { path: `/projects/${projectId}/stories`, label: 'User Stories', icon: '📝' },
    { path: `/projects/${projectId}/tests`, label: 'Test Cases', icon: '✅' },
    { path: `/projects/${projectId}/bugs`, label: 'Bug Reports', icon: '🐛' },
    { path: `/projects/${projectId}/reports`, label: 'Reports', icon: '📄' },
  ] : [];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Load projects when viewing all projects (no projectId)
  useEffect(() => {
    if (!projectId) {
      const loadProjects = async () => {
        try {
          const projects = await projectApi.getAll();
          setAllProjects(projects);
        } catch (error) {
          console.error('Error loading projects in sidebar:', error);
          setAllProjects([]); // Set empty array on error
        }
      };
      loadProjects();
    } else {
      // Clear projects list when inside a project
      setAllProjects([]);
    }
  }, [projectId]);

  const handleProjectClick = (project: Project) => {
    setCurrentProject(project);
  };

  const bodySmall = getTypographyPreset('bodySmall');
  const h4 = getTypographyPreset('h4');

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-primary-blue to-primary-purple ${colors.white} transition-all duration-300 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo / Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        {!sidebarCollapsed && (
          <div className="flex-1">
            <h1 className={`${h4.className} text-white`}>🎯 QA Flow</h1>
            {projectId && currentProject ? (
              <p className={`${bodySmall.className} text-white/70 mt-1 truncate`}>
                {currentProject.name}
              </p>
            ) : (
              <p className={`${bodySmall.className} text-white/70 mt-1`}>
                Todos los Proyectos
              </p>
            )}
          </div>
        )}
        {sidebarCollapsed && <span className="text-2xl">🎯</span>}
        <button
          onClick={toggleSidebar}
          className={`p-2 ${borderRadius.lg} hover:bg-blue-600/20 hover:scale-110 transition-all duration-200`}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation - Only show when inside a project */}
      {projectId && projectId !== '' ? (
        <>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${
                  isActive(item.path) ? 'sidebar-link-active' : ''
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="text-xl">{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            ))}
          </nav>

          {/* Settings and Back to Projects at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 space-y-2">
            <Link
              to={`/projects/${projectId}/settings`}
              className={`sidebar-link ${
                isActive(`/projects/${projectId}/settings`) ? 'sidebar-link-active' : ''
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
              title={sidebarCollapsed ? 'Settings' : undefined}
            >
              <span className="text-xl">⚙️</span>
              {!sidebarCollapsed && <span className="font-medium">Settings</span>}
            </Link>
            <Link
              to="/"
              className={`sidebar-link ${sidebarCollapsed ? 'justify-center' : ''}`}
              title={sidebarCollapsed ? 'Volver a Proyectos' : undefined}
            >
              <span className="text-xl">←</span>
              {!sidebarCollapsed && <span className="font-medium">Volver a Proyectos</span>}
            </Link>
          </div>
        </>
      ) : (
        // When viewing all projects - show list of projects
        <div className="flex-1 flex flex-col overflow-hidden">
          {!sidebarCollapsed ? (
            <>
              <div className="p-4 border-b border-white/10">
                <h3 className={`${bodySmall.className} font-semibold text-white/70 uppercase tracking-wider`}>
                  Mis Proyectos
                </h3>
              </div>
              <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                {allProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}/dashboard`}
                    onClick={() => handleProjectClick(project)}
                    className={`block p-3 ${borderRadius.lg} hover:bg-purple-600/20 hover:translate-x-1 transition-all duration-200 group`}
                  >
                    <div className={`font-medium ${colors.white} group-hover:text-white truncate`}>
                      {project.name}
                    </div>
                    <div className={`${bodySmall.className} text-white/50 group-hover:text-white/70 mt-0.5 truncate`}>
                      {project.id} • {project.total_test_cases} tests
                    </div>
                  </Link>
                ))}
                {allProjects.length === 0 && (
                  <div className={`text-center py-8 text-white/50 ${bodySmall.className}`}>
                    No hay proyectos
                  </div>
                )}
              </nav>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-4xl">📁</div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
