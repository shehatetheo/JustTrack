import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { seeded, Splatter } from '@/components/decor';
import { useMotion } from '@/components/motion';
import { useAppTheme } from '@/contexts/ThemeContext';
import type { Season } from '@/lib/easterEggs/eggs';

const hidden = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const;

/** One bat, wings out. */
const BAT = 'M0 6 C4 2 8 2 11 5 C12 2 13 2 14 4 C15 2 16 2 17 5 C20 2 24 2 28 6 C24 6 22 8 21 11 C19 9 17 9 16 12 C15 10 13 10 12 12 C11 9 9 9 7 11 C6 8 4 6 0 6 Z';

function Drifter({ index, kind }: { index: number; kind: 'bat' | 'flake' }) {
  const { colors } = useAppTheme();
  const { reduced } = useMotion();
  const next = seeded(index * 13 + 5);
  const left = `${Math.round(6 + next() * 84)}%` as const;
  const top = Math.round(next() * 150);
  const size = kind === 'bat' ? 16 + next() * 14 : 2 + next() * 3;
  const travel = useSharedValue(0);
  const span = 5200 + next() * 4200;

  useEffect(() => {
    if (reduced) return;
    travel.set(withDelay(index * 260, withRepeat(withTiming(1, { duration: span, easing: kind === 'bat' ? Easing.inOut(Easing.sin) : Easing.linear }), -1, kind === 'bat')));
    // Starts once, when it mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => {
    const t = travel.get();
    if (kind === 'bat') return { transform: [{ translateX: (t - 0.5) * 70 }, { translateY: Math.sin(t * Math.PI * 4) * 9 }] };
    return { opacity: 0.75 * (1 - t * 0.6), transform: [{ translateY: t * 240 }, { translateX: Math.sin(t * Math.PI * 2) * 8 }] };
  });

  return (
    <Animated.View style={[styles.drifter, { left, top }, style]}>
      {kind === 'bat' ? (
        <Svg width={size} height={(size * 12) / 28} viewBox="0 0 28 12">
          <Path d={BAT} fill={colors.onHero} opacity={0.8} />
        </Svg>
      ) : (
        <View style={{ width: size, height: size, borderRadius: size, backgroundColor: colors.onHero }} />
      )}
    </Animated.View>
  );
}

function Firework() {
  const { colors } = useAppTheme();
  const { reduced } = useMotion();
  const burst = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return;
    burst.set(withDelay(900, withSequence(withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }), withDelay(1600, withTiming(2, { duration: 900 })))));
    // Goes off once, when it mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: burst.get() <= 1 ? burst.get() : 2 - burst.get(), transform: [{ scale: 0.3 + Math.min(burst.get(), 1) * 1.1 }] }));
  return (
    <Animated.View style={[styles.firework, style]}>
      <Splatter size={150} color={colors.accent} seed={11} count={26} />
    </Animated.View>
  );
}

/**
 * A little extra ink over Home's artwork on three occasions: bats on
 * Halloween, slow snow through December, one firework on New Year's Day.
 * It sits behind everything you can touch, is hidden from screen readers,
 * and holds still when motion is reduced.
 */
export function Seasonal({ season }: { season: Season }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} {...hidden}>
      {season === 'bats' ? Array.from({ length: 5 }, (_, index) => <Drifter key={index} index={index} kind="bat" />) : null}
      {season === 'snow' ? Array.from({ length: 14 }, (_, index) => <Drifter key={index} index={index} kind="flake" />) : null}
      {season === 'firework' ? <Firework /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  drifter: { position: 'absolute' },
  firework: { position: 'absolute', top: 30, right: 20 },
});
