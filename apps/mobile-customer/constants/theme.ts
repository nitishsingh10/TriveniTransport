// ─────────────────────────────────────────────────────────────────
// Triveni Transports — Brand Design Tokens
// Perfectly Aligned with Website Design System:
// Crisp Light Canvas (#F8F9FB), Deep Navy (#0D1F37), Rich Marigold (#F7A300)
// ─────────────────────────────────────────────────────────────────

export const Colors = {
  // Canvas & Surfaces (Matching web globals.css & login/bookings pages)
  background: '#F8FAFC',        // Ultra-clean light canvas
  surface: '#FFFFFF',           // Pure white card background
  surfaceElevated: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  cardBg: '#FFFFFF',
  cardBorder: 'rgba(13, 31, 55, 0.06)',
  cardBorderSubtle: 'rgba(13, 31, 55, 0.04)',

  // Primary Brand (Deep Navy palette from web --brand-*)
  navy: '#0D1F37',              // Core Logo Navy (--brand-700)
  brandSurface: '#0D1F37',      // Brand surface with legible inverse text
  navyDark: '#050D17',          // Deep text navy (--brand-900)
  navyLight: '#1C385B',         // Hover/accent navy (--brand-600)
  navyMuted: '#486581',         // Muted navy (--brand-500)
  navySubtle: 'rgba(13, 31, 55, 0.05)',
  navyBorder: 'rgba(13, 31, 55, 0.10)',

  // Accent Brand (Rich Marigold from web --accent-*)
  marigold: '#F7A300',          // Core Logo Yellow-Orange (--accent-500)
  marigoldLight: '#FFB830',     // Warm gold highlight
  marigoldDark: '#D98C00',      // Deep amber
  marigoldSubtle: 'rgba(247, 163, 0, 0.12)',
  marigoldBorder: 'rgba(247, 163, 0, 0.35)',

  // Typography & Content
  text: '#0D1F37',              // Primary heading / bold text
  textSecondary: '#486581',     // Supporting body copy
  textMuted: '#829AB1',         // Captions and placeholders
  white: '#FFFFFF',

  // Semantic Status
  success: '#16A34A',
  successLight: 'rgba(22, 163, 74, 0.10)',
  successBorder: 'rgba(22, 163, 74, 0.30)',
  warning: '#D97706',
  warningLight: 'rgba(217, 119, 6, 0.10)',
  warningBorder: 'rgba(217, 119, 6, 0.30)',
  error: '#DC2626',
  errorLight: 'rgba(220, 38, 38, 0.10)',
  errorBorder: 'rgba(220, 38, 38, 0.30)',
  info: '#2563EB',
  infoLight: 'rgba(37, 99, 235, 0.10)',
  infoBorder: 'rgba(37, 99, 235, 0.30)',

  // Navigation, Headers & Tab Bar (Matching web navbar)
  headerBackground: 'rgba(252, 251, 250, 0.98)',
  headerBorder: 'rgba(13, 31, 55, 0.08)',
  tabBackground: '#FFFFFF',
  tabBorder: 'rgba(13, 31, 55, 0.08)',
  tabActive: '#0D1F37',
  tabActiveAccent: '#F7A300',
  tabInactive: '#829AB1',

  // Form Inputs
  inputBg: '#FFFFFF',
  inputBorder: '#D9E2EC',
  inputText: '#0D1F37',
  inputPlaceholder: '#9FB3C8',

  // Glass / Overlay Tokens
  glass: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(13, 31, 55, 0.08)',
  glassLight: 'rgba(255, 255, 255, 0.78)',
  glassLightBorder: 'rgba(255, 255, 255, 0.60)',
  glassDark: 'rgba(13, 31, 55, 0.88)',
  glassDarkBorder: 'rgba(255, 255, 255, 0.16)',
  glassMarigold: 'rgba(247, 163, 0, 0.16)',
  glassMarigoldBorder: 'rgba(247, 163, 0, 0.38)',
  overlay: 'rgba(13, 31, 55, 0.45)',

  // Custom Uber-like Triveni Map Theme
  mapBg: '#091524',
  mapRoads: '#1A2E46',
  mapRoadsHighlight: '#2A4365',
  mapWater: '#060E18',
  mapLand: '#0D1D30',
  mapAccent: '#F7A300',
  mapAccentGlow: 'rgba(247, 163, 0, 0.45)',
  mapPinNavy: '#0D1F37',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 22,
  full: 9999,
} as const;

export const FontSize = {
  xxs: 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
  xxxl: 32,
  display: 40,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 6,
  },
  glow: {
    shadowColor: '#F7A300',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  glowSm: {
    shadowColor: '#F7A300',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  glass: {
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  glassGlowGold: {
    shadowColor: '#F7A300',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
} as const;

export type ThemeColors = { [Key in keyof typeof Colors]: string };
export type ThemeMode = 'light' | 'dark';

export const LightColors: ThemeColors = Colors;
export const DarkColors: ThemeColors = {
  ...Colors,
  background: '#0A1019',
  surface: '#111A26',
  surfaceElevated: '#182333',
  surfaceSubtle: '#151F2D',
  cardBg: '#111A26',
  cardBorder: 'rgba(220, 232, 246, 0.10)',
  cardBorderSubtle: 'rgba(220, 232, 246, 0.07)',
  navy: '#0D1F37',
  navyDark: '#F4F7FB',
  navyLight: '#AFC2DA',
  navyMuted: '#A1B2C7',
  navySubtle: 'rgba(216, 227, 241, 0.08)',
  navyBorder: 'rgba(216, 227, 241, 0.14)',
  brandSurface: '#1A2A40',
  marigoldDark: '#FFC04D',
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  text: '#F4F7FB',
  textSecondary: '#B4C0D0',
  textMuted: '#8492A5',
  successLight: 'rgba(34, 197, 94, 0.16)',
  successBorder: 'rgba(74, 222, 128, 0.30)',
  warningLight: 'rgba(245, 158, 11, 0.16)',
  warningBorder: 'rgba(251, 191, 36, 0.30)',
  errorLight: 'rgba(239, 68, 68, 0.16)',
  errorBorder: 'rgba(248, 113, 113, 0.30)',
  infoLight: 'rgba(59, 130, 246, 0.16)',
  infoBorder: 'rgba(96, 165, 250, 0.30)',
  headerBackground: '#0D1520',
  headerBorder: 'rgba(220, 232, 246, 0.10)',
  tabBackground: '#0D1520',
  tabBorder: 'rgba(220, 232, 246, 0.10)',
  tabActive: '#F4F7FB',
  tabInactive: '#8492A5',
  inputBg: '#0D1520',
  inputBorder: '#2B384B',
  inputText: '#F4F7FB',
  inputPlaceholder: '#8492A5',
  glass: 'rgba(17, 26, 38, 0.92)',
  glassBorder: 'rgba(220, 232, 246, 0.12)',
  glassLight: 'rgba(17, 26, 38, 0.86)',
  glassLightBorder: 'rgba(220, 232, 246, 0.10)',
  overlay: 'rgba(0, 0, 0, 0.62)',
};

export const ThemeColorsByMode: Record<ThemeMode, ThemeColors> = {
  light: LightColors,
  dark: DarkColors,
};
