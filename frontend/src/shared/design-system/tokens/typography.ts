/**
 * Design System - Typography Tokens
 * Centralized typography definitions for the entire application
 *
 * Usage:
 *   import { typography, getTypographyPreset } from '@/shared/design-system/tokens';
 *   const classes = getTypographyPreset('h1');
 */

// ============================================================================
// FONT FAMILIES
// ============================================================================

export const fontFamily = {
  sans: 'font-sans',        // System UI fonts
  mono: 'font-mono',        // Monospace for code
} as const;

// ============================================================================
// FONT SIZES
// ============================================================================

export const fontSize = {
  xs: 'text-xs',           // 12px
  sm: 'text-sm',           // 14px
  base: 'text-base',       // 16px
  lg: 'text-lg',           // 18px
  xl: 'text-xl',           // 20px
  '2xl': 'text-2xl',       // 24px
  '3xl': 'text-3xl',       // 30px
  '4xl': 'text-4xl',       // 36px
  '5xl': 'text-5xl',       // 48px
} as const;

// ============================================================================
// FONT WEIGHTS
// ============================================================================

export const fontWeight = {
  normal: 'font-normal',     // 400
  medium: 'font-medium',     // 500
  semibold: 'font-semibold', // 600
  bold: 'font-bold',         // 700
} as const;

// ============================================================================
// LINE HEIGHTS
// ============================================================================

export const lineHeight = {
  none: 'leading-none',      // 1
  tight: 'leading-tight',    // 1.25
  snug: 'leading-snug',      // 1.375
  normal: 'leading-normal',  // 1.5
  relaxed: 'leading-relaxed', // 1.625
  loose: 'leading-loose',    // 2
} as const;

// ============================================================================
// TYPOGRAPHY PRESETS
// ============================================================================

export interface TypographyPreset {
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  className: string; // Combined classes for convenience
}

const typographyPresets: Record<string, TypographyPreset> = {
  // Headings
  h1: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    className: 'text-4xl font-bold leading-tight',
  },
  h2: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    className: 'text-3xl font-bold leading-tight',
  },
  h3: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.snug,
    className: 'text-2xl font-bold leading-snug',
  },
  h4: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.snug,
    className: 'text-xl font-bold leading-snug',
  },
  h5: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    className: 'text-lg font-semibold leading-snug',
  },

  // Body Text
  bodyLarge: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.relaxed,
    className: 'text-lg font-normal leading-relaxed',
  },
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    className: 'text-base font-normal leading-normal',
  },
  bodySmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    className: 'text-sm font-normal leading-normal',
  },

  // Labels & UI Elements
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.tight,
    className: 'text-sm font-medium leading-tight',
  },
  labelLarge: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.tight,
    className: 'text-base font-medium leading-tight',
  },
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.tight,
    className: 'text-xs font-normal leading-tight',
  },
  captionBold: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
    className: 'text-xs font-semibold leading-tight',
  },

  // Code & Technical
  code: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    className: 'text-sm font-mono leading-normal',
  },
  codeBlock: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.relaxed,
    className: 'text-xs font-mono leading-relaxed',
  },

  // Buttons
  buttonLarge: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.none,
    className: 'text-lg font-medium leading-none',
  },
  button: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.none,
    className: 'text-base font-medium leading-none',
  },
  buttonSmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.none,
    className: 'text-sm font-medium leading-none',
  },
};

/**
 * Get typography preset classes
 * @param preset - Typography preset name
 * @returns Typography preset object with individual and combined classes
 */
export const getTypographyPreset = (preset: string): TypographyPreset => {
  return typographyPresets[preset] || typographyPresets.body;
};

// ============================================================================
// SCENARIO & TEST EXECUTION SPECIFIC TYPOGRAPHY
// ============================================================================

export const scenarioTypography = {
  // Scenario Card Title
  scenarioTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    className: 'text-lg font-semibold leading-snug',
  },

  // Scenario Metadata (tags, counts)
  scenarioMeta: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.tight,
    className: 'text-xs font-medium leading-tight',
  },

  // Step Keyword (Given, When, Then, And, But)
  stepKeyword: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    className: 'text-sm font-bold leading-tight',
  },

  // Step Text
  stepText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    className: 'text-sm font-normal leading-normal',
  },

  // Step Number Badge
  stepNumber: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.none,
    className: 'text-xs font-semibold leading-none',
  },

  // Scenario Description
  scenarioDescription: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.relaxed,
    className: 'text-sm font-normal leading-relaxed',
  },

  // Execution Time/Date
  executionTime: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.tight,
    className: 'text-xs font-normal leading-tight',
  },

  // Test Case ID
  testCaseId: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    className: 'text-sm font-bold leading-tight font-mono',
  },
} as const;

/**
 * Get scenario-specific typography classes
 * @param element - Scenario element type
 * @returns Typography classes for the element
 */
export const getScenarioTypography = (
  element: keyof typeof scenarioTypography
): TypographyPreset => {
  return scenarioTypography[element];
};

// ============================================================================
// MODAL & FORM SPECIFIC TYPOGRAPHY
// ============================================================================

export const modalTypography = {
  // Modal Title
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    className: 'text-xl font-bold leading-tight',
  },

  // Modal Section Title
  modalSectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    className: 'text-base font-semibold leading-snug',
  },

  // Form Label
  formLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.tight,
    className: 'text-sm font-medium leading-tight',
  },

  // Form Input
  formInput: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    className: 'text-base font-normal leading-normal',
  },

  // Form Helper Text
  formHelper: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.tight,
    className: 'text-xs font-normal leading-tight',
  },

  // Form Error
  formError: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.tight,
    className: 'text-xs font-medium leading-tight text-red-600',
  },
} as const;

/**
 * Get modal/form typography classes
 * @param element - Modal/form element type
 * @returns Typography classes for the element
 */
export const getModalTypography = (
  element: keyof typeof modalTypography
): TypographyPreset => {
  return modalTypography[element];
};

// ============================================================================
// TABLE & LIST TYPOGRAPHY
// ============================================================================

export const tableTypography = {
  // Table Header
  tableHeader: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
    className: 'text-xs font-semibold leading-tight uppercase tracking-wider',
  },

  // Table Cell
  tableCell: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    className: 'text-sm font-normal leading-normal',
  },

  // Table Cell Bold
  tableCellBold: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
    className: 'text-sm font-semibold leading-normal',
  },

  // List Item
  listItem: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.relaxed,
    className: 'text-sm font-normal leading-relaxed',
  },
} as const;

/**
 * Get table/list typography classes
 * @param element - Table/list element type
 * @returns Typography classes for the element
 */
export const getTableTypography = (
  element: keyof typeof tableTypography
): TypographyPreset => {
  return tableTypography[element];
};

// ============================================================================
// EXPORTS
// ============================================================================

export type TypographyPresetName = keyof typeof typographyPresets;
export type ScenarioTypographyName = keyof typeof scenarioTypography;
export type ModalTypographyName = keyof typeof modalTypography;
export type TableTypographyName = keyof typeof tableTypography;

export const typography = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  presets: typographyPresets,
  scenario: scenarioTypography,
  modal: modalTypography,
  table: tableTypography,
} as const;
