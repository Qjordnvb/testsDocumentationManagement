/**
 * Login Page
 * Multi-step authentication page with invitation-based registration
 *
 * Flow:
 * 1. User enters email → POST /auth/check-email
 * 2a. Email not in whitelist → Access Denied
 * 2b. Email in whitelist but not registered → Registration Form
 * 2c. Email in whitelist and registered → Password Login
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import { authApi } from '@/entities/user';
import { LogIn } from 'lucide-react';
import {
  LoginEmailStep,
  RegisterStep,
  LoginPasswordStep,
  AccessDeniedPage,
} from '@/features/authentication';

type LoginStep = 'email' | 'register' | 'password' | 'access-denied';

export const LoginPage = () => {
  const [currentStep, setCurrentStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the page user was trying to access (or default to dashboard)
  const from = (location.state as any)?.from?.pathname || '/';

  /**
   * Step 1: Check email status
   */
  const handleEmailSubmit = async (submittedEmail: string) => {
    setEmail(submittedEmail);
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.checkEmail({ email: submittedEmail });

      if (!response.exists) {
        // Email not in whitelist → Access Denied
        setCurrentStep('access-denied');
      } else if (!response.is_registered) {
        // Email in whitelist but not registered → Registration Form
        setCurrentStep('register');
      } else {
        // Email in whitelist and registered → Password Login
        setFullName(response.full_name || '');
        setCurrentStep('password');
      }
    } catch (err: any) {
      console.error('Check email error:', err);
      setError(err.response?.data?.detail || 'Error al verificar el email');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 2a: Complete registration (invited user sets password)
   */
  const handleRegister = async (userFullName: string, password: string) => {
    setError('');
    setIsLoading(true);

    try {
      await register({
        email,
        password,
        full_name: userFullName,
      });

      // Auto-login after registration (AuthContext handles token storage)
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || 'Error al completar el registro');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 2b: Login with password (registered user)
   */
  const handleLogin = async (password: string) => {
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });

      // Redirect to the page they were trying to access
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Email o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Go back to email step
   */
  const handleBack = () => {
    setCurrentStep('email');
    setEmail('');
    setFullName('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <LogIn className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            QA Documentation System
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {currentStep === 'email' && 'Inicia sesión para continuar'}
            {currentStep === 'register' && 'Completa tu registro'}
            {currentStep === 'password' && 'Bienvenido de vuelta'}
            {currentStep === 'access-denied' && 'Acceso Denegado'}
          </p>
        </div>

        {/* Multi-Step Form */}
        {currentStep === 'email' && (
          <LoginEmailStep
            onNext={handleEmailSubmit}
            isLoading={isLoading}
            error={error}
          />
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

        {currentStep === 'access-denied' && (
          <AccessDeniedPage email={email} onBack={handleBack} />
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          © 2025 QA Documentation System. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};
