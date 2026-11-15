import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { Duration, Haptic, PRESS_SCALE, Springs, type HapticName } from '@/constants/motion';
import { useMotion } from './useMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** How far it shrinks while held; 1 turns the effect off. */
  pressScale?: number;
  /** Which haptic fires on press, or null for none. */
  haptic?: HapticName | null;
  children?: React.ReactNode;
}

/** The app's one press feel: springs down while held and back on release. With motion reduced it dims instead. */
export function PressScale({ style, pressScale = PRESS_SCALE, haptic = 'tap', onPressIn, onPressOut, onPress, children, ...rest }: PressScaleProps) {
  const { reduced } = useMotion();
  const held = useSharedValue(0);
  const animated = useAnimatedStyle(() => (reduced ? { opacity: 1 - held.get() * 0.3 } : { transform: [{ scale: 1 - held.get() * (1 - pressScale) }] }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        held.set(reduced ? withTiming(1, { duration: Duration.micro }) : withSpring(1, Springs.snappy));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        held.set(reduced ? withTiming(0, { duration: Duration.micro }) : withSpring(0, Springs.snappy));
        onPressOut?.(event);
      }}
      onPress={(event) => {
        if (haptic) Haptic[haptic]();
        onPress?.(event);
      }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}
