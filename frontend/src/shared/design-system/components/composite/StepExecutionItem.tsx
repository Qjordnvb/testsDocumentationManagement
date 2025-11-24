/**
 * StepExecutionItem Component - Design System
 * Reusable item for displaying Gherkin step execution results
 *
 * Eliminates ~120 lines of duplicated code from TestRunnerModal and ExecutionDetailsModal
 * Fully uses design system tokens for consistent styling
 */

import { Check, X, Minus, AlertCircle } from 'lucide-react';
import {
  getStatusClasses,
  getScenarioTypography,
  getComponentSpacing,
  borderRadius,
  colors,
} from '@/shared/design-system/tokens';
import type { ExecutionStatus } from '@/shared/design-system/tokens';

export interface StepExecutionItemProps {
  // Step Data
  keyword: string; // Given, When, Then, And, But
  text: string;
  status: ExecutionStatus;
  stepNumber?: number;

  // Execution Details
  executionTime?: number; // milliseconds
  errorMessage?: string;
  screenshot?: string;

  // Styling
  compact?: boolean;
  className?: string;
}

export const StepExecutionItem = ({
  keyword,
  text,
  status,
  stepNumber,
  executionTime,
  errorMessage,
  screenshot,
  compact = false,
  className = '',
}: StepExecutionItemProps) => {
  // Get design tokens
  const statusClasses = getStatusClasses(status);
  const keywordTypography = getScenarioTypography('stepKeyword');
  const textTypography = getScenarioTypography('stepText');
  const metaTypography = getScenarioTypography('scenarioMeta');
  const spacing = getComponentSpacing(compact ? 'stepItemCompact' : 'stepItem');

  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'passed':
        return <Check className="w-4 h-4" />;
      case 'failed':
        return <X className="w-4 h-4" />;
      case 'skipped':
        return <Minus className="w-4 h-4" />;
      case 'blocked':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null; // No icon for pending status - cleaner UI
    }
  };

  // Get keyword color
  const getKeywordColor = () => {
    const keywordColors: Record<string, string> = {
      'Given': colors.brand.primary.text600,
      'When': colors.brand.secondary.text600,
      'Then': colors.status.success.text600,
      'And': colors.gray.text600,
      'But': colors.status.warning.text600,
    };
    return keywordColors[keyword] || colors.gray.text700;
  };

  return (
    <div
      className={`
        ${borderRadius.md} border
        ${statusClasses.stepCard}
        ${spacing.padding}
        transition-all
        ${className}
      `.replace(/\s+/g, ' ').trim()}
    >
      <div className="flex items-start gap-3">
        {/* Step Number Badge (if provided) */}
        {stepNumber !== undefined && (
          <div
            className={`
              flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
              ${colors.gray[200]} ${colors.gray.text700}
              ${metaTypography.className}
            `.replace(/\s+/g, ' ').trim()}
          >
            {stepNumber}
          </div>
        )}

        {/* Status Icon */}
        <div className={`flex-shrink-0 ${statusClasses.text} mt-0.5`}>
          {getStatusIcon()}
        </div>

        {/* Step Content */}
        <div className="flex-1 min-w-0">
          {/* Step Text */}
          <div className="flex flex-wrap items-baseline gap-2">
            <span className={`${keywordTypography.className}`} style={{ color: getKeywordColor() }}>
              {keyword}
            </span>
            <span className={`${textTypography.className} ${colors.gray.text900}`}>
              {text}
            </span>
          </div>

          {/* Execution Metadata */}
          {(executionTime !== undefined || errorMessage || screenshot) && (
            <div className={`mt-1 ${spacing.gap} flex flex-col`}>
              {/* Execution Time */}
              {executionTime !== undefined && (
                <span className={`${metaTypography.className} ${colors.gray.text500}`}>
                  ⏱ {executionTime}ms
                </span>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div
                  className={`
                    mt-2 p-2 ${borderRadius.base}
                    ${colors.status.error[50]} ${colors.status.error.border200} border
                  `.replace(/\s+/g, ' ').trim()}
                >
                  <p className={`${textTypography.className} ${colors.status.error.text700}`}>
                    <strong>Error:</strong> {errorMessage}
                  </p>
                </div>
              )}

              {/* Screenshot */}
              {screenshot && (
                <div className="mt-2">
                  <img
                    src={screenshot}
                    alt="Step screenshot"
                    className={`max-w-full h-auto ${borderRadius.md} border ${colors.gray.border200}`}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export for convenience
export default StepExecutionItem;
