/**
 * Header Component
 * Displays contextual information based on current route and user role
 */

import { useState } from 'react';
import { useAuth } from '@/app/providers';
import { Link, useNavigate } from 'react-router-dom';
import { colors, borderRadius, getTypographyPreset } from '@/shared/design-system/tokens';
import { LogOut, Users } from 'lucide-react';
import { useHeaderContext } from './lib/useHeaderContext';

export const Header = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const headerContext = useHeaderContext();

  const bodySmall = getTypographyPreset('bodySmall');
  const headingMedium = getTypographyPreset('headingMedium');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: 'Administrador',
      qa: 'QA Engineer',
      dev: 'Desarrollador',
      manager: 'Project Manager',
    };
    return roleMap[role] || role;
  };

  return (
    <header className={`${colors.white} shadow-sm border-b ${colors.gray.border200} px-6 py-4`}>
      <div className="flex items-center justify-between">
        {/* Dynamic header content based on route and role */}
        <div>
          {/* Breadcrumbs (only show when relevant) */}
          {headerContext.showBreadcrumbs && headerContext.breadcrumbs.length > 0 && (
            <div className={`flex items-center gap-2 ${bodySmall.className} ${colors.gray.text500} mb-1`}>
              {headerContext.breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {crumb.link ? (
                    <Link to={crumb.link} className="hover:text-blue-600 transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={`${colors.gray.text900} font-medium`}>{crumb.label}</span>
                  )}
                  {index < headerContext.breadcrumbs.length - 1 && <span>›</span>}
                </div>
              ))}
            </div>
          )}

          {/* Title */}
          <h2 className={`${headingMedium.className} font-bold ${colors.gray.text900} flex items-center gap-2`}>
            {headerContext.icon && <span>{headerContext.icon}</span>}
            <span>{headerContext.title}</span>
          </h2>

          {/* Subtitle */}
          <p className={`${bodySmall.className} ${colors.gray.text600}`}>
            {headerContext.subtitle}
          </p>
        </div>

        {/* User menu */}
        <div className="flex items-center gap-4 relative">
          {/* Admin Link - Only for ADMIN users */}
          {hasRole('admin') && (
            <Link
              to="/admin/users"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Users className="w-4 h-4" />
              Usuarios
            </Link>
          )}

          {/* User avatar and menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center gap-3 p-2 ${borderRadius.lg} hover:bg-gray-100 transition-colors cursor-pointer`}
            >
              <div className={`w-10 h-10 bg-gradient-to-r from-primary-blue to-primary-purple ${borderRadius.full} flex items-center justify-center ${colors.white} font-bold text-sm`}>
                {user ? getInitials(user.full_name) : 'U'}
              </div>
              <div className={bodySmall.className}>
                <p className={`font-medium ${colors.gray.text900}`}>{user?.full_name || 'Usuario'}</p>
                <p className={colors.gray.text600}>{user ? getRoleDisplay(user.role) : 'N/A'}</p>
              </div>
              <span className={colors.gray.text400}>▼</span>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                    <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        user?.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user?.role === 'qa' ? 'bg-green-100 text-green-800' :
                        user?.role === 'dev' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user?.role.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
