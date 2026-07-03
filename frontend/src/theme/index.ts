export const colors = {
  surface: "#F9FAFA",
  onSurface: "#1C2024",

  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#1C2024",

  surfaceTertiary: "#F1F3F5",
  onSurfaceTertiary: "#495057",

  surfaceInverse: "#1C2024",
  onSurfaceInverse: "#FFFFFF",

  brand: "#0A5237",
  brandPrimary: "#0A5237",
  onBrandPrimary: "#FFFFFF",

  brandSecondary: "#D8991D",
  onBrandSecondary: "#FFFFFF",

  brandTertiary: "#E7F3EF",
  onBrandTertiary: "#0A5237",

  success: "#0D7F54",
  warning: "#E09F1C",
  error: "#C92A2A",

  border: "#E9ECEF",
  borderStrong: "#CED4DA",
  divider: "#F1F3F5",

  muted: "#6C757D",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const typography = {
  display: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.onSurface,
  },
  h1: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.onSurface,
  },
  h2: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.onSurface,
  },
  h3: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.onSurface,
  },
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: colors.onSurface,
  },
  small: {
    fontSize: 12,
    fontWeight: "400" as const,
    color: colors.onSurfaceTertiary,
  },
  numeric: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: colors.brandPrimary,
  },
};

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
};