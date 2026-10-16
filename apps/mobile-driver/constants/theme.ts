// ─────────────────────────────────────────────────────────────────
// Triveni Transports — Brand Design Tokens for Driver App
// Perfectly Aligned with Website & Customer App Design System:
// Crisp Light Canvas (#F0F4F8), Deep Navy (#0D1F37), Rich Marigold (#F7A300)
// ─────────────────────────────────────────────────────────────────

export const Colors = {
  // Canvas & Surfaces
  background: '#F0F4F8',        // Clean light canvas (--brand-50 / --gray-50)
  surface: '#FFFFFF',           // Pure white card background
  surfaceElevated: '#FFFFFF',
  surfaceSubtle: '#F8FAFC',
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',
  cardBorderSubtle: '#EDF2F7',

  // Primary Brand (Deep Navy palette)
  navy: '#0D1F37',              // Core Logo Navy
  navyDark: '#050D17',          // Deep text navy
  navyLight: '#1C385B',         // Hover/accent navy
  navyMuted: '#486581',         // Muted navy
  navySubtle: 'rgba(13, 31, 55, 0.05)',
  navyBorder: 'rgba(13, 31, 55, 0.10)',

  // Accent Brand (Rich Marigold)
  marigold: '#F7A300',          // Core Logo Yellow-Orange
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

  // Navigation, Headers & Tab Bar
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
  overlay: 'rgba(13, 31, 55, 0.45)',
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
  xxl: 28,
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
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0D1F37',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
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
} as const;
