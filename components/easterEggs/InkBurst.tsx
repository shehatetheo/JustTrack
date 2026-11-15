import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { seeded, Splatter } from '@/components/decor';
import { useMotion } from '@/components/motion';
import { useAppTheme } from '@/contexts/ThemeContext';

const BLOTS = [
  { left: '8%', top: '12%', size: 150, seed: 3 },
  { left: '52%', top: '30%', size: 190, seed: 8 },
  { left: '20%', top: '56%', size: 170, seed: 14 },
  { left: '60%', top: '70%', size: 130, seed: 21 },
] as const;

/**
 * Ink thrown across the screen and gone again: what shaking the phone on
 * Today does. `play` is a counter; each new value throws once. Nothing can
 * be touched through it for the second it lasts, and it is skipped entirely
 * when motion is reduced.
 */
export function InkBurst({ play }: { play: number }) {
  const { colors } = useAppTheme();
  const { reduced } = useMotion();
  const thrown = useSharedValue(0);

  useEffect(() => {
    if (play === 0 || reduced) return;
    thrown.set(0);
    thrown.set(withSequence(withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }), withTiming(2, { duration: 900, easing: Easing.in(Easing.quad) })));
  }, [play, reduced, thrown]);

  const style = useAnimatedStyle(() => {
    const t = thrown.get();
    return { opacity: t <= 1 ? t : 2 - t, transform: [{ scale: 0.6 + Math.min(t, 1) * 0.5 }] };
  });
  if (reduced) return null;

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {BLOTS.map((blot) => (
        <View key={blot.seed} style={[styles.blot, { left: blot.left, top: blot.top }]}>
          <Splatter size={blot.size} color={blot.seed % 2 ? colors.accent : colors.ink} seed={blot.seed} count={22} />
        </View>
      ))}
    </Animated.View>
  );
}

/**
 * Where the ink came to rest. Each shake throws it somewhere new; before
 * the first shake there is none. Sits in Today's artwork, behind the
 * numbers, faint enough not to compete with them.
 */
export function SettledInk({ arrangement }: { arrangement: number }) {
  const { colors } = useAppTheme();
  if (arrangement === 0) return null;
  const next = seeded(arrangement * 17 + 3);
  const blots = Array.from({ length: 4 }, (_, index) => ({ left: `${Math.round(next() * 78)}%` as const, top: Math.round(10 + next() * 150), size: Math.round(46 + next() * 50), seed: arrangement * 5 + index }));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {blots.map((blot) => (
        <View key={blot.seed} style={[styles.blot, { left: blot.left, top: blot.top }]}>
          <Splatter size={blot.size} color={blot.seed % 2 ? colors.accent : colors.onHero} opacity={0.4} seed={blot.seed} count={14} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  blot: { position: 'absolute' },
});
