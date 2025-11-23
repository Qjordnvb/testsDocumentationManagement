/**
 * FormError Component
 * Consistent error message display for forms
 *
 * Usage:
 * <FormError message="Email is required" />
 * <FormError message="Invalid password" size="sm" />
 * <FormError message="Server error" variant="alert" />
 */

import { AlertCircle, XCircle } from 'lucide-react';
import type { FC } from 'react';

export type FormErrorSize = 'xs' | 'sm' | 'md';
export type FormErrorVariant = 'inline' | 'alert' | 'box';

export interface FormErrorProps {
  /**
   * Error message to display
   */
  message: string;

  /**
   * Size of the error message
   * @default 'sm'
   */
  size?: FormErrorSize;

  /**
   * Visual variant
   * @default 'inline'
   */
  variant?: FormErrorVariant;

  /**
   * Show icon
   * @default true for 'alert' and 'box', false for 'inline'
   */
  showIcon?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

const sizeClasses: Record<FormErrorSize, { text: string; icon: string }> = {
  xs: { text: 'text-xs', icon: 'w-3 h-3' },
  sm: { text: 'text-sm', icon: 'w-4 h-4' },
  md: { text: 'text-base', icon: 'w-5 h-5' },
};

export const FormError: FC<FormErrorProps> = ({
  message,
  size = 'sm',
  variant = 'inline',
  showIcon,
  className = '',
}) => {
  // Default showIcon based on variant
  const shouldShowIcon = showIcon ?? (variant !== 'inline');

  if (!message) return null;

  switch (variant) {
    case 'inline':
      return (
        <p className={`mt-1 ${sizeClasses[size].text} text-red-600 ${className}`}>
          {message}
        </p>
      );

    case 'alert':
      return (
        <div
          className={`flex items-start gap-2 ${sizeClasses[size].text} text-red-700 ${className}`}
          role="alert"
        >
          {shouldShowIcon && (
            <AlertCircle
              className={`${sizeClasses[size].icon} text-red-600 mt-0.5 flex-shrink-0`}
            />
          )}
          <div>{message}</div>
        </div>
      );

    case 'box':
      return (
        <div
          className={`flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-md ${sizeClasses[size].text} text-red-700 ${className}`}
          role="alert"
        >
          {shouldShowIcon && (
            <XCircle
              className={`${sizeClasses[size].icon} text-red-600 flex-shrink-0 mt-0.5`}
            />
          )}
          <div className="flex-1">{message}</div>
        </div>
      );

    default:
      return null;
  }
};
