/**
 * Sidebar Navigation Component
 */

import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/stories', label: 'User Stories', icon: '📝' },
  { path: '/tests', label: 'Test Cases', icon: '✅' },
  { path: '/bugs', label: 'Bug Reports', icon: '🐛' },
  { path: '/reports', label: 'Reports', icon: '📄' },
];

export const Sidebar = () => {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
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
          <h1 className="text-2xl font-bold">🎯 QA Flow</h1>
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

      {/* Settings at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
        <Link
          to="/settings"
          className={`sidebar-link ${
            isActive('/settings') ? 'sidebar-link-active' : ''
          } ${sidebarCollapsed ? 'justify-center' : ''}`}
          title={sidebarCollapsed ? 'Settings' : undefined}
        >
          <span className="text-xl">⚙️</span>
          {!sidebarCollapsed && <span className="font-medium">Settings</span>}
        </Link>
      </div>
    </aside>
  );
};
