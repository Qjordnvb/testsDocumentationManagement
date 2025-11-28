/**
 * LoginPasswordStep Component
 * Password input for registered users
 *
 * Uses centralized design system components and tokens
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { LogIn, AlertCircle, Eye, EyeOff, Sparkles, Lock } from 'lucide-react';
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

interface LoginPasswordStepProps {
  email: string;
  fullName: string;
  onLogin: (password: string) => void;
  onBack: () => void;
  isLoading?: boolean;
  error?: string;
}

export const LoginPasswordStep = ({
  email,
  fullName,
  onLogin,
  onBack,
  isLoading = false,
  error,
}: LoginPasswordStepProps) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    onLogin(password);
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

          {/* Welcome Message */}
          <div>
            <h3 className={`${h3Typography.className} ${colors.gray.text900} ${margin.bSm}`}>
              ¡Bienvenido de vuelta, {fullName}!
            </h3>
            <p className={`${bodySmallTypography.className} ${colors.gray.text600} mb-1`}>
              Ingresa tu contraseña para continuar
            </p>
            <p className={`text-sm ${colors.gray.text500} flex items-center ${gap.xs}`}>
              <span className={`inline-block w-1 h-1 ${colors.gray[400]} ${borderRadius.full}`}></span>
              Paso 2 de 2: autenticación final.
            </p>
            <div className={`mt-3 flex items-center ${gap.sm} text-sm ${colors.gray.text600} ${colors.gray[50]} ${borderRadius.md} ${padding.xSm}`}>
              <span className="font-medium">Email:</span>
              <span className="font-mono">{email}</span>
            </div>
          </div>

          {/* Password Input */}
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            autoFocus
            leftIcon={<Lock className="h-5 w-5" />}
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
              disabled={isLoading || !password.trim()}
              isLoading={isLoading}
              leftIcon={!isLoading ? <LogIn className="w-5 h-5" /> : undefined}
              className="flex-1"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </div>
        </form>
      </Card>
    </AuthLayout>
  );
};
