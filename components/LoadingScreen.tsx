import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { MONOGRAM_DRAW_MS, MonogramDraw } from '@/components/brand/MonogramDraw';
import { useMotion } from '@/components/motion';
import { Wordmark } from '@/components/ui/Wordmark';
import { APP_NAME } from '@/constants/brand';
import { Duration, Easings } from '@/constants/motion';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

/** From black to the first screen: the mark is written, a glint crosses it, and the whole plate is cut away on the diagonal. */
export const LAUNCH_MS = MONOGRAM_DRAW_MS + 240;
/** The cut itself. */
export const LAUNCH_EXIT_MS = Duration.standard + 60;

const MARK = 168;

/**
 * What the app opens on. Black, always, in both themes: it continues the
 * splash. The monogram draws on like a pen stroke, a lavender glint sweeps
 * across it, and when `leaving` turns true the screen slashes away to
 * reveal the app underneath.
 */
export function LoadingScreen({ leaving = false }: { leaving?: boolean }) {
  const { colors } = useAppTheme();
  const { reduced } = useMotion();
  const glint = useSharedValue(0);
  const cut = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    glint.set(withDelay(MONOGRAM_DRAW_MS - 80, withTiming(1, { duration: 320, easing: Easings.slash })));
  }, [glint, reduced]);

  useEffect(() => {
    if (leaving) cut.set(withTiming(1, { duration: reduced ? Duration.micro : LAUNCH_EXIT_MS, easing: Easings.slash }));
  }, [cut, leaving, reduced]);

  const glintStyle = useAnimatedStyle(() => ({ opacity: Math.sin(Math.PI * glint.get()), transform: [{ translateX: (glint.get() - 0.5) * MARK * 1.8 }, { rotate: '-24deg' }] }));
  // Two halves of the black plate part along the diagonal; with motion reduced the plate simply fades.
  const upper = useAnimatedStyle(() => (reduced ? { opacity: 1 - cut.get() } : { transform: [{ rotate: '-24deg' }, { translateY: -cut.get() * 1400 }] }));
  const lower = useAnimatedStyle(() => (reduced ? { opacity: 1 - cut.get() } : { transform: [{ rotate: '-24deg' }, { translateY: cut.get() * 1400 }] }));
  const content = useAnimatedStyle(() => ({ opacity: 1 - Math.min(cut.get() * 3, 1) }));
  const edge = useAnimatedStyle(() => ({ opacity: reduced ? 0 : Math.sin(Math.PI * Math.min(cut.get() * 1.6, 1)) }));

  return (
    <View style={styles.root} accessibilityRole="progressbar" accessibilityLabel={`${APP_NAME} is loading`}>
      <Animated.View style={[styles.half, styles.upper, { backgroundColor: colors.hero }, upper]} />
      <Animated.View style={[styles.half, styles.lower, { backgroundColor: colors.hero }, lower]} />
      <Animated.View pointerEvents="none" style={[styles.edge, edge]}>
        <LinearGradient colors={['transparent', colors.accent, colors.onHero, colors.accent, 'transparent']} locations={[0, 0.3, 0.5, 0.7, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[styles.center, content]}>
        <View style={styles.mark}>
          <MonogramDraw size={MARK} ground={colors.hero} color={colors.onHero} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip]}>
            <Animated.View style={[styles.glint, glintStyle]}>
              <LinearGradient colors={['transparent', colors.accent, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
          </View>
        </View>
        <Wordmark size={22} color={colors.onHero} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  // Each half is far larger than the screen so that, tilted, the pair still covers every corner.
  half: { position: 'absolute', left: '-100%', right: '-100%', height: 1400 },
  upper: { bottom: '50%' },
  lower: { top: '50%' },
  edge: { position: 'absolute', left: '-50%', right: '-50%', top: '50%', height: 3, marginTop: -1.5, transform: [{ rotate: '-24deg' }] },
  center: { alignItems: 'center', gap: Spacing.lg },
  mark: { width: MARK, height: MARK },
  clip: { borderRadius: MARK / 2, overflow: 'hidden' },
  glint: { position: 'absolute', top: -20, bottom: -20, left: '50%', width: 36, marginLeft: -18, opacity: 0 },
});
