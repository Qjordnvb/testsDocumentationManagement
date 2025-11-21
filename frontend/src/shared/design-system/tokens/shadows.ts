/**
 * Design System - Shadow Tokens
 * Centralized shadow definitions for elevation and depth
 *
 * Usage:
 *   import { shadows, getElevationShadow } from '@/shared/design-system/tokens';
 *   const classes = getElevationShadow('elevated');
 */

// ============================================================================
// BASE SHADOW SCALE
// ============================================================================

export const shadows = {
  none: 'shadow-none',
  xs: 'shadow-xs',         // Subtle shadow for small elements
  sm: 'shadow-sm',         // Light shadow for slightly raised elements
  base: 'shadow',          // Default shadow
  md: 'shadow-md',         // Medium shadow for cards
  lg: 'shadow-lg',         // Large shadow for elevated cards
  xl: 'shadow-xl',         // Extra large shadow for modals
  '2xl': 'shadow-2xl',     // Maximum shadow for overlays
  inner: 'shadow-inner',   // Inner shadow for pressed state
} as const;

// ============================================================================
// ELEVATION LEVELS (Material Design inspired)
// ============================================================================

export interface ElevationShadow {
  shadow: string;
  hoverShadow: string;
  activeShadow?: string;
  description: string;
}

const elevationLevels: Record<string, ElevationShadow> = {
  // Level 0: Flush with surface
  flat: {
    shadow: 'shadow-none',
    hoverShadow: 'shadow-sm',
    activeShadow: 'shadow-inner',
    description: 'No elevation, flush with surface',
  },

  // Level 1: Slightly raised (cards, containers)
  raised: {
    shadow: 'shadow-sm',
    hoverShadow: 'shadow-md',
    activeShadow: 'shadow-sm',
    description: 'Slightly raised, for cards and containers',
  },

  // Level 2: Default card elevation
  card: {
    shadow: 'shadow-md',
    hoverShadow: 'shadow-lg',
    activeShadow: 'shadow',
    description: 'Default card elevation',
  },

  // Level 3: Elevated elements (dropdowns, tooltips)
  elevated: {
    shadow: 'shadow-lg',
    hoverShadow: 'shadow-xl',
    activeShadow: 'shadow-md',
    description: 'Elevated elements like dropdowns',
  },

  // Level 4: Modal and overlay elevation
  modal: {
    shadow: 'shadow-xl',
    hoverShadow: 'shadow-2xl',
    activeShadow: 'shadow-xl',
    description: 'Modal and overlay elevation',
  },

  // Level 5: Maximum elevation (notifications, toasts)
  floating: {
    shadow: 'shadow-2xl',
    hoverShadow: 'shadow-2xl',
    activeShadow: 'shadow-xl',
    description: 'Maximum elevation for floating elements',
  },

  // Special: Pressed/Active state
  pressed: {
    shadow: 'shadow-inner',
    hoverShadow: 'shadow-sm',
    activeShadow: 'shadow-inner',
    description: 'Pressed or active state',
  },
} as const;

/**
 * Get elevation shadow classes
 * @param level - Elevation level
 * @returns Elevation shadow object with default, hover, and active states
 */
export const getElevationShadow = (level: string): ElevationShadow => {
  return elevationLevels[level] || elevationLevels.card;
};

// ============================================================================
// COMPONENT-SPECIFIC SHADOWS
// ============================================================================

export interface ComponentShadow {
  base: string;
  hover?: string;
  active?: string;
  focus?: string;
}

const componentShadows: Record<string, ComponentShadow> = {
  // Buttons
  button: {
    base: 'shadow-none',
    hover: 'shadow-lg',
    active: 'shadow-none',
  },
  buttonElevated: {
    base: 'shadow-md',
    hover: 'shadow-lg',
    active: 'shadow-sm',
  },

  // Cards
  card: {
    base: 'shadow-md',
    hover: 'shadow-lg',
  },
  cardBordered: {
    base: 'shadow-none',
    hover: 'shadow-sm',
  },
  cardElevated: {
    base: 'shadow-xl',
    hover: 'shadow-2xl',
  },

  // Modal
  modal: {
    base: 'shadow-2xl',
  },
  modalBackdrop: {
    base: 'shadow-none',
  },

  // Dropdown
  dropdown: {
    base: 'shadow-lg',
  },
  dropdownItem: {
    base: 'shadow-none',
    hover: 'shadow-sm',
  },

  // Input/Form
  input: {
    base: 'shadow-sm',
    focus: 'shadow-md',
    active: 'shadow-inner',
  },
  inputError: {
    base: 'shadow-sm',
    focus: 'shadow-lg',
  },

  // Badge
  badge: {
    base: 'shadow-none',
  },
  badgeElevated: {
    base: 'shadow-sm',
  },

  // Scenario Card
  scenarioCard: {
    base: 'shadow-sm',
    hover: 'shadow-md',
  },
  scenarioCardPassed: {
    base: 'shadow-sm',
    hover: 'shadow-md',
  },
  scenarioCardFailed: {
    base: 'shadow-sm',
    hover: 'shadow-md',
  },

  // Step Item
  stepItem: {
    base: 'shadow-none',
  },
  stepItemHover: {
    base: 'shadow-none',
    hover: 'shadow-sm',
  },

  // Table
  tableRow: {
    base: 'shadow-none',
    hover: 'shadow-sm',
  },
  tableHeader: {
    base: 'shadow-sm',
  },

  // Toast/Notification
  toast: {
    base: 'shadow-2xl',
  },
  notification: {
    base: 'shadow-xl',
  },

  // Tooltip
  tooltip: {
    base: 'shadow-lg',
  },

  // Page Container
  pageContainer: {
    base: 'shadow-none',
  },
  pageCard: {
    base: 'shadow-md',
    hover: 'shadow-lg',
  },

  // Stats Card
  statsCard: {
    base: 'shadow-md',
    hover: 'shadow-lg',
  },

  // Bug Report Card
  bugCard: {
    base: 'shadow-sm',
    hover: 'shadow-md',
  },
} as const;

/**
 * Get component-specific shadow classes
 * @param component - Component name
 * @returns Component shadow object with base, hover, active, and focus states
 */
export const getComponentShadow = (component: string): ComponentShadow => {
  return componentShadows[component] || { base: 'shadow-md' };
};

// ============================================================================
// TRANSITION UTILITIES (for smooth shadow transitions)
// ============================================================================

export const shadowTransition = {
  default: 'transition-shadow duration-200',
  fast: 'transition-shadow duration-150',
  slow: 'transition-shadow duration-300',
  smooth: 'transition-shadow duration-200 ease-in-out',
} as const;

/**
 * Get shadow transition class
 * @param speed - Transition speed
 * @returns Transition class string
 */
export const getShadowTransition = (speed: keyof typeof shadowTransition = 'default'): string => {
  return shadowTransition[speed];
};

// ============================================================================
// COMBINED UTILITIES (shadow + transition)
// ============================================================================

/**
 * Get combined shadow and transition classes
 * @param component - Component name
 * @param transitionSpeed - Transition speed (optional)
 * @returns Combined class string for base state
 */
export const getShadowWithTransition = (
  component: string,
  transitionSpeed: keyof typeof shadowTransition = 'default'
): string => {
  const shadow = getComponentShadow(component);
  const transition = getShadowTransition(transitionSpeed);
  return `${shadow.base} ${transition}`;
};

/**
 * Get hover classes with shadow and transition
 * @param component - Component name
 * @param transitionSpeed - Transition speed (optional)
 * @returns Combined class string for hover state
 */
export const getHoverShadow = (
  component: string,
  transitionSpeed: keyof typeof shadowTransition = 'default'
): string => {
  const shadow = getComponentShadow(component);
  const transition = getShadowTransition(transitionSpeed);
  return shadow.hover ? `hover:${shadow.hover} ${transition}` : '';
};

// ============================================================================
// EXPORTS
// ============================================================================

export type ElevationLevel = keyof typeof elevationLevels;
export type ComponentShadowName = keyof typeof componentShadows;
export type ShadowTransitionSpeed = keyof typeof shadowTransition;
