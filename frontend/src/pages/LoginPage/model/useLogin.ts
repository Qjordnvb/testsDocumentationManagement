/**
 * Login Page Business Logic
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import { authApi } from '@/entities/user';

type LoginStep = 'email' | 'register' | 'password' | 'access-denied';

export const useLogin = () => {
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
        setCurrentStep('access-denied');
      } else if (!response.is_registered) {
        setCurrentStep('register');
      } else {
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
   * Step 2a: Complete registration
   */
  const handleRegister = async (userFullName: string, password: string) => {
    setError('');
    setIsLoading(true);

    try {
      await register({ email, password, full_name: userFullName });
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || 'Error al completar el registro');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 2b: Login with password
   */
  const handleLogin = async (password: string) => {
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
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

  return {
    currentStep,
    email,
    fullName,
    error,
    isLoading,
    handleEmailSubmit,
    handleRegister,
    handleLogin,
    handleBack,
  };
};
