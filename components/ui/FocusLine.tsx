import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Duration, Easings } from '@/constants/motion';
import { useAppTheme } from '@/contexts/ThemeContext';

/** The lavender line that draws across the foot of a field when it takes focus, and retreats when it loses it. */
export function FocusLine({ active, error = false }: { active: boolean; error?: boolean }) {
  const { colors } = useAppTheme();
  const drawn = useSharedValue(0);

  useEffect(() => {
    drawn.set(withTiming(active || error ? 1 : 0, { duration: Duration.standard, easing: Easings.draw }));
  }, [active, drawn, error]);

  const line = useAnimatedStyle(() => ({ opacity: drawn.get(), transform: [{ scaleX: drawn.get() }] }));
  return <Animated.View pointerEvents="none" style={[styles.line, { backgroundColor: error ? colors.text : colors.accent }, line]} />;
}

const styles = StyleSheet.create({
  line: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, transformOrigin: 'left' },
});
