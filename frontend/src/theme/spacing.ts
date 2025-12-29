/**
 * LootLook Design System - Spacing & Layout
 *
 * Generous negative space for minimalist luxury feel.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const iconSize = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
} as const;

// Layout constants
export const layout = {
  // Screen padding
  screenPadding: spacing.lg,

  // Card padding
  cardPadding: spacing.md,

  // Bottom tab bar height
  tabBarHeight: 84,

  // Header height
  headerHeight: 56,

  // Shutter button size
  shutterSize: 72,
  shutterInnerSize: 58,

  // Thumbnail sizes
  thumbnailSmall: 56,
  thumbnailMedium: 80,
  thumbnailLarge: 120,
} as const;

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
