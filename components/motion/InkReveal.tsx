import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { Duration, Easings } from '@/constants/motion';
import { useMotion } from './useMotion';

interface InkRevealProps {
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Content that arrives like ink taking to the page: it starts a touch small
 * and faint, then spreads to full size as it darkens. A plain fade with
 * motion reduced.
 */
export function InkReveal({ delay = 0, style, children }: InkRevealProps) {
  const { reduced } = useMotion();
  const soaked = useSharedValue(0);

  useEffect(() => {
    soaked.set(withDelay(delay, withTiming(1, { duration: reduced ? Duration.micro : Duration.standard + 80, easing: Easings.out })));
    // Soaks in once, when it mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animated = useAnimatedStyle(() => ({ opacity: soaked.get(), transform: [{ scale: reduced ? 1 : 0.965 + soaked.get() * 0.035 }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
