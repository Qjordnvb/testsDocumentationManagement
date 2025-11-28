/**
 * LoginEmailStep Component
 * First step of multi-step login flow - email input
 * Paso 1 de 2: Validación de email
 *
 * Uses centralized design system components and tokens
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Mail, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
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

interface LoginEmailStepProps {
  onNext: (email: string) => void;
  isLoading?: boolean;
  error?: string;
}

export const LoginEmailStep = ({ onNext, isLoading = false, error }: LoginEmailStepProps) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onNext(email.trim());
  };

  const h3Typography = getTypographyPreset('h3');
  const bodySmallTypography = getTypographyPreset('bodySmall');

  return (
    <AuthLayout>
      {/* Card Container */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className={`${colors.status.error[50]} border ${colors.status.error.border200} ${borderRadius.lg} ${padding.sm} flex items-start`}>
              <AlertCircle className={`h-5 w-5 ${colors.status.error.text600} mt-0.5 mr-3 flex-shrink-0`} />
              <div className={`text-sm ${colors.status.error.text700}`}>{error}</div>
            </div>
          )}

          {/* Title */}
          <div>
            <h3 className={`${h3Typography.className} ${colors.gray.text900} ${margin.bSm}`}>
              Iniciar Sesión
            </h3>
            <p className={`${bodySmallTypography.className} ${colors.gray.text600} mb-1`}>
              Ingresa tu correo corporativo para continuar.
            </p>
            <p className={`text-sm ${colors.gray.text500} flex items-center ${gap.xs}`}>
              <span className={`inline-block w-1 h-1 ${colors.gray[400]} ${borderRadius.full}`}></span>
              Paso 1 de 2: validaremos tu identidad por email.
            </p>
          </div>

          {/* Email Input */}
          <Input
            id="email"
            type="email"
            label="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
            leftIcon={<Mail className="h-5 w-5" />}
            placeholder="tu@empresa.com"
            disabled={isLoading}
            helpText="Usa el correo al que te llegó la invitación al Sistema QA."
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading || !email.trim()}
            isLoading={isLoading}
            className="w-full"
          >
            {isLoading ? 'Verificando...' : 'Continuar'}
          </Button>
        </form>

        {/* Security Info */}
        <div className={`${margin.tMd} ${padding.tMd} border-t ${colors.gray.border200}`}>
          <div className={`${colors.status.info[50]} ${borderRadius.lg} ${padding.sm}`}>
            <div className={`flex items-start ${gap.md}`}>
              <div className={`h-8 w-8 ${borderRadius.full} ${colors.status.success[100]} flex items-center justify-center flex-shrink-0`}>
                <ShieldCheck className={`h-5 w-5 ${colors.status.success.text600}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${colors.gray.text900} mb-1`}>
                  Información de seguridad
                </p>
                <p className={`text-xs ${colors.gray.text600} ${bodySmallTypography.lineHeight}`}>
                  Solo los correos autorizados pueden acceder. Nunca compartas tu enlace de acceso.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`${margin.tMd} text-center text-sm ${colors.gray.text600}`}>
          ¿Problemas al ingresar?{' '}
          <a href="mailto:soporte@sistema-qa.com" className={`${colors.brand.primary.text600} hover:${colors.brand.primary.text700} font-medium`}>
            Contactar soporte
          </a>
        </div>

        {/* Demo Credentials (Only in development) */}
        {import.meta.env.DEV && (
          <div className={`${margin.tMd} ${padding.tMd} border-t ${colors.gray.border200}`}>
            <p className={`text-xs ${colors.gray.text500} text-center mb-2`}>Credenciales de prueba:</p>
            <div className={`${colors.gray[50]} ${borderRadius.md} ${padding.xSm} text-xs ${colors.gray.text600}`}>
              <div className="flex justify-between">
                <span className="font-medium">Email Admin:</span>
                <span className="font-mono">admin@qa-system.com</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Footer Outside Card */}
      <div className={`${margin.tMd} text-center text-sm ${colors.gray.text600}`}>
        Acceso por invitación. ¿Necesitas una cuenta?{' '}
        <a href="mailto:admin@sistema-qa.com" className={`${colors.brand.primary.text600} hover:${colors.brand.primary.text700} font-medium`}>
          Contacta a tu administrador
        </a>
      </div>
    </AuthLayout>
  );
};
