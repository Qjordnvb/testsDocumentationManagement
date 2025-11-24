/**
 * Login Page Main Component
 * Multi-step authentication flow
 */

import { LogIn } from 'lucide-react';
import {
  LoginEmailStep,
  RegisterStep,
  LoginPasswordStep,
  AccessDeniedPage,
} from '@/features/authentication';
import { useLogin } from '../model';

export const LoginPage = () => {
  const {
    currentStep,
    email,
    fullName,
    error,
    isLoading,
    handleEmailSubmit,
    handleRegister,
    handleLogin,
    handleBack,
  } = useLogin();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <LogIn className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">QA Documentation System</h2>
          <p className="mt-2 text-sm text-gray-600">
            {currentStep === 'email' && 'Inicia sesión para continuar'}
            {currentStep === 'register' && 'Completa tu registro'}
            {currentStep === 'password' && 'Bienvenido de vuelta'}
            {currentStep === 'access-denied' && 'Acceso Denegado'}
          </p>
        </div>

        {/* Multi-Step Form */}
        {currentStep === 'email' && (
          <LoginEmailStep onNext={handleEmailSubmit} isLoading={isLoading} error={error} />
        )}

        {currentStep === 'register' && (
          <RegisterStep
            email={email}
            onRegister={handleRegister}
            onBack={handleBack}
            isLoading={isLoading}
            error={error}
          />
        )}

        {currentStep === 'password' && (
          <LoginPasswordStep
            email={email}
            fullName={fullName}
            onLogin={handleLogin}
            onBack={handleBack}
            isLoading={isLoading}
            error={error}
          />
        )}

        {currentStep === 'access-denied' && <AccessDeniedPage email={email} onBack={handleBack} />}

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          © 2025 QA Documentation System. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};
