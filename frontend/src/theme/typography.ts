/**
 * LootLook Design System - Typography
 *
 * Uses SF Pro (iOS system font) for premium feel.
 * Thin weights for hero prices, semibold for labels.
 */

import { TextStyle, Platform } from "react-native";

// System font family
const fontFamily = Platform.select({
  ios: "System",
  android: "Roboto",
  default: "System",
});

export const typography = {
  // Hero price display - thin and elegant
  priceHero: {
    fontFamily,
    fontSize: 48,
    fontWeight: "200" as TextStyle["fontWeight"],
    letterSpacing: -1,
    lineHeight: 56,
  },

  // Large value displays
  valueLarge: {
    fontFamily,
    fontSize: 36,
    fontWeight: "300" as TextStyle["fontWeight"],
    letterSpacing: -0.5,
    lineHeight: 44,
  },

  // Medium value displays
  valueMedium: {
    fontFamily,
    fontSize: 28,
    fontWeight: "300" as TextStyle["fontWeight"],
    letterSpacing: -0.3,
    lineHeight: 34,
  },

  // Screen titles
  title: {
    fontFamily,
    fontSize: 20,
    fontWeight: "600" as TextStyle["fontWeight"],
    letterSpacing: 0,
    lineHeight: 28,
  },

  // Section headers
  heading: {
    fontFamily,
    fontSize: 17,
    fontWeight: "600" as TextStyle["fontWeight"],
    letterSpacing: 0,
    lineHeight: 24,
  },

  // Body text
  body: {
    fontFamily,
    fontSize: 16,
    fontWeight: "400" as TextStyle["fontWeight"],
    letterSpacing: 0,
    lineHeight: 24,
  },

  // Secondary body text
  bodySmall: {
    fontFamily,
    fontSize: 14,
    fontWeight: "400" as TextStyle["fontWeight"],
    letterSpacing: 0,
    lineHeight: 20,
  },

  // Labels - uppercase, tracked
  label: {
    fontFamily,
    fontSize: 12,
    fontWeight: "500" as TextStyle["fontWeight"],
    letterSpacing: 0.8,
    lineHeight: 16,
    textTransform: "uppercase" as TextStyle["textTransform"],
  },

  // Small labels
  labelSmall: {
    fontFamily,
    fontSize: 10,
    fontWeight: "500" as TextStyle["fontWeight"],
    letterSpacing: 0.5,
    lineHeight: 14,
    textTransform: "uppercase" as TextStyle["textTransform"],
  },

  // Captions and metadata
  caption: {
    fontFamily,
    fontSize: 12,
    fontWeight: "400" as TextStyle["fontWeight"],
    letterSpacing: 0.2,
    lineHeight: 16,
  },

  // Button text
  button: {
    fontFamily,
    fontSize: 16,
    fontWeight: "600" as TextStyle["fontWeight"],
    letterSpacing: 0,
    lineHeight: 24,
  },

  // Small button text
  buttonSmall: {
    fontFamily,
    fontSize: 14,
    fontWeight: "600" as TextStyle["fontWeight"],
    letterSpacing: 0,
    lineHeight: 20,
  },
} as const;

export type Typography = typeof typography;
