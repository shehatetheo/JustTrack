import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeIn, Keyframe } from 'react-native-reanimated';

import { Duration, Easings } from '@/constants/motion';
import { useMotion } from './useMotion';

interface InkRevealProps {
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/** Ink soaking into paper: it starts a touch small and faint, then spreads to full size as it darkens. */
const SOAK = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.965 }] },
  60: { opacity: 1, transform: [{ scale: 1.006 }], easing: Easings.out },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: Easings.inOut },
});

/** Content that arrives like ink taking to the page. A plain fade with motion reduced. */
export function InkReveal({ delay = 0, style, children }: InkRevealProps) {
  const { reduced } = useMotion();
  return (
    <Animated.View entering={reduced ? FadeIn.duration(Duration.micro) : SOAK.duration(Duration.standard + 80).delay(delay)} style={style}>
      {children}
    </Animated.View>
  );
}
