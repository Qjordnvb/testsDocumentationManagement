/**
 * LoadingSpinner Component
 * Centralized loading spinner with multiple variants
 *
 * Usage:
 * <LoadingSpinner /> // Default spinner (medium size)
 * <LoadingSpinner size="sm" /> // Small spinner
 * <LoadingSpinner size="lg" variant="dots" /> // Large dots spinner
 * <LoadingSpinner variant="icon" color="text-green-600" /> // Icon spinner with custom color
 */

import { Loader2 } from 'lucide-react';
import type { FC } from 'react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'border' | 'dots' | 'icon' | 'emoji';

export interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   * @default 'md'
   */
  size?: SpinnerSize;

  /**
   * Visual variant of the spinner
   * @default 'border'
   */
  variant?: SpinnerVariant;

  /**
   * Color class for the spinner (Tailwind text-* class)
   * @default 'text-blue-600'
   */
  color?: string;

  /**
   * Optional label displayed below the spinner
   */
  label?: string;

  /**
   * Center the spinner in its container
   * @default false
   */
  center?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

const sizeClasses: Record<SpinnerSize, { spinner: string; emoji: string; icon: string }> = {
  xs: { spinner: 'h-4 w-4', emoji: 'text-2xl', icon: 'w-4 h-4' },
  sm: { spinner: 'h-6 w-6', emoji: 'text-3xl', icon: 'w-5 h-5' },
  md: { spinner: 'h-8 w-8', emoji: 'text-4xl', icon: 'w-6 h-6' },
  lg: { spinner: 'h-12 w-12', emoji: 'text-6xl', icon: 'w-8 h-8' },
  xl: { spinner: 'h-16 w-16', emoji: 'text-8xl', icon: 'w-12 h-12' },
};

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'border',
  color = 'text-blue-600',
  label,
  center = false,
  className = '',
}) => {
  const renderSpinner = () => {
    switch (variant) {
      case 'border':
        return (
          <div
            className={`animate-spin rounded-full border-b-2 ${sizeClasses[size].spinner} ${color.replace('text-', 'border-')} ${className}`}
            role="status"
            aria-label={label || 'Loading'}
          />
        );

      case 'dots':
        return (
          <svg
            className={`animate-spin ${sizeClasses[size].icon} ${color} ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            role="status"
            aria-label={label || 'Loading'}
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );

      case 'icon':
        return (
          <Loader2
            className={`animate-spin ${sizeClasses[size].icon} ${color} ${className}`}
            role="status"
            aria-label={label || 'Loading'}
          />
        );

      case 'emoji':
        return (
          <div
            className={`animate-spin ${sizeClasses[size].emoji} ${className}`}
            role="status"
            aria-label={label || 'Loading'}
          >
            ⚙️
          </div>
        );

      default:
        return null;
    }
  };

  const spinnerElement = renderSpinner();

  if (center) {
    return (
      <div className="flex flex-col items-center justify-center">
        {spinnerElement}
        {label && (
          <p className={`mt-4 ${color} font-medium`}>{label}</p>
        )}
      </div>
    );
  }

  if (label) {
    return (
      <div className="inline-flex flex-col items-center">
        {spinnerElement}
        <p className={`mt-2 text-sm ${color}`}>{label}</p>
      </div>
    );
  }

  return spinnerElement;
};
