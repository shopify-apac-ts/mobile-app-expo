/**
 * Horizon 3.1.0 design tokens ported to React Native.
 *
 * Source: dev-nobu-beer-store.myshopify.com — Horizon theme v3.1.0 (color-scheme-1).
 * Notable: Noto Sans Japanese for everything, weight 400 even for headings
 * (no bold by default), selected variants use SOLID BLACK background with
 * white text — not orange.
 */

export const colors = {
  // Surface
  background: "#ffffff",
  surface: "#fafafa",
  foreground: "rgba(0,0,0,0.81)",
  foregroundHeading: "#000000",
  foregroundMuted: "rgba(0,0,0,0.60)",
  border: "rgba(0,0,0,0.06)",
  borderStrong: "rgba(0,0,0,0.13)",

  // Primary button (e.g. add to cart, save)
  primaryButtonBg: "#000000",
  primaryButtonText: "#ffffff",
  primaryButtonBorder: "#000000",
  primaryButtonHoverBg: "#333333",

  // Secondary button
  secondaryButtonBg: "rgba(0,0,0,0.06)",
  secondaryButtonText: "#000000",
  secondaryButtonBorder: "rgba(0,0,0,0.06)",

  // Inputs
  inputBg: "#ffffff",
  inputText: "#333333",
  inputBorder: "#f5f5f5",
  inputBorderFocus: "rgba(0,0,0,0.13)",

  // Variants (Horizon signature pattern)
  variantBg: "#ffffff",
  variantText: "#000000",
  variantBorder: "#e6e6e6",
  selectedVariantBg: "#000000",
  selectedVariantText: "#ffffff",
  selectedVariantBorder: "#000000",

  // Status
  danger: "#b91c1c",
  dangerSoft: "#fef2f2",
  success: "#15803d",
  successSoft: "#f0fdf4",
  disabled: "rgba(0,0,0,0.20)",
  disabledBg: "rgba(0,0,0,0.04)",
} as const;

/**
 * Font families. Loaded via expo-google-fonts in app/_layout.tsx.
 */
export const fontFamily = {
  regular: "NotoSansJP_400Regular",
  medium: "NotoSansJP_500Medium",
  bold: "NotoSansJP_700Bold",
} as const;

/**
 * Font sizes (mobile-tuned). Horizon's web paragraph is 14px which is too
 * small for native mobile; ~1.2× scaled to 17px as the body default, with
 * heading sizes following Horizon's hierarchy.
 */
export const fontSize = {
  "2xs": 11,
  xs: 13,
  sm: 15,
  md: 17,
  lg: 19,
  xl: 22,
  "2xl": 26,
  "3xl": 32,
  "4xl": 40,
  h1: 32,
  h2: 26,
  h3: 22,
  h4: 19,
  h5: 15,
  h6: 13,
  body: 17,
  caption: 13,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  bold: "700",
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.4,
  loose: 1.6,
} as const;

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
} as const;

export const shadow = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
} as const;

/**
 * Ready-to-spread text style presets.
 */
export const text = {
  h1: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.h1,
    color: colors.foregroundHeading,
    lineHeight: Math.round(fontSize.h1 * lineHeight.tight),
  },
  h2: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.h2,
    color: colors.foregroundHeading,
    lineHeight: Math.round(fontSize.h2 * lineHeight.tight),
  },
  h3: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.h3,
    color: colors.foregroundHeading,
    lineHeight: Math.round(fontSize.h3 * lineHeight.tight),
  },
  h4: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.h4,
    color: colors.foregroundHeading,
    lineHeight: Math.round(fontSize.h4 * lineHeight.normal),
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: colors.foreground,
    lineHeight: Math.round(fontSize.body * lineHeight.loose),
  },
  bodyMuted: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: colors.foregroundMuted,
    lineHeight: Math.round(fontSize.body * lineHeight.loose),
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.foregroundMuted,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: colors.foregroundMuted,
  },
  price: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xl,
    color: colors.foregroundHeading,
  },
} as const;

export const theme = {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  spacing,
  shadow,
  text,
};
