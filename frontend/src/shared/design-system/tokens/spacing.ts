/**
 * Design System - Spacing Tokens
 * Centralized spacing definitions for the entire application
 *
 * Usage:
 *   import { spacing, getComponentSpacing } from '@/shared/design-system/tokens';
 *   const classes = getComponentSpacing('modal');
 */

// ============================================================================
// BASE SPACING SCALE
// ============================================================================

export const spacing = {
  px: 'px',          // 1px
  0: '0',            // 0px
  0.5: '0.5',        // 2px
  1: '1',            // 4px
  1.5: '1.5',        // 6px
  2: '2',            // 8px
  2.5: '2.5',        // 10px
  3: '3',            // 12px
  3.5: '3.5',        // 14px
  4: '4',            // 16px
  5: '5',            // 20px
  6: '6',            // 24px
  7: '7',            // 28px
  8: '8',            // 32px
  9: '9',            // 36px
  10: '10',          // 40px
  11: '11',          // 44px
  12: '12',          // 48px
  14: '14',          // 56px
  16: '16',          // 64px
  20: '20',          // 80px
  24: '24',          // 96px
  28: '28',          // 112px
  32: '32',          // 128px
} as const;

// ============================================================================
// PADDING UTILITIES
// ============================================================================

export const padding = {
  // All sides
  none: 'p-0',
  xs: 'p-2',         // 8px
  sm: 'p-4',         // 16px
  md: 'p-6',         // 24px
  lg: 'p-8',         // 32px
  xl: 'p-12',        // 48px

  // Horizontal (x-axis)
  xNone: 'px-0',
  xXs: 'px-2',
  xSm: 'px-4',
  xMd: 'px-6',
  xLg: 'px-8',
  xXl: 'px-12',

  // Vertical (y-axis)
  yNone: 'py-0',
  yXs: 'py-2',
  ySm: 'py-4',
  yMd: 'py-6',
  yLg: 'py-8',
  yXl: 'py-12',

  // Top
  tNone: 'pt-0',
  tXs: 'pt-2',
  tSm: 'pt-4',
  tMd: 'pt-6',
  tLg: 'pt-8',
  tXl: 'pt-12',

  // Bottom
  bNone: 'pb-0',
  bXs: 'pb-2',
  bSm: 'pb-4',
  bMd: 'pb-6',
  bLg: 'pb-8',
  bXl: 'pb-12',

  // Left
  lNone: 'pl-0',
  lXs: 'pl-2',
  lSm: 'pl-4',
  lMd: 'pl-6',
  lLg: 'pl-8',
  lXl: 'pl-12',

  // Right
  rNone: 'pr-0',
  rXs: 'pr-2',
  rSm: 'pr-4',
  rMd: 'pr-6',
  rLg: 'pr-8',
  rXl: 'pr-12',
} as const;

// ============================================================================
// MARGIN UTILITIES
// ============================================================================

export const margin = {
  // All sides
  none: 'm-0',
  xs: 'm-2',
  sm: 'm-4',
  md: 'm-6',
  lg: 'm-8',
  xl: 'm-12',

  // Horizontal (x-axis)
  xNone: 'mx-0',
  xXs: 'mx-2',
  xSm: 'mx-4',
  xMd: 'mx-6',
  xLg: 'mx-8',
  xXl: 'mx-12',
  xAuto: 'mx-auto',

  // Vertical (y-axis)
  yNone: 'my-0',
  yXs: 'my-2',
  ySm: 'my-4',
  yMd: 'my-6',
  yLg: 'my-8',
  yXl: 'my-12',

  // Top
  tNone: 'mt-0',
  tXs: 'mt-2',
  tSm: 'mt-4',
  tMd: 'mt-6',
  tLg: 'mt-8',
  tXl: 'mt-12',

  // Bottom
  bNone: 'mb-0',
  bXs: 'mb-2',
  bSm: 'mb-4',
  bMd: 'mb-6',
  bLg: 'mb-8',
  bXl: 'mb-12',

  // Left
  lNone: 'ml-0',
  lXs: 'ml-2',
  lSm: 'ml-4',
  lMd: 'ml-6',
  lLg: 'ml-8',
  lXl: 'ml-12',

  // Right
  rNone: 'mr-0',
  rXs: 'mr-2',
  rSm: 'mr-4',
  rMd: 'mr-6',
  rLg: 'mr-8',
  rXl: 'mr-12',
} as const;

// ============================================================================
// GAP UTILITIES (for Flexbox/Grid)
// ============================================================================

export const gap = {
  none: 'gap-0',
  xs: 'gap-1',       // 4px
  sm: 'gap-2',       // 8px
  md: 'gap-3',       // 12px
  lg: 'gap-4',       // 16px
  xl: 'gap-6',       // 24px
  '2xl': 'gap-8',    // 32px

  // X-axis gap
  xNone: 'gap-x-0',
  xXs: 'gap-x-1',
  xSm: 'gap-x-2',
  xMd: 'gap-x-3',
  xLg: 'gap-x-4',
  xXl: 'gap-x-6',

  // Y-axis gap
  yNone: 'gap-y-0',
  yXs: 'gap-y-1',
  ySm: 'gap-y-2',
  yMd: 'gap-y-3',
  yLg: 'gap-y-4',
  yXl: 'gap-y-6',
} as const;

// ============================================================================
// COMPONENT-SPECIFIC SPACING
// ============================================================================

export interface ComponentSpacing {
  padding: string;
  gap?: string;
  margin?: string;
}

const componentSpacing: Record<string, ComponentSpacing> = {
  // Modal
  modal: {
    padding: 'px-6 py-4',
    gap: 'gap-6',
  },
  modalHeader: {
    padding: 'px-6 py-4',
  },
  modalBody: {
    padding: 'px-6 py-4',
  },
  modalFooter: {
    padding: 'px-6 py-4',
    gap: 'gap-3',
  },

  // Card
  cardSmall: {
    padding: 'p-4',
  },
  cardMedium: {
    padding: 'p-6',
  },
  cardLarge: {
    padding: 'p-8',
  },

  // Button
  buttonSmall: {
    padding: 'px-3 py-1.5',
    gap: 'gap-2',
  },
  buttonMedium: {
    padding: 'px-4 py-2',
    gap: 'gap-2',
  },
  buttonLarge: {
    padding: 'px-6 py-3',
    gap: 'gap-2',
  },

  // Badge
  badgeSmall: {
    padding: 'px-2 py-0.5',
    gap: 'gap-1',
  },
  badgeMedium: {
    padding: 'px-2.5 py-1',
    gap: 'gap-1',
  },
  badgeLarge: {
    padding: 'px-3 py-1.5',
    gap: 'gap-1',
  },

  // Form Elements
  formGroup: {
    padding: 'p-0',
    margin: 'mb-4',
    gap: 'gap-2',
  },
  formLabel: {
    padding: 'p-0',
    margin: 'mb-1',
  },
  formInput: {
    padding: 'px-3 py-2',
  },
  formTextarea: {
    padding: 'px-3 py-2',
  },
  formSelect: {
    padding: 'px-3 py-2',
  },

  // Scenario Card
  scenarioCard: {
    padding: 'p-4',
    gap: 'gap-3',
  },
  scenarioHeader: {
    padding: 'pb-3',
    gap: 'gap-2',
  },
  scenarioBody: {
    padding: 'py-2',
    gap: 'gap-2',
  },

  // Step Execution Item
  stepItem: {
    padding: 'p-3',
    gap: 'gap-2',
  },
  stepItemCompact: {
    padding: 'p-2',
    gap: 'gap-1.5',
  },

  // Table
  tableCell: {
    padding: 'px-4 py-3',
  },
  tableHeader: {
    padding: 'px-4 py-3',
  },

  // List
  listItem: {
    padding: 'py-2',
    gap: 'gap-2',
  },
  listItemCompact: {
    padding: 'py-1',
    gap: 'gap-1',
  },

  // Page Layout
  pageContainer: {
    padding: 'p-8',
  },
  pageHeader: {
    padding: 'p-0',
    margin: 'mb-8',
    gap: 'gap-4',
  },
  pageSection: {
    padding: 'p-0',
    margin: 'mb-6',
    gap: 'gap-4',
  },

  // Dashboard
  dashboardGrid: {
    padding: 'p-0',
    gap: 'gap-6',
  },
  dashboardCard: {
    padding: 'p-6',
    gap: 'gap-4',
  },

  // Stats Card
  statsCard: {
    padding: 'p-6',
    gap: 'gap-2',
  },
  statsCardCompact: {
    padding: 'p-4',
    gap: 'gap-1',
  },
} as const;

/**
 * Get component-specific spacing
 * @param component - Component name
 * @returns Component spacing object
 */
export const getComponentSpacing = (component: string): ComponentSpacing => {
  return componentSpacing[component] || { padding: 'p-4' };
};

// ============================================================================
// BORDER SPACING (border-radius)
// ============================================================================

export const borderRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',       // 2px
  base: 'rounded',        // 4px
  md: 'rounded-md',       // 6px
  lg: 'rounded-lg',       // 8px
  xl: 'rounded-xl',       // 12px
  '2xl': 'rounded-2xl',   // 16px
  '3xl': 'rounded-3xl',   // 24px
  full: 'rounded-full',   // 9999px
} as const;

// ============================================================================
// CONTAINER WIDTHS
// ============================================================================

export const containerWidth = {
  xs: 'max-w-xs',      // 320px
  sm: 'max-w-sm',      // 384px
  md: 'max-w-md',      // 448px
  lg: 'max-w-lg',      // 512px
  xl: 'max-w-xl',      // 576px
  '2xl': 'max-w-2xl',  // 672px
  '3xl': 'max-w-3xl',  // 768px
  '4xl': 'max-w-4xl',  // 896px
  '5xl': 'max-w-5xl',  // 1024px
  '6xl': 'max-w-6xl',  // 1152px
  '7xl': 'max-w-7xl',  // 1280px
  full: 'max-w-full',  // 100%
} as const;

// ============================================================================
// EXPORTS
// ============================================================================

export type ComponentSpacingName = keyof typeof componentSpacing;
export type SpacingSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type BorderRadiusSize = keyof typeof borderRadius;
export type ContainerWidthSize = keyof typeof containerWidth;
