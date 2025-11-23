/**
 * FormGroup Component
 * Wrapper for form fields with label, input/children, error message, and help text
 *
 * Usage:
 * <FormGroup label="Email" error="Invalid email">
 *   <Input type="email" />
 * </FormGroup>
 *
 * <FormGroup label="Password" required helpText="Must be at least 8 characters">
 *   <Input type="password" />
 * </FormGroup>
 */

import type { FC, ReactNode } from 'react';
import { FormLabel } from '../FormLabel';
import { FormError } from '../FormError';

export interface FormGroupProps {
  /**
   * Label text
   */
  label?: string;

  /**
   * Associated input ID (for accessibility)
   */
  htmlFor?: string;

  /**
   * Show required indicator on label
   * @default false
   */
  required?: boolean;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Help text to display below input
   */
  helpText?: string;

  /**
   * Disable the entire group
   * @default false
   */
  disabled?: boolean;

  /**
   * Input/content element(s)
   */
  children: ReactNode;

  /**
   * Additional CSS classes for container
   */
  className?: string;
}

export const FormGroup: FC<FormGroupProps> = ({
  label,
  htmlFor,
  required = false,
  error,
  helpText,
  disabled = false,
  children,
  className = '',
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <FormLabel
          htmlFor={htmlFor}
          required={required}
          disabled={disabled}
        >
          {label}
        </FormLabel>
      )}

      <div className="relative">
        {children}
      </div>

      {error && (
        <FormError message={error} variant="inline" />
      )}

      {!error && helpText && (
        <p className="mt-1 text-xs text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
};
