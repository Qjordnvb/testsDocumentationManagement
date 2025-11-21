/**
 * ScenarioCard Component - Design System
 * Reusable card for displaying Gherkin scenarios with execution status
 *
 * Eliminates ~150 lines of duplicated code from TestRunnerModal and ExecutionDetailsModal
 * Fully uses design system tokens for consistent styling
 */

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp, Bug } from 'lucide-react';
import {
  getStatusClasses,
  getScenarioTypography,
  getComponentSpacing,
  getComponentShadow,
  borderRadius,
  colors,
} from '@/shared/design-system/tokens';
import type { ExecutionStatus } from '@/shared/design-system/tokens';

export interface ScenarioCardProps {
  // Scenario Data
  scenarioName: string;
  status: ExecutionStatus;
  tags?: string[];
  description?: string;

  // Steps
  passedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  totalSteps: number;

  // Bugs
  bugCount?: number;
  bugIds?: string[];

  // Expandable Content
  children: ReactNode; // Step execution items
  defaultExpanded?: boolean;

  // Actions
  onReportBug?: () => void;
  showBugButton?: boolean;

  // Styling
  className?: string;
}

export const ScenarioCard = ({
  scenarioName,
  status,
  tags = [],
  description,
  passedSteps,
  failedSteps,
  skippedSteps,
  totalSteps,
  bugCount = 0,
  bugIds = [],
  children,
  defaultExpanded = false,
  onReportBug,
  showBugButton = false,
  className = '',
}: ScenarioCardProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Sync with prop changes (for Expand/Collapse All functionality)
  useEffect(() => {
    setIsExpanded(defaultExpanded);
  }, [defaultExpanded]);

  // Get design tokens
  const statusClasses = getStatusClasses(status);
  const titleTypography = getScenarioTypography('scenarioTitle');
  const metaTypography = getScenarioTypography('scenarioMeta');
  const descriptionTypography = getScenarioTypography('scenarioDescription');
  const spacing = getComponentSpacing('scenarioCard');
  const shadow = getComponentShadow('scenarioCard');

  // Calculate completion percentage
  const completedSteps = passedSteps + failedSteps + skippedSteps;
  const completionPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div
      className={`
        ${borderRadius.lg} border ${shadow.base} overflow-hidden transition-all
        ${statusClasses.background} ${statusClasses.border}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
    >
      {/* Header */}
      <div
        className={`
          flex items-center justify-between cursor-pointer
          ${spacing.padding}
          hover:opacity-90 transition-opacity
        `.replace(/\s+/g, ' ').trim()}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0">
          {/* Scenario Name */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className={`${titleTypography.className} ${statusClasses.text} truncate`}>
              {scenarioName}
            </h3>

            {/* Bug Count Badge */}
            {bugCount > 0 && (
              <span
                className={`
                  flex items-center gap-1 px-2 py-0.5 ${borderRadius.md}
                  ${colors.status.error[100]} ${colors.status.error.text700}
                  ${metaTypography.className} font-semibold
                  border ${colors.status.error.border200}
                  shadow-sm
                `.replace(/\s+/g, ' ').trim()}
                title={`${bugCount} bug(s) reported: ${bugIds.join(', ')}`}
              >
                <Bug className="w-3.5 h-3.5" />
                <span>{bugCount} Bug{bugCount > 1 ? 's' : ''}</span>
              </span>
            )}

            {tags.length > 0 && (
              <div className="flex gap-1 flex-shrink-0">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`
                      ${metaTypography.className}
                      px-1.5 py-0.5 ${borderRadius.base}
                      ${colors.gray[100]} ${colors.gray.text600}
                    `.replace(/\s+/g, ' ').trim()}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className={`${descriptionTypography.className} ${colors.gray.text600} mb-2`}>
              {description}
            </p>
          )}

          {/* Step Counts */}
          <div className="flex gap-4">
            <span className={`${metaTypography.className} ${colors.status.success.text600}`}>
              ✓ {passedSteps} passed
            </span>
            {failedSteps > 0 && (
              <span className={`${metaTypography.className} ${colors.status.error.text600}`}>
                ✗ {failedSteps} failed
              </span>
            )}
            {skippedSteps > 0 && (
              <span className={`${metaTypography.className} ${colors.gray.text500}`}>
                ⊘ {skippedSteps} skipped
              </span>
            )}
            <span className={`${metaTypography.className} ${colors.gray.text500}`}>
              {completedSteps}/{totalSteps} steps
            </span>
          </div>

          {/* Progress Bar */}
          <div className={`mt-2 w-full h-1.5 ${colors.gray[200]} ${borderRadius.full} overflow-hidden`}>
            <div
              className={`h-full ${statusClasses.border} transition-all duration-300`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Right Side: Actions & Expand Icon */}
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {/* Bug Button with dynamic state */}
          {showBugButton && onReportBug && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReportBug();
              }}
              className={`
                flex items-center gap-1 px-3 py-1.5 ${borderRadius.md}
                ${bugCount > 0
                  ? `${colors.status.error[600]} text-white hover:bg-red-700`
                  : `${colors.orange[100]} ${colors.orange.text700} hover:bg-orange-200`
                }
                transition-all duration-200 text-sm font-medium
                ${bugCount > 0 ? 'shadow-md' : ''}
              `.replace(/\s+/g, ' ').trim()}
              title={bugCount > 0 ? `${bugCount} bug(s) ya reportado(s). Click para reportar otro` : 'Reportar bug para este scenario'}
            >
              <Bug className="w-4 h-4" />
              <span>{bugCount > 0 ? `+1 Bug (${bugCount} total)` : 'Report Bug'}</span>
            </button>
          )}

          {/* Expand/Collapse Icon */}
          {isExpanded ? (
            <ChevronUp className={`w-5 h-5 ${statusClasses.text} flex-shrink-0`} />
          ) : (
            <ChevronDown className={`w-5 h-5 ${statusClasses.text} flex-shrink-0`} />
          )}
        </div>
      </div>

      {/* Expanded Content: Steps */}
      {isExpanded && (
        <div
          className={`
            border-t ${statusClasses.border}
            ${spacing.padding}
            ${colors.gray[50]} bg-opacity-50
          `.replace(/\s+/g, ' ').trim()}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// Export for convenience
export default ScenarioCard;
