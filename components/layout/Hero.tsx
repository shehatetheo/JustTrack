import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedBackground } from '@/components/background/AnimatedBackground';
import type { BackgroundPage } from '@/components/background/pages';
import { HAIRLINE, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useLightStatusBar } from '@/lib/statusBar';

interface HeroProps {
  page: BackgroundPage;
  /** How strongly the art shows. Profile uses 0.4. */
  artOpacity?: number;
  /** Extra darkening over the art where the content sits, 0–1. */
  veil?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * The head of every main screen: the page's collage artwork with the
 * screen's headline content laid over it. The art hangs from the top and
 * fades to black at the foot, so text on it always has a dark ground. In
 * Gothic that black is the page itself; in Parchment the hero is a dark
 * window set into the paper.
 */
export function Hero({ page, artOpacity = 1, veil = 0.25, style, children }: HeroProps) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  useLightStatusBar();
  const clear = 'transparent';

  return (
    <View style={[styles.hero, { backgroundColor: colors.hero, paddingTop: insets.top + Spacing.md }, !isDark && [styles.window, { borderColor: colors.borderAccent }], style]}>
      <AnimatedBackground page={page} opacity={artOpacity} />
      {/* A wash over everything so content never fights the art, a deeper band behind the status bar and title, and a fade to black at the foot. */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.hero, opacity: veil }]} />
      <LinearGradient pointerEvents="none" colors={[colors.hero, clear]} style={[styles.topScrim, { height: insets.top + 96 }]} />
      <LinearGradient pointerEvents="none" colors={[clear, colors.hero]} locations={[0, 0.82]} style={styles.footScrim} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, overflow: 'hidden' },
  window: { borderBottomLeftRadius: Radii['2xl'] + 8, borderBottomRightRadius: Radii['2xl'] + 8, borderBottomWidth: HAIRLINE, borderLeftWidth: HAIRLINE, borderRightWidth: HAIRLINE },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 0.85 },
  footScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%' },
});
