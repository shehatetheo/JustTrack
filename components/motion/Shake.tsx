import React, { useEffect, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { Haptic } from '@/constants/motion';
import { useMotion } from './useMotion';

interface ShakeProps {
  /** Shakes once each time this changes to a new truthy value: pass the error message. */
  trigger: unknown;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/** A quick, small sideways shake for "that didn't work". With motion reduced the content stays put and only the haptic fires. */
export function Shake({ trigger, style, children }: ShakeProps) {
  const { reduced } = useMotion();
  const offset = useSharedValue(0);
  const last = useRef<unknown>(null);

  useEffect(() => {
    if (!trigger || trigger === last.current) {
      last.current = trigger;
      return;
    }
    last.current = trigger;
    Haptic.error();
    if (reduced) return;
    const step = { duration: 45 };
    offset.set(withSequence(withTiming(-7, step), withTiming(6, step), withTiming(-4, step), withTiming(3, step), withTiming(0, step)));
  }, [offset, reduced, trigger]);

  const animated = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
