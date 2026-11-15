import React, { useEffect, useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

import { Duration, Easings } from '@/constants/motion';
import { useAppTheme } from '@/contexts/ThemeContext';

interface GrowBarProps {
  /** 0–1 of the track this bar should fill. */
  fraction: number;
  /** Grows sideways (a progress bar) or upwards (a column in a chart). */
  axis?: 'x' | 'y';
  delay?: number;
  /** Fill with diagonal hatching instead of a solid colour. */
  hatched?: boolean;
  /** Defaults to the theme's lavender. */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/** The filled part of a bar. It grows from empty when it first appears and glides to each new value after that. */
export function GrowBar({ fraction, axis = 'x', delay = 0, hatched = false, color, style }: GrowBarProps) {
  const { colors } = useAppTheme();
  const ink = color ?? colors.accent;
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const target = Math.min(Math.max(fraction, 0), 1);
  const shown = useSharedValue(0);

  useEffect(() => {
    shown.set(withDelay(delay, withTiming(target, { duration: Duration.hero, easing: Easings.draw })));
  }, [delay, shown, target]);

  const size = useAnimatedStyle(() => {
    const percent = `${Math.round(shown.get() * 1000) / 10}%` as const;
    return axis === 'x' ? { width: percent } : { height: percent };
  });

  return (
    <Animated.View style={[styles.bar, { backgroundColor: hatched ? 'transparent' : ink }, style, size]}>
      {hatched ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern id={`hatch-${id}`} patternUnits="userSpaceOnUse" width={5} height={5} patternTransform="rotate(45)">
                <Line x1={0} y1={0} x2={0} y2={5} stroke={ink} strokeWidth={2.4} />
              </Pattern>
            </Defs>
            <Rect x={0} y={0} width="100%" height="100%" fill={`url(#hatch-${id})`} />
          </Svg>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: { overflow: 'hidden' },
});
