/**
 * Design System - Token Exports
 * Central export point for all design tokens
 *
 * Usage:
 *   import { colors, typography, spacing, shadows } from '@/shared/design-system/tokens';
 *   import { getStatusClasses, getTypographyPreset } from '@/shared/design-system/tokens';
 */

// ============================================================================
// COLOR TOKENS
// ============================================================================

export {
  colors,
  getStatusClasses,
  getPriorityClasses,
  getSeverityClasses,
  getButtonVariantClasses,
  getBadgeVariantClasses,
} from './colors';

export type {
  ExecutionStatus,
  StatusClasses,
  Priority,
  Severity,
  ButtonVariant,
  BadgeVariant,
} from './colors';

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

export {
  typography,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  getTypographyPreset,
  getScenarioTypography,
  getModalTypography,
  getTableTypography,
  scenarioTypography,
  modalTypography,
  tableTypography,
} from './typography';

export type {
  TypographyPreset,
  TypographyPresetName,
  ScenarioTypographyName,
  ModalTypographyName,
  TableTypographyName,
} from './typography';

// ============================================================================
// SPACING TOKENS
// ============================================================================

export {
  spacing,
  padding,
  margin,
  gap,
  borderRadius,
  containerWidth,
  getComponentSpacing,
} from './spacing';

export type {
  ComponentSpacing,
  ComponentSpacingName,
  SpacingSize,
  BorderRadiusSize,
  ContainerWidthSize,
} from './spacing';

// ============================================================================
// SHADOW TOKENS
// ============================================================================

export {
  shadows,
  shadowTransition,
  getElevationShadow,
  getComponentShadow,
  getShadowTransition,
  getShadowWithTransition,
  getHoverShadow,
} from './shadows';

export type {
  ElevationShadow,
  ComponentShadow,
  ElevationLevel,
  ComponentShadowName,
  ShadowTransitionSpeed,
} from './shadows';

// ============================================================================
// COMBINED UTILITY FUNCTIONS
// ============================================================================

import type { ExecutionStatus } from './colors';
import { getStatusClasses, colors } from './colors';
import { getComponentSpacing, spacing } from './spacing';
import { getComponentShadow, shadows } from './shadows';
import { getTypographyPreset, typography } from './typography';

/**
 * Get complete classes for a scenario card based on execution status
 * @param status - Execution status (passed, failed, skipped, etc.)
 * @returns Object with background, border, text, and shadow classes
 */
export const getScenarioCardClasses = (status: ExecutionStatus | string) => {
  const statusClasses = getStatusClasses(status);
  const spacing = getComponentSpacing('scenarioCard');
  const shadow = getComponentShadow('scenarioCard');

  return {
    container: `${statusClasses.background} ${statusClasses.border} border ${spacing.padding} ${shadow.base} rounded-lg`,
    text: statusClasses.text,
    badge: statusClasses.badge,
    hover: shadow.hover || '',
  };
};

/**
 * Get complete classes for a step execution item based on status
 * @param status - Execution status (passed, failed, skipped, etc.)
 * @returns Object with background, border, text classes
 */
export const getStepItemClasses = (status: ExecutionStatus | string) => {
  const statusClasses = getStatusClasses(status);
  const spacing = getComponentSpacing('stepItem');

  return {
    container: `${statusClasses.stepCard} border ${spacing.padding} rounded-md`,
    text: statusClasses.text,
  };
};

/**
 * Get complete classes for a button
 * @param variant - Button variant (primary, secondary, danger, etc.)
 * @param size - Button size (sm, md, lg)
 * @returns Combined button classes
 */
export const getButtonClasses = (
  variant: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' = 'primary',
  size: 'small' | 'medium' | 'large' = 'medium'
) => {
  const spacing = getComponentSpacing(`button${size.charAt(0).toUpperCase() + size.slice(1)}`);
  const shadow = getComponentShadow('button');
  const typography = getTypographyPreset(`button${size.charAt(0).toUpperCase() + size.slice(1)}`);

  // Variant-specific colors (using existing logic from Button.tsx)
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white',
    secondary: 'bg-gray-100 text-gray-700 border border-gray-300',
    danger: 'bg-red-600 text-white',
    success: 'bg-green-600 text-white',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  };

  return `${spacing.padding} ${spacing.gap} ${typography.className} ${variantClasses[variant]} ${shadow.base} hover:${shadow.hover} rounded-lg transition-all duration-200`;
};

/**
 * Get complete classes for a card
 * @param variant - Card variant (default, bordered, elevated)
 * @param padding - Padding size (sm, md, lg)
 * @param hover - Enable hover effect
 * @returns Combined card classes
 */
export const getCardClasses = (
  variant: 'default' | 'bordered' | 'elevated' = 'default',
  paddingSize: 'small' | 'medium' | 'large' = 'medium',
  hover: boolean = true
) => {
  const spacing = getComponentSpacing(`card${paddingSize.charAt(0).toUpperCase() + paddingSize.slice(1)}`);
  const shadow = getComponentShadow(variant === 'elevated' ? 'cardElevated' : variant === 'bordered' ? 'cardBordered' : 'card');

  const variantClasses = {
    default: 'bg-white',
    bordered: 'bg-white border-2 border-gray-200',
    elevated: 'bg-white',
  };

  const hoverClass = hover && shadow.hover ? `hover:${shadow.hover}` : '';

  return `${variantClasses[variant]} ${spacing.padding} ${shadow.base} ${hoverClass} rounded-xl transition-all duration-200`;
};

/**
 * Get complete classes for a modal
 * @param size - Modal size (sm, md, lg, xl, full)
 * @returns Modal container classes
 */
export const getModalClasses = (size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md') => {
  const sizeMap = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  };

  const shadow = getComponentShadow('modal');

  return `bg-white ${sizeMap[size]} w-full mx-4 max-h-[90vh] ${shadow.base} rounded-xl flex flex-col`;
};

/**
 * Get complete classes for a badge
 * @param variant - Badge variant (default, primary, success, warning, danger, info)
 * @param size - Badge size (sm, md, lg)
 * @returns Combined badge classes
 */
export const getBadgeClasses = (
  variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' = 'default',
  size: 'small' | 'medium' | 'large' = 'medium'
) => {
  const spacing = getComponentSpacing(`badge${size.charAt(0).toUpperCase() + size.slice(1)}`);
  const typography = size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm';

  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 border-gray-300',
    primary: 'bg-blue-100 text-blue-700 border-blue-300',
    success: 'bg-green-100 text-green-700 border-green-300',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    danger: 'bg-red-100 text-red-700 border-red-300',
    info: 'bg-purple-100 text-purple-700 border-purple-300',
  };

  return `inline-flex items-center ${spacing.gap} ${spacing.padding} ${typography} font-medium ${variantClasses[variant]} border rounded-full`;
};

// ============================================================================
// UTILITY: Combine Multiple Classes
// ============================================================================

/**
 * Utility function to combine class strings and remove duplicates
 * @param classes - Array of class strings
 * @returns Combined class string
 */
export const combineClasses = (...classes: (string | undefined | null | false)[]): string => {
  return classes
    .filter(Boolean)
    .join(' ')
    .split(' ')
    .filter((cls, index, arr) => cls && arr.indexOf(cls) === index)
    .join(' ');
};

// ============================================================================
// DESIGN TOKEN METADATA
// ============================================================================

export const designSystemVersion = '1.0.0';
export const designSystemName = 'QA Testing Platform Design System';

/**
 * Get all available design tokens as a single object (useful for debugging)
 */
export const getAllTokens = () => {
  return {
    version: designSystemVersion,
    name: designSystemName,
    tokens: {
      colors: Object.keys(colors),
      typography: Object.keys(typography),
      spacing: Object.keys(spacing),
      shadows: Object.keys(shadows),
    },
  };
};
