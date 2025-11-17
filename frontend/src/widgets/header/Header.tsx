/**
 * Header Component
 */

import { useProject } from '@/app/providers/ProjectContext';
import { Link } from 'react-router-dom';

export const Header = () => {
  const { currentProject } = useProject();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Project name with breadcrumb */}
        <div>
          {currentProject ? (
            // When inside a project - show breadcrumb
            <>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Link to="/" className="hover:text-primary-blue transition-colors">
                  📁 Todos los Proyectos
                </Link>
                <span>›</span>
                <span className="text-gray-900 font-medium">{currentProject.name}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {currentProject.name}
              </h2>
              <p className="text-sm text-gray-600">
                {currentProject.id} • QA Documentation Management
              </p>
            </>
          ) : (
            // When in projects list - clear title
            <>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>📁</span>
                <span>Mis Proyectos QA</span>
              </h2>
              <p className="text-sm text-gray-600">
                Gestiona todos tus proyectos de testing
              </p>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            aria-label="Notifications"
          >
            <span className="text-xl">🔔</span>
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User avatar */}
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-blue to-primary-purple rounded-full flex items-center justify-center text-white font-bold">
              JD
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">Jordan</p>
              <p className="text-gray-600">QA Engineer</p>
            </div>
            <span className="text-gray-400">▼</span>
          </div>
        </div>
      </div>
    </header>
  );
};
