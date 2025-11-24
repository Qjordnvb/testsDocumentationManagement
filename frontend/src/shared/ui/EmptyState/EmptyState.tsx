/**
 * EmptyState Component
 * Reusable empty state with icon, message, and optional action
 *
 * Usage:
 * <EmptyState
 *   icon={<Users />}
 *   message="No hay usuarios registrados"
 *   action={<Button>Crear Usuario</Button>}
 * />
 */

import type { FC, ReactNode } from 'react';

export interface EmptyStateProps {
  /**
   * Icon to display (lucide-react icon or custom)
   */
  icon?: ReactNode;

  /**
   * Emoji illustration (displayed larger than icon)
   * @example "🎉"
   */
  emoji?: string;

  /**
   * Main message
   */
  message: string;

  /**
   * Optional description/subtitle
   */
  description?: string;

  /**
   * Motivational subtitle (displayed with accent color)
   */
  motivation?: string;

  /**
   * Optional action button or element
   */
  action?: ReactNode;

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional CSS classes for container
   */
  className?: string;
}

const sizeClasses = {
  sm: {
    container: 'py-8',
    icon: 'w-12 h-12',
    emoji: 'text-5xl',
    message: 'text-base',
    description: 'text-sm',
    motivation: 'text-sm',
  },
  md: {
    container: 'py-12',
    icon: 'w-16 h-16',
    emoji: 'text-6xl',
    message: 'text-lg',
    description: 'text-base',
    motivation: 'text-base',
  },
  lg: {
    container: 'py-16',
    icon: 'w-20 h-20',
    emoji: 'text-7xl',
    message: 'text-xl',
    description: 'text-lg',
    motivation: 'text-lg',
  },
};

export const EmptyState: FC<EmptyStateProps> = ({
  icon,
  emoji,
  message,
  description,
  motivation,
  action,
  size = 'md',
  className = '',
}) => {
  const classes = sizeClasses[size];

  return (
    <div className={`text-center ${classes.container} ${className}`}>
      {/* Emoji takes precedence over icon */}
      {emoji ? (
        <div className={`${classes.emoji} mb-4 animate-bounce-subtle`}>
          {emoji}
        </div>
      ) : icon ? (
        <div className={`inline-flex items-center justify-center ${classes.icon} text-gray-400 mb-4`}>
          {icon}
        </div>
      ) : null}

      <p className={`${classes.message} font-semibold text-gray-900 mb-2`}>
        {message}
      </p>

      {description && (
        <p className={`${classes.description} text-gray-600 mb-3 max-w-md mx-auto`}>
          {description}
        </p>
      )}

      {motivation && (
        <p className={`${classes.motivation} font-medium text-blue-600 mb-6 max-w-md mx-auto`}>
          {motivation}
        </p>
      )}

      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
};
