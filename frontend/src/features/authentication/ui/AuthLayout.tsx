/**
 * AuthLayout Component
 * Reutilizable split-screen layout for authentication pages
 * Left side: Branding with gradient background
 * Right side: Form content (children)
 *
 * Uses centralized design tokens from @/shared/design-system/tokens
 */

import type { ReactNode } from 'react';
import {
  colors,
  padding,
  gap,
  borderRadius,
  getTypographyPreset,
} from '@/shared/design-system/tokens';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const h1Typography = getTypographyPreset('h1');
  const bodyLargeTypography = getTypographyPreset('bodyLarge');
  const bodyTypography = getTypographyPreset('body');

  return (
    <div className="min-h-screen grid lg:grid-cols-2 grid-cols-1">
      {/* Left Side - Branding */}
      <div className={`relative ${colors.brand.primary.gradient} ${padding.xl} flex flex-col justify-between lg:block hidden`}>
        {/* Logo and Title */}
        <div className={`space-y-6`}>
          {/* Logo */}
          <div className={`flex items-center ${gap.md}`}>
            <div className={`h-14 w-14 ${borderRadius.full} bg-white/20 backdrop-blur-sm flex items-center justify-center`}>
              <span className={`${colors.textWhite} text-2xl font-bold`}>QA</span>
            </div>
            <span className={`${colors.textWhite} text-2xl font-semibold`}>Sistema QA</span>
          </div>

          {/* Main Title */}
          <h1 className={`${h1Typography.className} ${colors.textWhite} mt-12`}>
            Automatización de QA con IA
          </h1>

          {/* Subtitle */}
          <p className={`text-white/90 ${bodyLargeTypography.className}`}>
            Orquesta pruebas, genera test cases y gestiona bugs en un solo lugar con inteligencia artificial.
          </p>

          {/* Feature Bullets */}
          <div className={`space-y-3 mt-8`}>
            <div className={`flex items-start ${gap.md}`}>
              <div className={`h-6 w-6 ${borderRadius.full} bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className={`${colors.textWhite} text-xs`}>✓</span>
              </div>
              <p className="text-white/90">
                Generación automática de test cases desde user stories.
              </p>
            </div>
            <div className={`flex items-start ${gap.md}`}>
              <div className={`h-6 w-6 ${borderRadius.full} bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className={`${colors.textWhite} text-xs`}>✓</span>
              </div>
              <p className="text-white/90">
                Ejecución guiada, seguimiento de SLAs y evidencia centralizada.
              </p>
            </div>
            <div className={`flex items-start ${gap.md}`}>
              <div className={`h-6 w-6 ${borderRadius.full} bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className={`${colors.textWhite} text-xs`}>✓</span>
              </div>
              <p className="text-white/90">
                Dashboards para Admin, Manager, QA y Dev.
              </p>
            </div>
          </div>
        </div>

        {/* Dark Card with Additional Info */}
        <div className={`bg-white/10 backdrop-blur-md ${borderRadius['2xl']} ${padding.md} mt-12 border border-white/20`}>
          <h3 className={`${colors.textWhite} font-semibold text-lg mb-2`}>Sistema QA</h3>
          <p className={`text-white/90 text-sm font-medium mb-3`}>
            Automatiza tu flujo de aseguramiento de calidad.
          </p>
          <p className={`text-white/80 text-sm ${bodyTypography.lineHeight}`}>
            Conecta proyectos, genera planes de testing y centraliza los resultados en tiempo real.
          </p>
        </div>

        {/* Footer - Roles Pills */}
        <div className="mt-12">
          <p className="text-white/80 text-sm mb-3">
            Acceso basado en invitaciones. Roles soportados:
          </p>
          <div className={`flex flex-wrap ${gap.sm}`}>
            {['Admin', 'Manager', 'QA', 'Dev'].map((role) => (
              <span
                key={role}
                className={`bg-white/20 backdrop-blur-sm ${colors.textWhite} text-xs px-4 py-2 ${borderRadius.full} border border-white/30`}
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form Content */}
      <div className={`${colors.gray[50]} flex items-center justify-center ${padding.md} lg:${padding.xl}`}>
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
};
