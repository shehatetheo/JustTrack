import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Duration, Easings } from '@/constants/motion';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useMotion } from './useMotion';

interface SlashWipeProps {
  /** The streak runs every time this changes (not on first mount, unless `onMount` is set). */
  trigger: unknown;
  onMount?: boolean;
  /** Bright for a transition, faint for a decoration. */
  strength?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A sharp diagonal streak of light that crosses whatever it covers: the
 * punctuation between two tabs or two steps. It draws over the content and
 * never takes touches. With motion reduced it does nothing; the content's
 * own fade carries the change.
 */
export function SlashWipe({ trigger, onMount = false, strength = 1, style }: SlashWipeProps) {
  const { colors } = useAppTheme();
  const { reduced } = useMotion();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const first = useRef(true);
  const sweep = useSharedValue(1);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (!onMount) return;
    }
    if (reduced) return;
    sweep.set(0);
    sweep.set(withTiming(1, { duration: Duration.standard + 60, easing: Easings.slash }));
  }, [trigger, reduced, sweep, onMount]);

  const reach = Math.hypot(size.width, size.height);
  const streak = useAnimatedStyle(() => {
    const t = sweep.get();
    return { opacity: t >= 1 ? 0 : Math.sin(Math.PI * t) * strength, transform: [{ rotate: '-28deg' }, { translateX: (t - 0.5) * (reach + 240) }] };
  });

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip, style]} onLayout={(event) => setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {size.width > 0 && !reduced ? (
        <Animated.View style={[styles.streak, { height: reach * 1.6, top: size.height / 2 - reach * 0.8, left: size.width / 2 - 60 }, streak]}>
          <LinearGradient colors={['transparent', colors.accentDeep, colors.ink, colors.accent, 'transparent']} locations={[0, 0.3, 0.5, 0.7, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  streak: { position: 'absolute', width: 120 },
});
