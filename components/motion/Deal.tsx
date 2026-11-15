import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

import { Duration, Springs } from '@/constants/motion';
import { useMotion } from './useMotion';

interface DealProps {
  /** Position in the hand; each card lands a beat after the one before. */
  index?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/** The gap between cards: slower than a list stagger, so each one is seen to land. */
const BEAT = 90;

/**
 * Cards dealt onto a table: each slides up from below, slightly turned, and
 * squares itself as it lands. With motion reduced they fade in.
 */
export function Deal({ index = 0, delay = 0, style, children }: DealProps) {
  const { reduced } = useMotion();
  const landed = useSharedValue(0);
  const tilt = index % 2 === 0 ? -2.2 : 2.2;

  useEffect(() => {
    const wait = reduced ? 0 : delay + Math.min(index, 8) * BEAT;
    landed.set(withDelay(wait, reduced ? withTiming(1, { duration: Duration.micro }) : withSpring(1, Springs.settle)));
    // Dealt once, when it mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animated = useAnimatedStyle(() => {
    const t = landed.get();
    if (reduced) return { opacity: t };
    return { opacity: Math.min(t * 1.6, 1), transform: [{ translateY: (1 - t) * 34 }, { rotate: `${(1 - t) * tilt}deg` }] };
  });
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
