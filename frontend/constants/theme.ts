// ─────────────────────────────────────────────────────────────
// Design Tokens — single source of truth for all visual decisions
// Adding light theme later: only update lightTheme below
// ─────────────────────────────────────────────────────────────

// Raw palette — never use directly in components, use theme tokens
export const palette = {
  // Neutrals
  black: '#000000',
  white: '#FFFFFF',
  gray950: '#0D0D0D',
  gray900: '#141414',
  gray850: '#181818',
  gray800: '#1E1E1E',
  gray750: '#242424',
  gray700: '#2A2A2A',
  gray600: '#3A3A3A',
  gray500: '#505050',
  gray400: '#6B6B6B',
  gray300: '#888888',
  gray200: '#AAAAAA',
  gray100: '#CCCCCC',
  gray50:  '#E5E5E5',

  // Accents
  lime:        '#C9F31D',
  limeLight:   '#D6FF45',
  limeDim:     '#A8CC0A',
  violet:      '#7B61FF',
  violetLight: '#9B85FF',
  violetDim:   '#5A42D4',

  // Semantic
  red:    '#FF4D4D',
  redDim: '#CC2E2E',
  green:  '#00C48C',
  orange: '#FF8A00',
  blue:   '#4D9EFF',
} as const;

// ─── Dark Theme ───────────────────────────────────────────────
export const darkTheme = {
  // Backgrounds (layered depth system)
  bg:               palette.gray950,   // #0D0D0D  — root screen bg
  bgElevated:       palette.gray900,   // #141414  — drawers, modals
  surface:          palette.gray800,   // #1E1E1E  — cards
  surfaceElevated:  palette.gray750,   // #242424  — nested cards
  surfaceHover:     palette.gray700,   // #2A2A2A  — pressed states

  // Borders
  border:       palette.gray700,  // #2A2A2A
  borderSubtle: palette.gray750,  // #242424

  // Text
  textPrimary:   '#F5F5F5',
  textSecondary: '#888888',
  textTertiary:  '#555555',
  textInverse:   '#0D0D0D',
  textOnAccent:  '#0D0D0D',

  // Accent (lime)
  accent:           palette.lime,
  accentLight:      palette.limeLight,
  accentDim:        palette.limeDim,
  accentMuted:      'rgba(201, 243, 29, 0.12)',
  accentForeground: '#0D0D0D',

  // Secondary accent (violet — for groups/splits)
  secondary:          palette.violet,
  secondaryLight:     palette.violetLight,
  secondaryDim:       palette.violetDim,
  secondaryMuted:     'rgba(123, 97, 255, 0.12)',
  secondaryForeground: '#FFFFFF',

  // Semantic
  expense:        palette.red,
  expenseMuted:   'rgba(255, 77, 77, 0.12)',
  income:         palette.green,
  incomeMuted:    'rgba(0, 196, 140, 0.12)',
  warning:        palette.orange,
  warningMuted:   'rgba(255, 138, 0, 0.12)',
  info:           palette.blue,
  infoMuted:      'rgba(77, 158, 255, 0.12)',

  // Tab bar
  tabBar:        '#111111',
  tabBarBorder:  '#222222',
  tabBarActive:  palette.lime,
  tabBarInactive: palette.gray400,

  // Overlays
  overlay:       'rgba(0, 0, 0, 0.7)',
  overlayLight:  'rgba(0, 0, 0, 0.4)',

  // Shimmer (loading skeletons)
  shimmerBase:     '#1E1E1E',
  shimmerHighlight:'#2A2A2A',
} as const;

// ─── Light Theme ──────────────────────────────────────────────
// Mirrors exact same keys as darkTheme — swap freely by changing scheme
export const lightTheme = {
  bg:               '#F7F7F7',
  bgElevated:       '#FFFFFF',
  surface:          '#FFFFFF',
  surfaceElevated:  '#F2F2F2',
  surfaceHover:     '#E8E8E8',

  border:       '#E0E0E0',
  borderSubtle: '#EFEFEF',

  textPrimary:   '#0D0D0D',
  textSecondary: '#555555',
  textTertiary:  '#888888',
  textInverse:   '#F5F5F5',
  textOnAccent:  '#FFFFFF',

  accent:           '#7BAA00',  // darkened lime for light bg legibility
  accentLight:      palette.limeDim,
  accentDim:        '#5C8000',
  accentMuted:      'rgba(123, 170, 0, 0.10)',
  accentForeground: '#FFFFFF',

  secondary:          palette.violet,
  secondaryLight:     palette.violetLight,
  secondaryDim:       palette.violetDim,
  secondaryMuted:     'rgba(123, 97, 255, 0.10)',
  secondaryForeground:'#FFFFFF',

  expense:        palette.redDim,
  expenseMuted:   'rgba(204, 46, 46, 0.10)',
  income:         palette.green,
  incomeMuted:    'rgba(0, 196, 140, 0.10)',
  warning:        palette.orange,
  warningMuted:   'rgba(255, 138, 0, 0.10)',
  info:           palette.blue,
  infoMuted:      'rgba(77, 158, 255, 0.10)',

  tabBar:        '#FFFFFF',
  tabBarBorder:  '#E0E0E0',
  tabBarActive:  '#7BAA00',
  tabBarInactive: palette.gray400,

  overlay:       'rgba(0, 0, 0, 0.5)',
  overlayLight:  'rgba(0, 0, 0, 0.2)',

  shimmerBase:     '#EEEEEE',
  shimmerHighlight:'#F8F8F8',
} as const;

// ─── Typography ───────────────────────────────────────────────
export const typography = {
  sizes: {
    xs:  11,
    sm:  13,
    md:  15,
    lg:  17,
    xl:  20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  weights: {
    regular:   '400' as const,
    medium:    '500' as const,
    semibold:  '600' as const,
    bold:      '700' as const,
    extrabold: '800' as const,
    black:     '900' as const,
  },
  lineHeights: {
    tight:   1.2,
    snug:    1.35,
    normal:  1.5,
    relaxed: 1.65,
  },
  // Letter spacing in React Native units
  tracking: {
    tight:  -0.5,
    normal:  0,
    wide:    0.5,
    wider:   1,
    widest:  2,
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────────
export const spacing = {
  '0':   0,
  xs:    4,
  sm:    8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  '7xl': 80,
} as const;

// ─── Border Radii ─────────────────────────────────────────────
export const radii = {
  xs:   4,
  sm:   8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// ─── Shadows ──────────────────────────────────────────────────
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  accent: {
    shadowColor: palette.lime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  secondary: {
    shadowColor: palette.violet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// ─── Types ────────────────────────────────────────────────────
export type Theme = typeof darkTheme;
export type ThemeColorName = keyof Theme;
export type ColorScheme = 'dark' | 'light';

// ─── Backward-compat shim for existing useThemeColor hook ─────
export const Colors = {
  dark: {
    text:             darkTheme.textPrimary,
    background:       darkTheme.bg,
    tint:             darkTheme.accent,
    icon:             darkTheme.textSecondary,
    tabIconDefault:   darkTheme.tabBarInactive,
    tabIconSelected:  darkTheme.tabBarActive,
  },
  light: {
    text:             lightTheme.textPrimary,
    background:       lightTheme.bg,
    tint:             lightTheme.accent,
    icon:             lightTheme.textSecondary,
    tabIconDefault:   lightTheme.tabBarInactive,
    tabIconSelected:  lightTheme.tabBarActive,
  },
} as const;
