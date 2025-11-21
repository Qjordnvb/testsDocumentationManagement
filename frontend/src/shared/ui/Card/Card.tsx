/**
 * Card Component - Design System
 * Reusable container with consistent styling
 *
 * Now uses centralized design tokens from @/shared/design-system/tokens
 * Supports status-based styling for scenario cards
 */

import type { ReactNode, HTMLAttributes } from 'react';
import {
  getComponentSpacing,
  getComponentShadow,
  getShadowTransition,
  getStatusClasses,
  borderRadius,
} from '@/shared/design-system/tokens';
import type { ExecutionStatus } from '@/shared/design-system/tokens';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  status?: ExecutionStatus; // NEW: Status-based styling
}

export const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  hover = true,
  status,
  className = '',
  ...props
}: CardProps) => {
  // Get design tokens
  const paddingMap = {
    none: 'cardSmall',
    sm: 'cardSmall',
    md: 'cardMedium',
    lg: 'cardLarge',
  };
  const spacing = getComponentSpacing(padding === 'none' ? 'cardSmall' : paddingMap[padding]);

  const shadowVariantMap = {
    default: 'card',
    bordered: 'cardBordered',
    elevated: 'cardElevated',
  };
  const shadow = getComponentShadow(shadowVariantMap[variant]);
  const transition = getShadowTransition('default');

  // Get status classes if status is provided
  const statusClasses = status ? getStatusClasses(status) : null;

  // Variant classes
  const variantClasses = {
    default: statusClasses ? statusClasses.background : 'bg-white',
    bordered: `bg-white border-2 ${statusClasses ? statusClasses.border : 'border-gray-200'}`,
    elevated: statusClasses ? statusClasses.background : 'bg-white',
  };

  const combinedClasses = `
    ${borderRadius.xl}
    transition-all duration-200
    ${variantClasses[variant]}
    ${padding !== 'none' ? spacing.padding : ''}
    ${shadow.base}
    ${hover && shadow.hover ? `hover:${shadow.hover}` : ''}
    ${transition}
    ${statusClasses && variant === 'bordered' ? 'border' : ''}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
};

// Card Header
export const CardHeader = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={`mb-4 pb-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

// Card Title
export const CardTitle = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <h3 className={`text-xl font-bold text-gray-900 ${className}`}>
    {children}
  </h3>
);

// Card Content
export const CardContent = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={`text-gray-700 ${className}`}>
    {children}
  </div>
);

// Card Footer
export const CardFooter = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={`mt-4 pt-4 border-t border-gray-200 flex items-center justify-end gap-3 ${className}`}>
    {children}
  </div>
);
