import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { MonogramDraw } from '@/components/brand/MonogramDraw';
import { SlashStreak, Splatter } from '@/components/decor';
import { useMotion } from '@/components/motion';
import { Logo } from '@/components/ui/Logo';
import { ThemedText } from '@/components/ui/ThemedText';
import { Haptic } from '@/constants/motion';
import { Radii } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { EASTER_EGGS_ENABLED, SHATTER_LINE } from '@/lib/easterEggs/eggs';
import { discover } from './found';

const BREAK_MS = 520;
/** How long the line inside stays readable before the mark is written again. */
const READ_MS = 1700;

/**
 * The monogram on Profile. Press and hold it and it is slashed apart into
 * streaks and flecks of ink, a line in blackletter shows where it was, and
 * then the mark is written again from nothing. With motion reduced the
 * line simply takes its place for a moment. A screen reader sees the mark
 * and nothing more.
 */
export function ShatterMark({ size = 84 }: { size?: number }) {
  const { colors } = useAppTheme();
  const { reduced } = useMotion();
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<'whole' | 'broken' | 'redrawing'>('whole');
  const burst = useSharedValue(0);

  useEffect(() => {
    if (phase !== 'broken') return;
    burst.set(0);
    burst.set(withSequence(withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }), withTiming(2, { duration: BREAK_MS - 200 })));
    const timer = setTimeout(() => setPhase('redrawing'), READ_MS + (reduced ? 0 : BREAK_MS));
    return () => clearTimeout(timer);
  }, [burst, phase, reduced]);

  const flecks = useAnimatedStyle(() => ({ opacity: burst.get() <= 1 ? burst.get() : 2 - burst.get(), transform: [{ scale: 0.5 + Math.min(burst.get(), 2) * 0.7 }] }));

  const shatter = () => {
    if (!EASTER_EGGS_ENABLED || phase !== 'whole') return;
    discover('shatter');
    Haptic.stamp();
    setRound((count) => count + 1);
    setPhase('broken');
  };

  return (
    <Pressable onLongPress={shatter} delayLongPress={600} accessible={false} style={{ width: size, height: size }}>
      {phase === 'whole' ? <Logo width={size} color={colors.onHero} /> : null}
      {phase === 'broken' && !reduced ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center, flecks]}>
          <View style={styles.streaks}>
            <SlashStreak size={size * 1.6} color={colors.accent} count={3} />
          </View>
          <Splatter size={size * 1.5} color={colors.onHero} seed={round + 4} count={30} />
        </Animated.View>
      ) : null}
      {phase === 'broken' ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
          <ThemedText variant="blackletter" style={[styles.line, { color: colors.onHero, textShadowColor: colors.hero }]}>
            {SHATTER_LINE}
          </ThemedText>
        </View>
      ) : null}
      {phase === 'redrawing' ? (
        // A plain disc behind the pen, so the letters are written onto black and not onto the artwork.
        <View style={[styles.plate, { backgroundColor: colors.hero }]}>
          <MonogramDraw key={round} size={size} ground={colors.hero} color={colors.onHero} onDrawn={() => setPhase('whole')} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  plate: { borderRadius: Radii.full, overflow: 'hidden' },
  streaks: { position: 'absolute' },
  line: { width: 240, textAlign: 'center', fontSize: 21, lineHeight: 27, textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } },
});
