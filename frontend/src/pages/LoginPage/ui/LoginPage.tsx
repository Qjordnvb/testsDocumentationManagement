/**
 * Login Page Main Component
 * Multi-step authentication flow orchestrator
 *
 * Note: This component acts as a pure orchestrator.
 * All UI styling and layout is handled by the individual step components
 * via AuthLayout wrapper.
 */

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

  // Pure orchestration - no UI wrapper needed
  // Each step component already includes AuthLayout
  return (
    <>
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
    </>
  );
};
