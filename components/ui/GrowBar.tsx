import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

interface GrowBarProps {
  /** 0–1 of the track this bar should fill. */
  fraction: number;
  /** Grows sideways (a progress bar) or upwards (a column in a chart). */
  axis?: 'x' | 'y';
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/** The filled part of a bar. It grows from empty when it first appears and glides to each new value after that. */
export function GrowBar({ fraction, axis = 'x', delay = 0, style }: GrowBarProps) {
  const target = Math.min(Math.max(fraction, 0), 1);
  const shown = useSharedValue(0);

  useEffect(() => {
    shown.set(withDelay(delay, withTiming(target, { duration: 520, easing: Easing.out(Easing.cubic) })));
  }, [delay, shown, target]);

  const size = useAnimatedStyle(() => {
    const percent = `${Math.round(shown.get() * 1000) / 10}%` as const;
    return axis === 'x' ? { width: percent } : { height: percent };
  });

  return <Animated.View style={[style, size]} />;
}
