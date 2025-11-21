/**
 * Design System - Color Tokens
 * Centralized color definitions for the entire application
 *
 * Usage:
 *   import { colors, getStatusClasses } from '@/shared/design-system/tokens';
 *   const classes = getStatusClasses('passed');
 */

// ============================================================================
// SEMANTIC COLORS
// ============================================================================

export const colors = {
  // White (commonly used for text and backgrounds)
  white: 'bg-white',
  textWhite: 'text-white',

  // Brand Colors
  brand: {
    primary: {
      50: 'bg-blue-50',
      100: 'bg-blue-100',
      200: 'bg-blue-200',
      500: 'bg-blue-500',
      600: 'bg-blue-600',
      700: 'bg-blue-700',
      800: 'bg-blue-800',
      900: 'bg-blue-900',
      text50: 'text-blue-50',
      text100: 'text-blue-100',
      text500: 'text-blue-500',
      text600: 'text-blue-600',
      text700: 'text-blue-700',
      text800: 'text-blue-800',
      text900: 'text-blue-900',
      border: 'border-blue-300',
      border200: 'border-blue-200',
      border300: 'border-blue-300',
      border500: 'border-blue-500',
      border600: 'border-blue-600',
      gradient: 'bg-gradient-to-r from-blue-600 to-purple-600',
    },
    secondary: {
      50: 'bg-purple-50',
      100: 'bg-purple-100',
      500: 'bg-purple-500',
      600: 'bg-purple-600',
      700: 'bg-purple-700',
      text50: 'text-purple-50',
      text100: 'text-purple-100',
      text500: 'text-purple-500',
      text600: 'text-purple-600',
      text700: 'text-purple-700',
      border: 'border-purple-300',
    },
  },

  // Status Colors (for test execution, scenarios, etc.)
  status: {
    success: {
      50: 'bg-green-50',
      100: 'bg-green-100',
      600: 'bg-green-600',
      700: 'bg-green-700',
      800: 'bg-green-800',
      900: 'bg-green-900',
      text50: 'text-green-50',
      text100: 'text-green-100',
      text600: 'text-green-600',
      text700: 'text-green-700',
      text800: 'text-green-800',
      text900: 'text-green-900',
      border200: 'border-green-200',
      border300: 'border-green-300',
      gradient: 'bg-gradient-to-br from-green-50 to-emerald-50',
    },
    error: {
      50: 'bg-red-50',
      100: 'bg-red-100',
      500: 'bg-red-500',
      600: 'bg-red-600',
      700: 'bg-red-700',
      800: 'bg-red-800',
      900: 'bg-red-900',
      text50: 'text-red-50',
      text100: 'text-red-100',
      text500: 'text-red-500',
      text600: 'text-red-600',
      text700: 'text-red-700',
      text800: 'text-red-800',
      text900: 'text-red-900',
      border200: 'border-red-200',
      border300: 'border-red-300',
      gradient: 'bg-gradient-to-br from-red-50 to-rose-50',
    },
    warning: {
      50: 'bg-yellow-50',
      100: 'bg-yellow-100',
      600: 'bg-yellow-600',
      700: 'bg-yellow-700',
      800: 'bg-yellow-800',
      900: 'bg-yellow-900',
      text50: 'text-yellow-50',
      text100: 'text-yellow-100',
      text600: 'text-yellow-600',
      text700: 'text-yellow-700',
      text800: 'text-yellow-800',
      text900: 'text-yellow-900',
      border200: 'border-yellow-200',
      border300: 'border-yellow-300',
      gradient: 'bg-gradient-to-br from-yellow-50 to-amber-50',
    },
    info: {
      50: 'bg-blue-50',
      100: 'bg-blue-100',
      600: 'bg-blue-600',
      700: 'bg-blue-700',
      800: 'bg-blue-800',
      900: 'bg-blue-900',
      text50: 'text-blue-50',
      text100: 'text-blue-100',
      text600: 'text-blue-600',
      text700: 'text-blue-700',
      text800: 'text-blue-800',
      text900: 'text-blue-900',
      border200: 'border-blue-200',
      border300: 'border-blue-300',
    },
  },

  // Neutral Grays
  gray: {
    50: 'bg-gray-50',
    100: 'bg-gray-100',
    200: 'bg-gray-200',
    300: 'bg-gray-300',
    400: 'bg-gray-400',
    500: 'bg-gray-500',
    600: 'bg-gray-600',
    700: 'bg-gray-700',
    800: 'bg-gray-800',
    900: 'bg-gray-900',
    text50: 'text-gray-50',
    text100: 'text-gray-100',
    text200: 'text-gray-200',
    text300: 'text-gray-300',
    text400: 'text-gray-400',
    text500: 'text-gray-500',
    text600: 'text-gray-600',
    text700: 'text-gray-700',
    text800: 'text-gray-800',
    text900: 'text-gray-900',
    border100: 'border-gray-100',
    border200: 'border-gray-200',
    border300: 'border-gray-300',
    border400: 'border-gray-400',
    divider200: 'divide-gray-200',
    gradientLight: 'bg-gradient-to-br from-gray-100 to-gray-200',
  },

  // Orange (for bug reports, warnings)
  orange: {
    100: 'bg-orange-100',
    200: 'bg-orange-200',
    600: 'bg-orange-600',
    700: 'bg-orange-700',
    text100: 'text-orange-100',
    text600: 'text-orange-600',
    text700: 'text-orange-700',
    border: 'border-orange-300',
  },
} as const;

// ============================================================================
// EXECUTION STATUS CLASSES
// ============================================================================

export type ExecutionStatus = 'passed' | 'failed' | 'skipped' | 'pending' | 'blocked';

export interface StatusClasses {
  background: string;
  backgroundSolid: string;
  border: string;
  text: string;
  badge: string;
  stepCard: string;
  // Legacy properties for backward compatibility
  iconClass: string;
  bgClass: string;
  textClass: string;
}

const executionStatusMap: Record<ExecutionStatus, StatusClasses> = {
  passed: {
    background: 'bg-gradient-to-br from-green-50 to-emerald-50',
    backgroundSolid: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-700',
    stepCard: 'bg-green-50/50 border-green-200',
    iconClass: 'text-green-600',
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
  },
  failed: {
    background: 'bg-gradient-to-br from-red-50 to-rose-50',
    backgroundSolid: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    stepCard: 'bg-red-50/50 border-red-200',
    iconClass: 'text-red-600',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
  },
  skipped: {
    background: 'bg-gradient-to-br from-gray-100 to-gray-200',
    backgroundSolid: 'bg-gray-100',
    border: 'border-gray-400',
    text: 'text-gray-600',
    badge: 'bg-gray-100 text-gray-600',
    stepCard: 'bg-gray-100 border-gray-300',
    iconClass: 'text-gray-400',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600',
  },
  pending: {
    background: 'bg-white',
    backgroundSolid: 'bg-white',
    border: 'border-gray-200',
    text: 'text-gray-600',
    badge: 'bg-blue-50 text-blue-600',
    stepCard: 'bg-white border-gray-200',
    iconClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-600',
  },
  blocked: {
    background: 'bg-gradient-to-br from-yellow-50 to-amber-50',
    backgroundSolid: 'bg-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-700',
    stepCard: 'bg-yellow-50/50 border-yellow-200',
    iconClass: 'text-yellow-600',
    bgClass: 'bg-yellow-100',
    textClass: 'text-yellow-700',
  },
};

/**
 * Get status classes for execution status (passed, failed, skipped, etc.)
 * @param status - Execution status
 * @returns Status classes object
 */
export const getStatusClasses = (status: ExecutionStatus | string): StatusClasses => {
  const normalizedStatus = status.toLowerCase() as ExecutionStatus;
  return executionStatusMap[normalizedStatus] || executionStatusMap.pending;
};

// ============================================================================
// PRIORITY CLASSES
// ============================================================================

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

const priorityMap: Record<Priority, string> = {
  Critical: 'bg-red-100 text-red-700 border-red-300',
  High: 'bg-orange-100 text-orange-700 border-orange-300',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  Low: 'bg-gray-100 text-gray-700 border-gray-300',
};

/**
 * Get priority badge classes
 * @param priority - Priority level
 * @returns Tailwind classes string
 */
export const getPriorityClasses = (priority: Priority | string): string => {
  return priorityMap[priority as Priority] || priorityMap.Medium;
};

// ============================================================================
// SEVERITY CLASSES (for bugs)
// ============================================================================

export type Severity = 'Critical' | 'Major' | 'Minor' | 'Trivial';

const severityMap: Record<Severity, string> = {
  Critical: 'bg-red-100 text-red-700 border-red-300',
  Major: 'bg-orange-100 text-orange-700 border-orange-300',
  Minor: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  Trivial: 'bg-gray-100 text-gray-700 border-gray-300',
};

/**
 * Get severity badge classes
 * @param severity - Bug severity
 * @returns Tailwind classes string
 */
export const getSeverityClasses = (severity: Severity | string): string => {
  return severityMap[severity as Severity] || severityMap.Minor;
};

// ============================================================================
// BUTTON VARIANT CLASSES
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost';

const buttonVariantMap: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105 active:scale-100',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg',
  success: 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg',
  warning: 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
};

/**
 * Get button variant classes
 * @param variant - Button variant
 * @returns Tailwind classes string
 */
export const getButtonVariantClasses = (variant: ButtonVariant): string => {
  return buttonVariantMap[variant];
};

// ============================================================================
// BADGE VARIANT CLASSES
// ============================================================================

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

const badgeVariantMap: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 border-gray-300',
  primary: 'bg-blue-100 text-blue-700 border-blue-300',
  success: 'bg-green-100 text-green-700 border-green-300',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  danger: 'bg-red-100 text-red-700 border-red-300',
  info: 'bg-purple-100 text-purple-700 border-purple-300',
};

/**
 * Get badge variant classes
 * @param variant - Badge variant
 * @returns Tailwind classes string
 */
export const getBadgeVariantClasses = (variant: BadgeVariant): string => {
  return badgeVariantMap[variant];
};
