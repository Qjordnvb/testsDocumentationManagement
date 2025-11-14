/**
 * Page Layout Widget
 * Standard layout wrapper for all pages
 */

import type { ReactNode } from 'react';

interface PageLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export const PageLayout = ({
  title,
  description,
  actions,
  children,
}: PageLayoutProps) => {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-2 text-sm text-gray-600">{description}</p>
          )}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
};
