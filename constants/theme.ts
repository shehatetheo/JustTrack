import type { TextStyle, ViewStyle } from 'react-native';

/**
 * JustTrack design tokens. Dark mode is true black with smoked-glass panels:
 * translucent white fills, hairline edges, white numerals, and the brand
 * violet kept for the few things that should pull the eye. Light mode is the
 * same structure on white under a violet crown.
 */

export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  /** The page behind the phone-width column on wide screens. */
  backdrop: string;
  /** An opaque panel: list sections, sheets. */
  surface: string;
  /** The glass fill for cards and chips. Translucent in dark mode, so it reads as a pane over whatever is behind. */
  surfaceTint: string;
  surfaceTintStrong: string;
  /** Hairline edges. */
  border: string;
  /** The brighter edge that catches light along the top of a glass panel. */
  glassEdge: string;
  /** A soft pool of brand colour behind a headline number, for depth. */
  glow: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  /** Text and icons that sit on the header. */
  onGradient: string;
  onGradientMuted: string;
  /** Text at the foot of the header, where it has faded into the page. */
  onGradientFoot: string;
  onGradientFootMuted: string;
  accent: string;
  /** Empty tracks behind bars and rings. */
  accentMuted: string;
  protein: string;
  carbs: string;
  fat: string;
  success: string;
  warning: string;
  danger: string;
  /** Header gradient, top to bottom. All black in dark mode. */
  gradientStart: string;
  gradientMiddle: string;
  gradientEnd: string;
  tabBarBackground: string;
  tabBarBorder: string;
  tabIconDefault: string;
  tabIconSelected: string;
  fab: string;
  fabIcon: string;
}

/** The darkest ink: text on white, and anything that must read as black. */
export const INK = '#0A0A0B';

export const Colors: Record<ColorScheme, ThemeColors> = {
  light: {
    background: '#FFFFFF',
    backgroundSecondary: '#F3F3F5',
    backdrop: '#E9E9EC',
    surface: '#FFFFFF',
    surfaceTint: '#F4F4F6',
    surfaceTintStrong: '#E8E8EC',
    border: '#E2E2E7',
    glassEdge: 'rgba(255,255,255,0.9)',
    glow: 'rgba(255,255,255,0.22)',
    text: INK,
    textSecondary: '#5C5C63',
    textTertiary: '#85858C',
    textInverse: '#FFFFFF',
    onGradient: '#FFFFFF',
    onGradientMuted: 'rgba(255,255,255,0.74)',
    onGradientFoot: INK,
    onGradientFootMuted: '#5C5C63',
    accent: '#5B3DF5',
    accentMuted: '#E9E9EE',
    protein: '#E8436B',
    carbs: '#EE8F1F',
    fat: '#3F7DF0',
    success: '#16A765',
    warning: '#E08A00',
    danger: '#E0383E',
    gradientStart: '#4525E0',
    gradientMiddle: '#9179FF',
    gradientEnd: '#FFFFFF',
    tabBarBackground: 'rgba(255,255,255,0.78)',
    tabBarBorder: 'rgba(10,10,11,0.1)',
    tabIconDefault: '#77777E',
    tabIconSelected: INK,
    fab: INK,
    fabIcon: '#FFFFFF',
  },
  dark: {
    background: '#000000',
    backgroundSecondary: '#121213',
    backdrop: '#000000',
    surface: '#0C0C0D',
    surfaceTint: 'rgba(255,255,255,0.07)',
    surfaceTintStrong: 'rgba(255,255,255,0.13)',
    border: 'rgba(255,255,255,0.12)',
    glassEdge: 'rgba(255,255,255,0.22)',
    glow: 'rgba(132,104,255,0.34)',
    text: '#FFFFFF',
    textSecondary: '#A6A6AB',
    textTertiary: '#7B7B81',
    textInverse: '#000000',
    onGradient: '#FFFFFF',
    onGradientMuted: 'rgba(255,255,255,0.62)',
    onGradientFoot: '#FFFFFF',
    onGradientFootMuted: 'rgba(255,255,255,0.62)',
    accent: '#9078FF',
    accentMuted: 'rgba(255,255,255,0.1)',
    protein: '#FF5C7C',
    carbs: '#FFB23E',
    fat: '#5EA0FF',
    success: '#32D583',
    warning: '#FFB23E',
    danger: '#FF5A5F',
    gradientStart: '#000000',
    gradientMiddle: '#000000',
    gradientEnd: '#000000',
    tabBarBackground: 'rgba(24,24,26,0.62)',
    tabBarBorder: 'rgba(255,255,255,0.16)',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#FFFFFF',
    fab: '#FFFFFF',
    fabIcon: '#000000',
  },
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

/** Squarer than stock iOS, so panels read as cut glass rather than bubbles. */
export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
} as const;

/** The app renders as a phone-width column on wide screens. */
export const CONTENT_MAX_WIDTH = 480;

type TypographyToken = Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing'>;

export const Typography = {
  /** The giant "kcal left" number. */
  display: { fontSize: 86, lineHeight: 90, fontWeight: '700', letterSpacing: -3.5 },
  largeTitle: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.9 },
  title1: { fontSize: 28, lineHeight: 33, fontWeight: '800', letterSpacing: -0.7 },
  title2: { fontSize: 22, lineHeight: 27, fontWeight: '700', letterSpacing: -0.5 },
  title3: { fontSize: 19, lineHeight: 24, fontWeight: '700', letterSpacing: -0.3 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400', letterSpacing: -0.2 },
  bodyEmphasized: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2 },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400', letterSpacing: -0.1 },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400', letterSpacing: -0.1 },
  subheadEmphasized: { fontSize: 15, lineHeight: 20, fontWeight: '600', letterSpacing: -0.1 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption1: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '500' },
  /** Small capitals above a section or a figure. Callers pass the text already uppercased. */
  overline: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.4 },
} as const satisfies Record<string, TypographyToken>;

export type TypographyVariant = keyof typeof Typography;

type ShadowToken = Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'>;

export const Shadows: Record<ColorScheme, Record<'sm' | 'md' | 'lg', ShadowToken>> = {
  light: {
    sm: { shadowColor: '#0A0A0B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 },
    md: { shadowColor: '#0A0A0B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 4 },
    lg: { shadowColor: '#0A0A0B', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 32, elevation: 10 },
  },
  dark: {
    sm: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 1 },
    md: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 4 },
    lg: { shadowColor: '#000000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.6, shadowRadius: 32, elevation: 10 },
  },
};
