import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { PressScale } from '@/components/motion';
import { Springs } from '@/constants/motion';
import { HAIRLINE, MIN_TAP, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { AppIcon } from './AppIcon';

interface StepperButtonProps {
  direction: 'less' | 'more';
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
}

/** One half of a stepper: a round lavender-edged button with a minus or a plus. */
export function StepperButton({ direction, onPress, disabled = false, accessibilityLabel }: StepperButtonProps) {
  const { colors } = useAppTheme();
  return (
    <PressScale
      onPress={onPress}
      haptic="select"
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={[styles.button, { borderColor: colors.borderAccent, backgroundColor: colors.surfaceRaised, opacity: disabled ? 0.4 : 1 }]}
    >
      <AppIcon name={direction === 'less' ? 'minus' : 'plus'} size={17} color={colors.accentText} weight="semibold" />
    </PressScale>
  );
}

/** Wraps a stepper's value so it gives a small springy tick each time the number changes. */
export function StepperTick({ value, children }: { value: unknown; children: React.ReactNode }) {
  const tick = useSharedValue(1);
  useEffect(() => {
    tick.set(withSequence(withTiming(1.08, { duration: 70 }), withSpring(1, Springs.snappy)));
  }, [tick, value]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: tick.get() }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

interface StepperProps {
  onLess: () => void;
  onMore: () => void;
  lessLabel: string;
  moreLabel: string;
  canLess?: boolean;
  canMore?: boolean;
  /** Ticks when this changes. */
  value: unknown;
  children: React.ReactNode;
}

/** Minus, a value, plus. The value ticks as it changes. */
export function Stepper({ onLess, onMore, lessLabel, moreLabel, canLess = true, canMore = true, value, children }: StepperProps) {
  return (
    <View style={styles.row}>
      <StepperButton direction="less" onPress={onLess} disabled={!canLess} accessibilityLabel={lessLabel} />
      <StepperTick value={value}>{children}</StepperTick>
      <StepperButton direction="more" onPress={onMore} disabled={!canMore} accessibilityLabel={moreLabel} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  button: { width: MIN_TAP, height: MIN_TAP, borderRadius: Radii.full, borderWidth: HAIRLINE, alignItems: 'center', justifyContent: 'center' },
});
