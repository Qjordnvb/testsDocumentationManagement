/**
 * Card Component - Design System
 * Reusable container with consistent styling
 */

import type { ReactNode, HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const variantClasses = {
  default: 'bg-white shadow-md',
  bordered: 'bg-white border-2 border-gray-200',
  elevated: 'bg-white shadow-xl',
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  hover = true,
  className = '',
  ...props
}: CardProps) => {
  return (
    <div
      className={`
        rounded-xl transition-all duration-200
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${hover ? 'hover:shadow-lg' : ''}
        ${className}
      `}
      {...props}
    >
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
