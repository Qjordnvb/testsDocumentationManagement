/**
 * AccessDeniedPage Component
 * Shown when email is not in whitelist
 *
 * Uses centralized design system components and tokens
 */

import { XCircle, Mail, ShieldX } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
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

interface AccessDeniedPageProps {
  email: string;
  onBack: () => void;
}

export const AccessDeniedPage = ({ email, onBack }: AccessDeniedPageProps) => {
  const h3Typography = getTypographyPreset('h3');
  const bodySmallTypography = getTypographyPreset('bodySmall');

  return (
    <AuthLayout>
      <Card variant="default" padding="lg">
        {/* Card Header */}
        <div className={`flex items-center justify-between ${margin.bMd}`}>
          <div className={`flex items-center ${gap.sm}`}>
            <div className={`h-8 w-8 ${borderRadius.lg} ${colors.status.error[100]} flex items-center justify-center`}>
              <ShieldX className={`h-5 w-5 ${colors.status.error.text600}`} />
            </div>
            <span className={`${colors.gray.text700} font-medium text-sm`}>Ingreso al Sistema QA</span>
          </div>
          <Badge variant="danger" size="sm">
            Acceso Denegado
          </Badge>
        </div>

        <div className="space-y-6">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className={`h-16 w-16 ${colors.status.error[100]} ${borderRadius.full} flex items-center justify-center`}>
              <XCircle className={`h-10 w-10 ${colors.status.error.text600}`} />
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h3 className={`${h3Typography.className} ${colors.gray.text900} ${margin.bSm}`}>
              Acceso Denegado
            </h3>
            <p className={`${bodySmallTypography.className} ${colors.gray.text600}`}>
              El email que ingresaste no tiene permisos para acceder al sistema
            </p>
          </div>

          {/* Email Display */}
          <div className={`${colors.status.error[50]} border ${colors.status.error.border200} ${borderRadius.md} ${padding.sm}`}>
            <div className={`flex items-center ${gap.sm} text-sm ${colors.status.error.text700}`}>
              <Mail className="h-5 w-5 flex-shrink-0" />
              <span className="font-mono font-semibold">{email}</span>
            </div>
            <p className={`mt-2 text-xs ${colors.status.error.text600}`}>
              Este email no se encuentra en la lista de usuarios autorizados
            </p>
          </div>

          {/* Info Box */}
          <div className={`${colors.status.info[50]} border ${colors.status.info.border200} ${borderRadius.md} ${padding.sm}`}>
            <p className={`text-sm ${colors.status.info.text800} font-medium mb-2`}>
              ¿Necesitas acceso?
            </p>
            <p className={`text-xs ${colors.status.info.text700}`}>
              Contacta al administrador del sistema para solicitar una invitación.
              Solo los usuarios invitados pueden acceder al sistema.
            </p>
          </div>

          {/* Action Button */}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onBack}
            className="w-full"
          >
            Intentar con otro email
          </Button>
        </div>
      </Card>

      {/* Footer Outside Card */}
      <div className={`${margin.tMd} text-center text-sm ${colors.gray.text600}`}>
        ¿Necesitas ayuda?{' '}
        <a href="mailto:admin@sistema-qa.com" className={`${colors.brand.primary.text600} hover:${colors.brand.primary.text700} font-medium`}>
          Contactar administrador
        </a>
      </div>
    </AuthLayout>
  );
};
