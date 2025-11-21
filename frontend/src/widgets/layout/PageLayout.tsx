/**
 * Page Layout Widget
 * Standard layout wrapper for all pages
 */

import type { ReactNode } from 'react';
import { colors, getTypographyPreset } from '@/shared/design-system/tokens';

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
  const headingLarge = getTypographyPreset('headingLarge');
  const bodySmall = getTypographyPreset('bodySmall');

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className={`${headingLarge.className} font-bold ${colors.gray.text900}`}>{title}</h1>
          {description && (
            <p className={`mt-2 ${bodySmall.className} ${colors.gray.text600}`}>{description}</p>
          )}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
};
