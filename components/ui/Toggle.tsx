import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Haptic, Springs } from '@/constants/motion';
import { HAIRLINE, MIN_TAP, Radii } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
}

const WIDTH = 50;
const HEIGHT = 30;
const THUMB = 24;
const TRAVEL = WIDTH - THUMB - 6;

/** An on/off switch: a dark track that fills with lavender, and a thumb that springs across. */
export function Toggle({ value, onValueChange, disabled = false, accessibilityLabel }: ToggleProps) {
  const { colors } = useAppTheme();
  const on = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    on.set(withSpring(value ? 1 : 0, Springs.snappy));
  }, [on, value]);

  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(on.get(), [0, 1], [colors.surfaceRaised, colors.accent]) }));
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: on.get() * TRAVEL }], backgroundColor: interpolateColor(on.get(), [0, 1], [colors.textSecondary, colors.onAccent]) }));

  return (
    <Pressable
      onPress={() => {
        Haptic.select();
        onValueChange(!value);
      }}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      hitSlop={(MIN_TAP - HEIGHT) / 2}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <Animated.View style={[styles.track, { borderColor: colors.border }, track]}>
        <Animated.View style={[styles.thumb, thumb]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: WIDTH, height: HEIGHT, borderRadius: Radii.full, borderWidth: HAIRLINE, justifyContent: 'center', paddingHorizontal: 2 },
  thumb: { width: THUMB, height: THUMB, borderRadius: Radii.full },
});
