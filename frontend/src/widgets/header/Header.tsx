/**
 * Header Component
 */

import { useAppStore } from '@/app/providers/appStore';

export const Header = () => {
  const { currentProject } = useAppStore();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Project name */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{currentProject}</h2>
          <p className="text-sm text-gray-600">QA Documentation Management</p>
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
