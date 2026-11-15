import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useAppTheme } from '@/contexts/ThemeContext';
import { useMotion } from './useMotion';

/** How long one pass of light takes. Slow on purpose: it should read as waiting, not as an alarm. */
const SWEEP_MS = 1500;

/** A placeholder block with a band of lavender light drifting across it on the diagonal. Holds still with motion reduced. */
export function Shimmer({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useAppTheme();
  const { reduced } = useMotion();
  const [width, setWidth] = useState(0);
  const sweep = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    sweep.set(withRepeat(withTiming(1, { duration: SWEEP_MS, easing: Easing.inOut(Easing.quad) }), -1, false));
  }, [reduced, sweep]);

  const band = useAnimatedStyle(() => ({ transform: [{ translateX: (sweep.get() * 2 - 1) * (width + 120) }, { rotate: '18deg' }] }));

  return (
    <View style={[styles.block, { backgroundColor: colors.surfaceRaised }, style]} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {reduced || width === 0 ? null : (
        <Animated.View style={[styles.band, band]}>
          <LinearGradient colors={['transparent', colors.borderAccent, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { overflow: 'hidden' },
  band: { position: 'absolute', top: -40, bottom: -40, left: '50%', width: 90, marginLeft: -45 },
});
