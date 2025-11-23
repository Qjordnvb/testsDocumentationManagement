/**
 * FormLabel Component
 * Accessible, consistent form labels with optional required indicator
 *
 * Usage:
 * <FormLabel htmlFor="email">Email</FormLabel>
 * <FormLabel htmlFor="password" required>Password</FormLabel>
 * <FormLabel htmlFor="name" size="md">Full Name</FormLabel>
 */

import type { FC, ReactNode } from 'react';

export type FormLabelSize = 'xs' | 'sm' | 'md';

export interface FormLabelProps {
  /**
   * Label text or content
   */
  children: ReactNode;

  /**
   * Associated input ID (for accessibility)
   */
  htmlFor?: string;

  /**
   * Size of the label
   * @default 'sm'
   */
  size?: FormLabelSize;

  /**
   * Show required indicator (*)
   * @default false
   */
  required?: boolean;

  /**
   * Disable label (grayed out)
   * @default false
   */
  disabled?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

const sizeClasses: Record<FormLabelSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
};

export const FormLabel: FC<FormLabelProps> = ({
  children,
  htmlFor,
  size = 'sm',
  required = false,
  disabled = false,
  className = '',
}) => {
  const baseClasses = 'block font-medium mb-1';
  const colorClasses = disabled ? 'text-gray-400' : 'text-gray-700';

  return (
    <label
      htmlFor={htmlFor}
      className={`${baseClasses} ${sizeClasses[size]} ${colorClasses} ${className}`}
    >
      {children}
      {required && (
        <span className="text-red-500 ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  );
};
