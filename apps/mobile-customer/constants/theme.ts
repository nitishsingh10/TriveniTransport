// ─────────────────────────────────────────────────────────────────
// Triveni Transports — Brand Design Tokens
// Perfectly Aligned with Website Design System:
// Crisp Light Canvas (#F8F9FB), Deep Navy (#0D1F37), Rich Marigold (#F7A300)
// ─────────────────────────────────────────────────────────────────

export const Colors = {
  // Canvas & Surfaces (Modern Apple / Linear Minimal Canvas)
  background: '#F8FAFC',        // Ultra-crisp slate canvas
  surface: '#FFFFFF',           // Pure white card background
  surfaceElevated: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  cardBg: '#FFFFFF',
  cardBorder: 'rgba(15, 23, 42, 0.08)',
  cardBorderSubtle: 'rgba(15, 23, 42, 0.04)',

  // Primary Brand (Onyx Slate & Deep Midnight Navy)
  navy: '#0F172A',              // Deep Slate 900
  brandSurface: '#0F172A',      // High-contrast primary surface
  navyDark: '#020617',          // Rich black text Slate 950
  navyLight: '#1E293B',         // Subtle navy Slate 800
  navyMuted: '#475569',         // Muted secondary copy
  navySubtle: 'rgba(15, 23, 42, 0.04)',
  navyBorder: 'rgba(15, 23, 42, 0.08)',

  // Accent Brand (Refined Warm Amber / Gold - restrained luxury)
  marigold: '#F59E0B',          // Refined Amber Gold
  marigoldLight: '#FBBF24',     // Warm highlight
  marigoldDark: '#D97706',      // Deep warm amber
  marigoldSubtle: 'rgba(245, 158, 11, 0.09)',
  marigoldBorder: 'rgba(245, 158, 11, 0.24)',

  // Typography & Content
  text: '#0F172A',              // Primary heading / bold text
  textSecondary: '#475569',     // Supporting body copy
  textMuted: '#94A3B8',         // Captions and placeholders
  white: '#FFFFFF',

  // Semantic Status
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.10)',
  successBorder: 'rgba(16, 185, 129, 0.25)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.10)',
  warningBorder: 'rgba(245, 158, 11, 0.25)',
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.10)',
  errorBorder: 'rgba(239, 68, 68, 0.25)',
  info: '#3B82F6',
  infoLight: 'rgba(59, 130, 246, 0.10)',
  infoBorder: 'rgba(59, 130, 246, 0.25)',

  // Navigation, Headers & Tab Bar
  headerBackground: '#FFFFFF',
  headerBorder: 'rgba(15, 23, 42, 0.06)',
  tabBackground: '#FFFFFF',
  tabBorder: 'rgba(15, 23, 42, 0.06)',
  tabActive: '#0F172A',
  tabActiveAccent: '#F59E0B',
  tabInactive: '#94A3B8',

  // Form Inputs
  inputBg: '#FFFFFF',
  inputBorder: '#E2E8F0',
  inputText: '#0F172A',
  inputPlaceholder: '#94A3B8',

  // Glass / Overlay Tokens
  glass: 'rgba(255, 255, 255, 0.90)',
  glassBorder: 'rgba(15, 23, 42, 0.08)',
  glassLight: 'rgba(255, 255, 255, 0.82)',
  glassLightBorder: 'rgba(255, 255, 255, 0.65)',
  glassDark: 'rgba(15, 23, 42, 0.90)',
  glassDarkBorder: 'rgba(255, 255, 255, 0.14)',
  glassMarigold: 'rgba(245, 158, 11, 0.12)',
  glassMarigoldBorder: 'rgba(245, 158, 11, 0.30)',
  overlay: 'rgba(15, 23, 42, 0.45)',

  // Custom Triveni Map Theme
  mapBg: '#091524',
  mapRoads: '#1A2E46',
  mapRoadsHighlight: '#2A4365',
  mapWater: '#060E18',
  mapLand: '#0D1D30',
  mapAccent: '#F59E0B',
  mapAccentGlow: 'rgba(245, 158, 11, 0.45)',
  mapPinNavy: '#0F172A',
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 26,
  full: 9999,
} as const;

export const FontSize = {
  xxs: 11,
  xs: 13,
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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  glow: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  glowSm: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  glass: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  glassGlowGold: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 5,
  },
} as const;

export type ThemeColors = { [Key in keyof typeof Colors]: string };
export type ThemeMode = 'light' | 'dark';

export const LightColors: ThemeColors = Colors;
export const DarkColors: ThemeColors = {
  ...Colors,
  background: '#070C14',
  surface: '#0F1726',
  surfaceElevated: '#172236',
  surfaceSubtle: '#131C2D',
  cardBg: '#0F1726',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  cardBorderSubtle: 'rgba(255, 255, 255, 0.04)',
  navy: '#0F172A',
  navyDark: '#F8FAFC',
  navyLight: '#CBD5E1',
  navyMuted: '#94A3B8',
  navySubtle: 'rgba(255, 255, 255, 0.05)',
  navyBorder: 'rgba(255, 255, 255, 0.10)',
  brandSurface: '#172236',
  marigoldDark: '#FBBF24',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  successLight: 'rgba(52, 211, 153, 0.14)',
  successBorder: 'rgba(52, 211, 153, 0.25)',
  warningLight: 'rgba(251, 191, 36, 0.14)',
  warningBorder: 'rgba(251, 191, 36, 0.25)',
  errorLight: 'rgba(248, 113, 113, 0.14)',
  errorBorder: 'rgba(248, 113, 113, 0.25)',
  infoLight: 'rgba(96, 165, 250, 0.14)',
  infoBorder: 'rgba(96, 165, 250, 0.25)',
  headerBackground: '#070C14',
  headerBorder: 'rgba(255, 255, 255, 0.07)',
  tabBackground: '#070C14',
  tabBorder: 'rgba(255, 255, 255, 0.07)',
  tabActive: '#F8FAFC',
  tabInactive: '#64748B',
  inputBg: '#0F1726',
  inputBorder: '#1E293B',
  inputText: '#F8FAFC',
  inputPlaceholder: '#64748B',
  glass: 'rgba(15, 23, 38, 0.92)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
  glassLight: 'rgba(15, 23, 38, 0.85)',
  glassLightBorder: 'rgba(255, 255, 255, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.70)',
};

export const ThemeColorsByMode: Record<ThemeMode, ThemeColors> = {
  light: LightColors,
  dark: DarkColors,
};
