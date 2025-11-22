/**
 * AccessDeniedPage Component
 * Shown when email is not in whitelist
 */

import { XCircle, Mail } from 'lucide-react';

interface AccessDeniedPageProps {
  email: string;
  onBack: () => void;
}

export const AccessDeniedPage = ({ email, onBack }: AccessDeniedPageProps) => {
  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      <div className="space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Acceso Denegado
          </h3>
          <p className="text-sm text-gray-600">
            El email que ingresaste no tiene permisos para acceder al sistema
          </p>
        </div>

        {/* Email Display */}
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <Mail className="h-5 w-5 flex-shrink-0" />
            <span className="font-mono font-semibold">{email}</span>
          </div>
          <p className="mt-2 text-xs text-red-600">
            Este email no se encuentra en la lista de usuarios autorizados
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800 font-medium mb-2">
            ¿Necesitas acceso?
          </p>
          <p className="text-xs text-blue-700">
            Contacta al administrador del sistema para solicitar una invitación.
            Solo los usuarios invitados pueden acceder al sistema.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onBack}
          className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
        >
          Intentar con otro email
        </button>
      </div>
    </div>
  );
};
