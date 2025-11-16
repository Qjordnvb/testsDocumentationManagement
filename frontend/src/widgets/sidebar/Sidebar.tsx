/**
 * Sidebar Navigation Component (project-scoped)
 */

import { Link, useLocation, useParams } from 'react-router-dom';
import { useProject } from '@/app/providers/ProjectContext';
import { useAppStore } from '@/app/providers/appStore';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export const Sidebar = () => {
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProject();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

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

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-primary-blue to-primary-purple text-white transition-all duration-300 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        {!sidebarCollapsed && (
          <div>
            <h1 className="text-2xl font-bold">🎯 QA Flow</h1>
            {currentProject && (
              <p className="text-xs text-white/70 mt-1 truncate">
                {currentProject.name}
              </p>
            )}
          </div>
        )}
        {sidebarCollapsed && <span className="text-2xl">🎯</span>}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
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

      {/* Settings and Home at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 space-y-2">
        {projectId && (
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
        )}
        <Link
          to="/"
          className={`sidebar-link ${sidebarCollapsed ? 'justify-center' : ''}`}
          title={sidebarCollapsed ? 'All Projects' : undefined}
        >
          <span className="text-xl">🏠</span>
          {!sidebarCollapsed && <span className="font-medium">All Projects</span>}
        </Link>
      </div>
    </aside>
  );
};
