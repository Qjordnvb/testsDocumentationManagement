/**
 * ScenarioList Component - Design System
 * Reusable list of ScenarioCards with bulk actions
 *
 * Eliminates ~80 lines of duplicated code from TestRunnerModal and ExecutionDetailsModal
 * Fully uses design system tokens for consistent styling
 */

import { useState, Children, cloneElement, isValidElement } from 'react';
import type { ReactElement } from 'react';
import { ChevronsDown, ChevronsUp } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import {
  getComponentSpacing,
  getTypographyPreset,
  colors,
  gap,
} from '@/shared/design-system/tokens';
import type { ScenarioCardProps } from './ScenarioCard';

export interface ScenarioListProps {
  // Children should be ScenarioCard components
  children: ReactElement<ScenarioCardProps> | ReactElement<ScenarioCardProps>[];

  // Title
  title?: string;
  subtitle?: string;

  // Bulk Actions
  showExpandCollapseAll?: boolean;
  defaultAllExpanded?: boolean;

  // Layout
  className?: string;
}

export const ScenarioList = ({
  children,
  title,
  subtitle,
  showExpandCollapseAll = true,
  defaultAllExpanded = false,
  className = '',
}: ScenarioListProps) => {
  const [allExpanded, setAllExpanded] = useState(defaultAllExpanded);

  // Get design tokens
  const spacing = getComponentSpacing('pageSection');
  const titleTypography = getTypographyPreset('h4');
  const subtitleTypography = getTypographyPreset('bodySmall');

  // Handle Expand/Collapse All
  const handleExpandCollapseAll = () => {
    setAllExpanded(!allExpanded);
  };

  // Clone children to pass down expanded state
  const childrenWithProps = Children.map(children, (child) => {
    if (isValidElement<ScenarioCardProps>(child)) {
      return cloneElement(child, {
        ...child.props,
        defaultExpanded: allExpanded,
        key: child.key || child.props.scenarioName,
      });
    }
    return child;
  });

  return (
    <div className={`${spacing.margin} ${className}`}>
      {/* Header */}
      {(title || showExpandCollapseAll) && (
        <div className="flex items-center justify-between mb-4">
          {/* Title & Subtitle */}
          <div>
            {title && (
              <h3 className={`${titleTypography.className} ${colors.gray.text900} mb-1`}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className={`${subtitleTypography.className} ${colors.gray.text600}`}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Expand/Collapse All Button */}
          {showExpandCollapseAll && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExpandCollapseAll}
              leftIcon={allExpanded ? <ChevronsUp className="w-4 h-4" /> : <ChevronsDown className="w-4 h-4" />}
            >
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </Button>
          )}
        </div>
      )}

      {/* Scenario Cards */}
      <div className={`flex flex-col ${gap.md}`}>
        {childrenWithProps}
      </div>

      {/* Empty State */}
      {Children.count(children) === 0 && (
        <div className={`text-center py-12 ${colors.gray[100]} rounded-lg`}>
          <p className={`${subtitleTypography.className} ${colors.gray.text500}`}>
            No scenarios to display
          </p>
        </div>
      )}
    </div>
  );
};

// Export for convenience
export default ScenarioList;
