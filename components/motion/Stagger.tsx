import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { Duration, Easings, RISE } from '@/constants/motion';
import { useMotion } from './useMotion';

interface StaggerProps {
  /** Position in the list; each step waits a little longer. */
  index?: number;
  /** Extra wait before the whole group starts. */
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/** Past this many rows the wait stops growing, so a long list is never slow to finish arriving. */
const MAX_STEPS = 10;

/**
 * Rows and cards arrive one after another: a fade and a short rise, 35 ms
 * apart. With motion reduced they simply fade. The element stays in the
 * page's flow throughout, so nothing around it shifts.
 */
export function Stagger({ index = 0, delay = 0, style, children }: StaggerProps) {
  const { reduced } = useMotion();
  const arrived = useSharedValue(0);

  useEffect(() => {
    const wait = reduced ? 0 : delay + Math.min(index, MAX_STEPS) * Duration.stagger;
    arrived.set(withDelay(wait, withTiming(1, { duration: reduced ? Duration.micro : Duration.standard, easing: Easings.out })));
    // Arrives once, when it mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animated = useAnimatedStyle(() => ({ opacity: arrived.get(), transform: [{ translateY: reduced ? 0 : (1 - arrived.get()) * RISE }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
