/**
 * RegisterStep Component
 * Registration form for invited users to set their password
 *
 * Uses centralized design system components and tokens
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { UserPlus, AlertCircle, Eye, EyeOff, CheckCircle2, Sparkles } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Input } from '@/shared/ui/Input/Input';
import { Button } from '@/shared/ui/Button/Button';
import { Badge } from '@/shared/ui/Badge/Badge';
import { Card } from '@/shared/ui/Card/Card';
import {
  colors,
  padding,
  gap,
  borderRadius,
  getTypographyPreset,
  margin,
} from '@/shared/design-system/tokens';

interface RegisterStepProps {
  email: string;
  onRegister: (fullName: string, password: string) => void;
  onBack: () => void;
  isLoading?: boolean;
  error?: string;
}

export const RegisterStep = ({ email, onRegister, onBack, isLoading = false, error }: RegisterStepProps) => {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const passwordValid = password.length >= 8;
  const formValid = fullName.trim() && passwordValid && passwordsMatch;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formValid) return;
    onRegister(fullName.trim(), password);
  };

  const h3Typography = getTypographyPreset('h3');
  const bodySmallTypography = getTypographyPreset('bodySmall');

  return (
    <AuthLayout>
      <Card variant="default" padding="lg">
        {/* Card Header */}
        <div className={`flex items-center justify-between ${margin.bMd}`}>
          <div className={`flex items-center ${gap.sm}`}>
            <div className={`h-8 w-8 ${borderRadius.lg} ${colors.brand.secondary[100]} flex items-center justify-center`}>
              <Sparkles className={`h-5 w-5 ${colors.brand.secondary.text600}`} />
            </div>
            <span className={`${colors.gray.text700} font-medium text-sm`}>Ingreso al Sistema QA</span>
          </div>
          <Badge variant="default" size="sm">
            Entorno: Producción
          </Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className={`${colors.status.error[50]} border ${colors.status.error.border200} ${borderRadius.lg} ${padding.sm} flex items-start`}>
              <AlertCircle className={`h-5 w-5 ${colors.status.error.text600} mt-0.5 mr-3 flex-shrink-0`} />
              <div className={`text-sm ${colors.status.error.text700}`}>{error}</div>
            </div>
          )}

          {/* Success Message */}
          <div className={`${colors.status.success[50]} border ${colors.status.success.border200} ${borderRadius.md} ${padding.sm} flex items-start`}>
            <CheckCircle2 className={`h-5 w-5 ${colors.status.success.text600} mt-0.5 mr-3 flex-shrink-0`} />
            <div className={`text-sm ${colors.status.success.text700}`}>
              <p className="font-medium mb-1">¡Email verificado!</p>
              <p>
                El email <span className="font-mono font-semibold">{email}</span> tiene una invitación pendiente.
                Completa tu registro para acceder al sistema.
              </p>
            </div>
          </div>

          {/* Title */}
          <div>
            <h3 className={`${h3Typography.className} ${colors.gray.text900} ${margin.bSm}`}>
              Completa tu Registro
            </h3>
            <p className={`${bodySmallTypography.className} ${colors.gray.text600} mb-1`}>
              Crea tu contraseña para acceder al sistema
            </p>
            <p className={`text-sm ${colors.gray.text500} flex items-center ${gap.xs}`}>
              <span className={`inline-block w-1 h-1 ${colors.gray[400]} ${borderRadius.full}`}></span>
              Paso 2 de 2: completa tu información personal.
            </p>
          </div>

          {/* Full Name Input */}
          <Input
            id="fullName"
            type="text"
            label="Nombre Completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            autoFocus
            placeholder="Juan Pérez"
            disabled={isLoading}
          />

          {/* Password Input */}
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={isLoading}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`${colors.gray.text400} hover:${colors.gray.text600}`}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            }
            helpText="Mínimo 8 caracteres"
          />

          {/* Confirm Password Input */}
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirmar Contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={isLoading}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`${colors.gray.text400} hover:${colors.gray.text600}`}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            }
            error={confirmPassword && !passwordsMatch ? 'Las contraseñas no coinciden' : undefined}
          />

          {/* Action Buttons */}
          <div className={`flex ${gap.md} pt-4`}>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={onBack}
              disabled={isLoading}
              className="flex-1"
            >
              Volver
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading || !formValid}
              isLoading={isLoading}
              leftIcon={!isLoading ? <UserPlus className="w-5 h-5" /> : undefined}
              className="flex-1"
            >
              {isLoading ? 'Registrando...' : 'Completar Registro'}
            </Button>
          </div>
        </form>
      </Card>
    </AuthLayout>
  );
};
