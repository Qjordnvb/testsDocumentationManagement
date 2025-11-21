/**
 * Button Component - Design System
 * Reusable button with multiple variants and sizes
 *
 * Now uses centralized design tokens from @/shared/design-system/tokens
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import {
  getButtonVariantClasses,
  getComponentSpacing,
  getComponentShadow,
  getShadowTransition,
  borderRadius,
} from '@/shared/design-system/tokens';
import type { ButtonVariant } from '@/shared/design-system/tokens';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  // Get design tokens
  const variantClasses = getButtonVariantClasses(variant);
  const sizeMap = {
    sm: 'buttonSmall',
    md: 'buttonMedium',
    lg: 'buttonLarge',
  };
  const spacing = getComponentSpacing(sizeMap[size]);
  const shadow = getComponentShadow('button');
  const transition = getShadowTransition('default');

  // Base classes
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium ${borderRadius.lg}
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
  `.replace(/\s+/g, ' ').trim();

  // Combined classes
  const combinedClasses = `
    ${baseClasses}
    ${variantClasses}
    ${spacing.padding}
    ${spacing.gap}
    ${shadow.base}
    ${transition}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <button
      className={combinedClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};
