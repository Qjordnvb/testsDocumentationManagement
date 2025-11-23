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
   * Main message
   */
  message: string;

  /**
   * Optional description/subtitle
   */
  description?: string;

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
    message: 'text-base',
    description: 'text-sm',
  },
  md: {
    container: 'py-12',
    icon: 'w-16 h-16',
    message: 'text-lg',
    description: 'text-base',
  },
  lg: {
    container: 'py-16',
    icon: 'w-20 h-20',
    message: 'text-xl',
    description: 'text-lg',
  },
};

export const EmptyState: FC<EmptyStateProps> = ({
  icon,
  message,
  description,
  action,
  size = 'md',
  className = '',
}) => {
  const classes = sizeClasses[size];

  return (
    <div className={`text-center ${classes.container} ${className}`}>
      {icon && (
        <div className={`inline-flex items-center justify-center ${classes.icon} text-gray-400 mb-4`}>
          {icon}
        </div>
      )}

      <p className={`${classes.message} font-medium text-gray-900 mb-2`}>
        {message}
      </p>

      {description && (
        <p className={`${classes.description} text-gray-500 mb-6 max-w-md mx-auto`}>
          {description}
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
