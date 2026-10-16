/**
 * Triveni Transports — Mobile Theme & Design Tokens
 * Harmonized with Deep Navy (#0D1F37) and Marigold (#F7A300)
 */

export const colors = {
  brand: {
    50: '#f0f4f8',
    100: '#d9e2ec',
    200: '#bcccdc',
    300: '#9fb3c8',
    400: '#829ab1',
    500: '#486581',
    600: '#1c385b',
    700: '#0D1F37', // Core Navy
    800: '#0a1729',
    900: '#050d17',
  },
  accent: {
    50: '#fffaf0',
    100: '#feebc8',
    200: '#fbd38d',
    300: '#f6ad55',
    400: '#ed8936',
    500: '#F7A300', // Core Marigold
    600: '#dd6b20',
    700: '#c05621',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  success: {
    light: '#dcfce7',
    main: '#22c55e',
    dark: '#15803d',
  },
  warning: {
    light: '#fef9c3',
    main: '#eab308',
    dark: '#a16207',
  },
  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#b91c1c',
  },
  surface: '#ffffff',
  background: '#f8fafc',
  text: {
    primary: '#0D1F37',
    secondary: '#4b5563',
    muted: '#9ca3af',
    inverse: '#ffffff',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radii = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
};
