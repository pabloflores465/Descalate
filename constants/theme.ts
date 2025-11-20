/**
 * Theme configuration for Descalate app.
 * Color palette based on register.tsx design.
 */

import { Platform } from 'react-native';

// Primary colors
const primary = '#5a8c6a';
const primaryDark = '#4a7c59';
const primaryLight = '#7dae8e';

// Secondary colors
const secondary = '#4285F4';
const secondaryDark = '#3367D6';

// Neutral colors
const white = '#F0EDE5';
const black = '#000000';
const background = '#f1f8f3';
const surface = '#F0EDE5';
const surfaceElevated = '#F5F3ED';
const surfaceSubdued = '#E8E5DD';

// Text colors
const textPrimary = '#2C3E50';
const textSecondary = '#7F8C8D';
const textDisabled = '#BDC3C7';
const textPlaceholder = '#999999';

// Border colors
const border = '#e0e0e0';
const borderLight = '#ECF0F1';

// Input colors
const inputBackground = '#f5f5f5';
const inputBorder = '#e0e0e0';
const inputBorderFocus = primary;
const inputBorderError = '#E74C3C';

// Status colors
const success = '#2ECC71';
const warning = '#F39C12';
const error = '#E74C3C';
const info = '#4A90E2';

// UI accent colors
const blue = '#4A90E2';
const purple = '#9B59B6';
const green = '#2ECC71';
const orange = '#F39C12';
const red = '#E74C3C';

// Shadow color
const shadow = '#000000';

export const Colors = {
  // Primary palette
  primary,
  primaryDark,
  primaryLight,

  // Secondary palette
  secondary,
  secondaryDark,

  // Base colors
  white,
  black,
  background,
  surface,
  surfaceElevated,
  surfaceSubdued,

  // Text colors
  text: {
    primary: textPrimary,
    secondary: textSecondary,
    disabled: textDisabled,
    placeholder: textPlaceholder,
    inverse: white,
  },

  // Border colors
  border: {
    default: border,
    light: borderLight,
    focus: inputBorderFocus,
    error: inputBorderError,
  },

  // Input colors
  input: {
    background: inputBackground,
    border: inputBorder,
    borderFocus: inputBorderFocus,
    borderError: inputBorderError,
    placeholder: textPlaceholder,
  },

  // Status colors
  status: {
    success,
    warning,
    error,
    info,
  },

  // UI colors
  ui: {
    blue,
    purple,
    green,
    orange,
    red,
  },

  // Tab bar colors
  tab: {
    active: blue,
    inactive: '#95A5A6',
    background: surface,
    border: borderLight,
  },

  // Shadow
  shadow,

  // Google brand color
  google: '#4285F4',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  huge: 40,
  massive: 60,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 30,
  round: 9999,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  huge: 32,
  massive: 48,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadows = {
  small: {
    shadowColor: shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  large: {
    shadowColor: shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  card: {
    shadowColor: shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Common component styles
export const CommonStyles = {
  container: {
    flex: 1,
    backgroundColor: background,
  },

  header: {
    alignItems: 'center' as const,
    paddingTop: Spacing.massive,
    paddingBottom: Spacing.xxxl,
    backgroundColor: surface,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
    ...Shadows.medium,
  },

  card: {
    backgroundColor: surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.card,
  },

  button: {
    primary: {
      backgroundColor: primary,
      borderRadius: BorderRadius.round,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.massive,
    },
    secondary: {
      backgroundColor: secondary,
      borderRadius: BorderRadius.round,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.massive,
    },
  },

  input: {
    borderRadius: BorderRadius.round,
    paddingVertical: 15,
    paddingHorizontal: Spacing.xl,
    backgroundColor: inputBackground,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: border,
  },

  text: {
    title: {
      fontSize: FontSize.huge,
      fontWeight: FontWeight.bold,
      color: textPrimary,
    },
    subtitle: {
      fontSize: FontSize.md,
      color: textSecondary,
    },
    body: {
      fontSize: FontSize.md,
      color: textPrimary,
    },
    label: {
      fontSize: FontSize.md,
      color: textSecondary,
    },
    error: {
      fontSize: FontSize.sm,
      color: error,
    },
  },
};
