/**
 * Sidebar Navigation Component (role-based)
 * - ADMIN: Only Dashboard and Users
 * - MANAGER: Only Dashboard
 * - DEV: Projects with assigned bugs
 * - QA: All projects (default)
 */

import { Link, useLocation, useParams } from 'react-router-dom';
import { useProject } from '@/app/providers/ProjectContext';
import { useAuth } from '@/app/providers';
import { useAppStore } from '@/app/providers/appStore';
import { useState, useEffect } from 'react';
import { projectApi } from '@/entities/project';
import type { Project } from '@/entities/project';
import { colors, borderRadius, getTypographyPreset } from '@/shared/design-system/tokens';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export const Sidebar = () => {
  const location = useLocation();
  const params = useParams();
  const { user, hasRole } = useAuth();

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
  const [projectsExpanded, setProjectsExpanded] = useState(true); // Manager projects section

  // Role-based navigation items
  const getNavItems = (): NavItem[] => {
    // Admin: Only Dashboard and Users (no projects)
    if (hasRole('admin')) {
      return [
        { path: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
        { path: '/admin/users', label: 'Usuarios', icon: '👥' },
      ];
    }

    // Manager: Always show Dashboard Global (projects shown separately)
    if (hasRole('manager')) {
      return [
        { path: '/manager/dashboard', label: 'Dashboard Global', icon: '🏠' },
      ];
    }

    // DEV: Simplified view (readonly access to Stories and Tests)
    if (hasRole('dev') && projectId) {
      return [
        { path: `/projects/${projectId}/stories`, label: 'User Stories', icon: '📝' },
        { path: `/projects/${projectId}/tests`, label: 'Test Cases', icon: '✅' },
        { path: `/projects/${projectId}/bugs`, label: 'Mis Bugs', icon: '🐛' },
      ];
    }

    // QA: Full project navigation
    if (projectId) {
      return [
        { path: `/projects/${projectId}/dashboard`, label: 'Dashboard', icon: '📊' },
        { path: `/projects/${projectId}/stories`, label: 'User Stories', icon: '📝' },
        { path: `/projects/${projectId}/tests`, label: 'Test Cases', icon: '✅' },
        { path: `/projects/${projectId}/bugs`, label: 'Bug Reports', icon: '🐛' },
        { path: `/projects/${projectId}/reports`, label: 'Reports', icon: '📄' },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Load projects when viewing all projects (for QA/Dev/Manager)
  useEffect(() => {
    // Manager always loads projects, QA/Dev only when not in a project
    const shouldLoadProjects = hasRole('manager') || (!projectId && !hasRole('admin'));

    if (shouldLoadProjects) {
      const loadProjects = async () => {
        try {
          // DEV role: filter by assigned bugs only
          const filterByUser = hasRole('dev') ? user?.email : undefined;
          const projects = await projectApi.getAll(filterByUser);
          setAllProjects(projects);
        } catch (error) {
          console.error('Error loading projects in sidebar:', error);
          setAllProjects([]);
        }
      };
      loadProjects();
    } else {
      setAllProjects([]);
    }
  }, [projectId, user?.role, user?.email]);

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
            ) : hasRole('admin') ? (
              <p className={`${bodySmall.className} text-white/70 mt-1`}>
                Administración
              </p>
            ) : hasRole('manager') ? (
              <p className={`${bodySmall.className} text-white/70 mt-1`}>
                Métricas
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

      {/* Navigation */}
      {hasRole('admin') || (projectId && projectId !== '') || hasRole('manager') ? (
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

          {/* Projects section for Manager - Collapsible */}
          {hasRole('manager') && allProjects.length > 0 && !sidebarCollapsed && (
            <div className="px-4 pb-4">
              {/* Collapsible header */}
              <button
                onClick={() => setProjectsExpanded(!projectsExpanded)}
                className="w-full flex items-center justify-between py-3 border-b border-white/10 hover:bg-white/5 rounded-t-lg transition-colors"
              >
                <h3 className={`${bodySmall.className} font-semibold text-white/70 uppercase tracking-wider`}>
                  📁 Proyectos ({allProjects.length})
                </h3>
                {projectsExpanded ? (
                  <ChevronDown size={16} className="text-white/70" />
                ) : (
                  <ChevronRight size={16} className="text-white/70" />
                )}
              </button>

              {/* Projects list */}
              {projectsExpanded && (
                <nav className="pt-2 space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
                  {allProjects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}/dashboard`}
                      onClick={() => handleProjectClick(project)}
                      className={`block p-2.5 ${borderRadius.lg} ${
                        currentProject?.id === project.id
                          ? 'bg-white/20 border border-white/30'
                          : 'hover:bg-purple-600/20'
                      } transition-all duration-200 group text-white`}
                    >
                      <div className={`text-sm font-medium truncate group-hover:text-white/95`}>
                        {project.name}
                      </div>
                      <div className={`text-xs text-white/60 group-hover:text-white/80 mt-0.5 flex items-center gap-2`}>
                        <span>{project.test_coverage.toFixed(0)}%</span>
                        {project.total_bugs > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-red-300">{project.total_bugs} bugs</span>
                          </>
                        )}
                      </div>
                    </Link>
                  ))}
                </nav>
              )}
            </div>
          )}

          {/* Settings and Back (only for QA/Dev in projects) */}
          {projectId && !hasRole('admin', 'manager') && (
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
          )}
        </>
      ) : (
        // When viewing all projects - show list (only for QA/Dev)
        <div className="flex-1 flex flex-col overflow-hidden">
          {!sidebarCollapsed ? (
            <>
              <div className="p-4 border-b border-white/10">
                <h3 className={`${bodySmall.className} font-semibold text-white/70 uppercase tracking-wider`}>
                  {hasRole('dev') ? 'Mis Proyectos (con bugs)' : 'Mis Proyectos'}
                </h3>
              </div>
              <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                {allProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}/dashboard`}
                    onClick={() => handleProjectClick(project)}
                    className={`block p-3 ${borderRadius.lg} hover:bg-purple-600/20 hover:scale-105 transition-all duration-200 group text-white`}
                  >
                    <div className={`font-medium truncate group-hover:text-white/95`}>
                      {project.name}
                    </div>
                    <div className={`${bodySmall.className} text-white/60 group-hover:text-white/80 mt-0.5 truncate`}>
                      {project.id} • {project.total_test_cases} tests
                      {hasRole('dev') && project.total_bugs > 0 && ` • ${project.total_bugs} bugs`}
                    </div>
                  </Link>
                ))}
                {allProjects.length === 0 && (
                  <div className={`text-center py-8 text-white/50 ${bodySmall.className}`}>
                    {hasRole('dev') ? 'No hay proyectos con bugs asignados' : 'No hay proyectos'}
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
