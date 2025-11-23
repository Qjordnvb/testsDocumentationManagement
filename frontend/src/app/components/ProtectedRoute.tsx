/**
 * Protected Route Component
 * Wraps routes that require authentication and optionally specific roles
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import type { Role } from '@/entities/user';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: Role[];
  excludeRoles?: Role[]; // Roles that are NOT allowed to access this route
}

export const ProtectedRoute = ({ children, requiredRoles, excludeRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user's role is excluded from this route
  if (excludeRoles && excludeRoles.length > 0) {
    if (hasRole(...excludeRoles)) {
      // Redirect excluded roles to home
      return <Navigate to="/" replace />;
    }
  }

  // Check role requirements if specified
  if (requiredRoles && requiredRoles.length > 0) {
    if (!hasRole(...requiredRoles)) {
      // Redirect to forbidden page or home if user doesn't have required role
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
              <p className="text-gray-600 mb-6">
                No tienes permisos suficientes para acceder a esta página.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Roles requeridos: <span className="font-mono font-semibold">{requiredRoles.join(', ')}</span>
              </p>
              <Navigate to="/" replace />
            </div>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and has required role (if specified)
  return <>{children}</>;
};
