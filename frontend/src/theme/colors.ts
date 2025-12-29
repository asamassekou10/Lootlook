/**
 * LootLook Design System - Colors
 * "Bloomberg Terminal for Your Stuff"
 *
 * Minimalist luxury palette with OLED-optimized blacks
 * and sophisticated accent colors.
 */

export const colors = {
  // Backgrounds - OLED optimized
  background: {
    primary: "#000000", // Pure black
    secondary: "#0A0A0A", // Near black (cards)
    elevated: "#141414", // Elevated surfaces
    overlay: "rgba(0, 0, 0, 0.85)", // Modal overlays
  },

  // Text hierarchy
  text: {
    primary: "#FFFFFF", // Pure white
    secondary: "#A1A1AA", // Cool grey (zinc-400)
    tertiary: "#71717A", // Muted grey (zinc-500)
    disabled: "#52525B", // Disabled state (zinc-600)
  },

  // Accent colors - used sparingly
  accent: {
    primary: "#3B82F6", // Slate blue (primary actions)
    primaryMuted: "rgba(59, 130, 246, 0.15)", // Button backgrounds
  },

  // Value indicators
  value: {
    positive: "#10B981", // Emerald green (gains, high confidence)
    positiveMuted: "rgba(16, 185, 129, 0.15)",
    warning: "#F59E0B", // Muted gold (uncertain, medium confidence)
    warningMuted: "rgba(245, 158, 11, 0.15)",
    negative: "#EF4444", // Subdued red (losses, errors)
    negativeMuted: "rgba(239, 68, 68, 0.15)",
  },

  // Borders and dividers
  border: {
    subtle: "#1F1F1F", // Barely visible dividers
    medium: "#27272A", // Card borders
    strong: "#3F3F46", // Emphasized borders
  },

  // Utility
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
} as const;

export type Colors = typeof colors;
