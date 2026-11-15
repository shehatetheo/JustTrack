import { Platform, StyleSheet, type StyleProp, type TextStyle } from 'react-native';

/**
 * The type faces. Each weight is its own family, loaded from assets/fonts,
 * because a custom font can't be asked for "bold" reliably on every platform.
 * Text components pass their style through `resolveFont`, which swaps a
 * `fontWeight` for the matching face.
 */
export const FONT_FILES = {
  'Inter-Regular': require('@/assets/fonts/Inter-Regular.ttf'),
  'Inter-Medium': require('@/assets/fonts/Inter-Medium.ttf'),
  'Inter-SemiBold': require('@/assets/fonts/Inter-SemiBold.ttf'),
  'Inter-Bold': require('@/assets/fonts/Inter-Bold.ttf'),
  'Inter-ExtraBold': require('@/assets/fonts/Inter-ExtraBold.ttf'),
  'Cinzel-SemiBold': require('@/assets/fonts/Cinzel-SemiBold.ttf'),
  'Cinzel-Bold': require('@/assets/fonts/Cinzel-Bold.ttf'),
  'CormorantGaramond-MediumItalic': require('@/assets/fonts/CormorantGaramond-MediumItalic.ttf'),
  'UnifrakturMaguntia-Regular': require('@/assets/fonts/UnifrakturMaguntia-Regular.ttf'),
} as const;

export const Fonts = {
  body: 'Inter-Regular',
  bodyMedium: 'Inter-Medium',
  bodySemiBold: 'Inter-SemiBold',
  bodyBold: 'Inter-Bold',
  bodyHeavy: 'Inter-ExtraBold',
  /** Classic serif capitals for titles. Its lowercase letters are small caps, so titles can be written in lowercase. */
  display: 'Cinzel-SemiBold',
  displayBold: 'Cinzel-Bold',
  /** One italic line under a header. */
  tagline: 'CormorantGaramond-MediumItalic',
  /** Blackletter. Decoration only: welcome, empty states, easter eggs. */
  blackletter: 'UnifrakturMaguntia-Regular',
  /** The name "JustTrack" is always Helvetica, from the system. */
  wordmark: Platform.select({ ios: 'Helvetica Neue', default: '"Helvetica Neue", Helvetica, Arial, sans-serif' }) as string,
} as const;

const INTER_BY_WEIGHT: Record<string, string> = {
  '100': Fonts.body,
  '200': Fonts.body,
  '300': Fonts.body,
  '400': Fonts.body,
  normal: Fonts.body,
  '500': Fonts.bodyMedium,
  '600': Fonts.bodySemiBold,
  '700': Fonts.bodyBold,
  bold: Fonts.bodyBold,
  '800': Fonts.bodyHeavy,
  '900': Fonts.bodyHeavy,
};

/**
 * Turns `{ fontWeight: '700' }` on body text into the Inter Bold face, and a
 * heavy weight on a display title into Cinzel Bold. Faces with a single
 * weight (the tagline italic, the blackletter, the wordmark) are left alone.
 */
export function resolveFont(style: StyleProp<TextStyle>): TextStyle {
  const flat = StyleSheet.flatten(style) ?? {};
  const { fontWeight, fontFamily, ...rest } = flat;
  if (fontFamily === Fonts.wordmark) return flat;
  const weight = fontWeight === undefined ? undefined : String(fontWeight);
  if (fontFamily === Fonts.display || fontFamily === Fonts.displayBold) {
    return { ...rest, fontFamily: weight && Number(weight) >= 700 ? Fonts.displayBold : (fontFamily as string) };
  }
  if (fontFamily === Fonts.tagline || fontFamily === Fonts.blackletter) return { ...rest, fontFamily };
  if (!weight) return { ...rest, fontFamily: fontFamily ?? Fonts.body };
  return { ...rest, fontFamily: INTER_BY_WEIGHT[weight] ?? Fonts.body };
}
