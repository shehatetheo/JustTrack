import type { TextStyle, ViewStyle } from 'react-native';

import { Fonts } from '@/constants/fonts';

/**
 * JustTrack design tokens: a gothic collage world in three colours. Black is
 * the page, lavender is the light, white is the ink. Collage art lives at
 * the edges; numbers and controls sit on clean dark panels.
 *
 * "Gothic" is the dark theme and the main look. "Parchment" is the light
 * theme: aged paper, black ink, the same lavender. Every screen and
 * component takes its colours, type, spacing, radii and glows from here.
 */

export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  /** The page. */
  background: string;
  /** The wall behind the phone-width column on wide screens. */
  backdrop: string;
  /** A panel: cards, list sections, tiles. */
  surface: string;
  /** A panel on a panel, an input, a pressed row, a sheet. */
  surfaceRaised: string;
  /** Hairlines. */
  border: string;
  /** The edge of a panel that should catch the light. */
  borderAccent: string;
  /** The faint gloss along the top of a panel. */
  sheen: string;
  text: string;
  textSecondary: string;
  /** Labels and captions only; never body copy. */
  textTertiary: string;
  /** Lavender: fills, rings, focus lines, the active thing. */
  accent: string;
  /** Deeper lavender: pressed states, the lower edge of a glossy capsule, glows. */
  accentDeep: string;
  /** Lavender dark enough to read as text on this theme's page. */
  accentText: string;
  /** Text and icons on a lavender fill. */
  onAccent: string;
  /** Text and icons over the hero artwork, which is dark in both themes. */
  onHero: string;
  onHeroMuted: string;
  /** Empty tracks behind rings and bars. */
  track: string;
  /** Collage linework: flourishes, scribbles, filigree, stamps. */
  ink: string;
  /** Quieter collage linework, for decoration that sits behind content. */
  inkFaint: string;
  /** The colour light pools in behind a headline number. */
  glow: string;
  /** What art fades into so text over it stays readable. */
  scrim: string;
  /** A dark disc behind a control that sits on a photo or the camera. */
  photoPlate: string;
  /** The curtain behind sheets and dialogs. */
  curtain: string;
  /** The three macros share the palette; fat is drawn hatched so it never relies on colour. */
  protein: string;
  carbs: string;
  fat: string;
  tabBarBackground: string;
  tabBarBorder: string;
  tabIconDefault: string;
  tabIconSelected: string;
}

/** True black for ink and the page. */
export const INK = '#0A0A0B';
export const LAVENDER = '#C9B8FF';
export const LAVENDER_DEEP = '#9D86F0';
export const PAPER = '#F2EFE8';

export const Colors: Record<ColorScheme, ThemeColors> = {
  dark: {
    background: INK,
    backdrop: '#000000',
    surface: '#141218',
    surfaceRaised: '#1C1922',
    border: '#3A3640',
    borderAccent: 'rgba(201,184,255,0.35)',
    sheen: 'rgba(255,255,255,0.08)',
    text: '#FFFFFF',
    textSecondary: '#B8B5BF',
    textTertiary: '#7E7A86',
    accent: LAVENDER,
    accentDeep: LAVENDER_DEEP,
    accentText: LAVENDER,
    onAccent: INK,
    onHero: '#FFFFFF',
    onHeroMuted: '#B8B5BF',
    track: '#2A2630',
    ink: '#FFFFFF',
    inkFaint: 'rgba(255,255,255,0.28)',
    glow: 'rgba(157,134,240,0.55)',
    scrim: INK,
    photoPlate: 'rgba(10,10,11,0.62)',
    curtain: 'rgba(0,0,0,0.72)',
    protein: LAVENDER,
    carbs: '#FFFFFF',
    fat: LAVENDER,
    tabBarBackground: 'rgba(16,14,20,0.86)',
    tabBarBorder: 'rgba(201,184,255,0.45)',
    tabIconDefault: '#7E7A86',
    tabIconSelected: '#FFFFFF',
  },
  light: {
    background: PAPER,
    backdrop: '#DAD5C8',
    surface: '#EAE6DC',
    surfaceRaised: '#E1DCCF',
    border: '#C9C3B5',
    borderAccent: 'rgba(106,80,214,0.4)',
    sheen: 'rgba(255,255,255,0.6)',
    text: INK,
    textSecondary: '#4A4650',
    textTertiary: '#6B6672',
    accent: LAVENDER_DEEP,
    accentDeep: '#6A50D6',
    accentText: '#6A50D6',
    onAccent: INK,
    onHero: '#FFFFFF',
    onHeroMuted: '#B8B5BF',
    track: '#D5CFC1',
    ink: INK,
    inkFaint: 'rgba(10,10,11,0.3)',
    glow: 'rgba(157,134,240,0.45)',
    scrim: PAPER,
    photoPlate: 'rgba(10,10,11,0.62)',
    curtain: 'rgba(10,10,11,0.55)',
    protein: LAVENDER_DEEP,
    carbs: INK,
    fat: LAVENDER_DEEP,
    tabBarBackground: 'rgba(242,239,232,0.9)',
    tabBarBorder: 'rgba(106,80,214,0.45)',
    tabIconDefault: '#6B6672',
    tabIconSelected: INK,
  },
};

/** An 8-point grid, with 4 as the half step. */
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

/** Cut corners more than bubbles: chips are nearly square, panels are tight, only capsules are round. */
export const Radii = {
  sm: 4,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 16,
  full: 999,
} as const;

/** One hairline everywhere. */
export const HAIRLINE = 1;

/** Nothing smaller than this is tappable. */
export const MIN_TAP = 44;

/** The app renders as a phone-width column on wide screens. */
export const CONTENT_MAX_WIDTH = 480;

type TypographyToken = Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontFamily' | 'letterSpacing'>;

export const Typography = {
  /** The giant "kcal left" number. */
  display: { fontSize: 84, lineHeight: 88, fontFamily: Fonts.bodyHeavy, letterSpacing: -3 },
  /** Screen titles and big words: spaced serif capitals. */
  largeTitle: { fontSize: 28, lineHeight: 36, fontFamily: Fonts.displayBold, letterSpacing: 3 },
  title1: { fontSize: 24, lineHeight: 31, fontFamily: Fonts.displayBold, letterSpacing: 2 },
  title2: { fontSize: 20, lineHeight: 26, fontFamily: Fonts.display, letterSpacing: 2 },
  title3: { fontSize: 16, lineHeight: 22, fontFamily: Fonts.display, letterSpacing: 2.5 },
  /** Row titles and anything read at a glance stay in the sans. */
  headline: { fontSize: 17, lineHeight: 22, fontFamily: Fonts.bodySemiBold, letterSpacing: -0.2 },
  body: { fontSize: 17, lineHeight: 23, fontFamily: Fonts.body, letterSpacing: -0.2 },
  bodyEmphasized: { fontSize: 17, lineHeight: 23, fontFamily: Fonts.bodySemiBold, letterSpacing: -0.2 },
  callout: { fontSize: 16, lineHeight: 21, fontFamily: Fonts.body, letterSpacing: -0.1 },
  subhead: { fontSize: 15, lineHeight: 20, fontFamily: Fonts.body, letterSpacing: -0.1 },
  subheadEmphasized: { fontSize: 15, lineHeight: 20, fontFamily: Fonts.bodySemiBold, letterSpacing: -0.1 },
  footnote: { fontSize: 13, lineHeight: 18, fontFamily: Fonts.body, letterSpacing: 0 },
  caption1: { fontSize: 12, lineHeight: 16, fontFamily: Fonts.body, letterSpacing: 0 },
  caption2: { fontSize: 11, lineHeight: 14, fontFamily: Fonts.bodyMedium, letterSpacing: 0.1 },
  /** Small tracked capitals above a section or a figure. Callers pass the text already uppercased. */
  overline: { fontSize: 11, lineHeight: 14, fontFamily: Fonts.bodyBold, letterSpacing: 1.6 },
  /** The italic line under a header. */
  tagline: { fontSize: 17, lineHeight: 22, fontFamily: Fonts.tagline, letterSpacing: 0.2 },
  /** Blackletter, for decoration only. */
  blackletter: { fontSize: 30, lineHeight: 38, fontFamily: Fonts.blackletter, letterSpacing: 0.5 },
  /** "JustTrack", always in Helvetica. */
  wordmark: { fontSize: 20, lineHeight: 24, fontFamily: Fonts.wordmark, letterSpacing: -0.4 },
} as const satisfies Record<string, TypographyToken>;

export type TypographyVariant = keyof typeof Typography;

type ShadowToken = Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'>;

/**
 * Depth is light, not shadow. `sm` is a faint lift for a pressed-in panel,
 * `md` the drop under a raised capsule, `lg` the lavender glow under the
 * things that float (the tab bar, the scan button, a sheet).
 */
export const Shadows: Record<ColorScheme, Record<'sm' | 'md' | 'lg', ShadowToken>> = {
  dark: {
    sm: { shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.5, shadowRadius: 3, elevation: 1 },
    md: { shadowColor: LAVENDER_DEEP, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 4 },
    lg: { shadowColor: LAVENDER_DEEP, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.45, shadowRadius: 22, elevation: 10 },
  },
  light: {
    sm: { shadowColor: INK, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 1 },
    md: { shadowColor: '#6A50D6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 12, elevation: 4 },
    lg: { shadowColor: '#6A50D6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.28, shadowRadius: 22, elevation: 10 },
  },
};

/** The glossy lavender capsule, top to bottom: a bright lip, the body, a darker foot. */
export const Gloss = {
  capsule: ['#E4DAFF', LAVENDER, LAVENDER_DEEP] as const,
  capsulePressed: [LAVENDER, LAVENDER_DEEP, '#7C66D6'] as const,
  /** The highlight laid over the top half of anything glossy. */
  highlight: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)'] as const,
} as const;
