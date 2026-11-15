import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

import { Duration, Haptic, Springs } from '@/constants/motion';
import { useMotion } from './useMotion';

interface StampThumpProps {
  /** Slam down on mount (and again whenever this changes). False shows the stamp already set, with no animation. */
  play?: unknown;
  delay?: number;
  /** The resting tilt, in degrees. Stamps are never quite straight. */
  tilt?: number;
  /** Knock the phone as it lands. */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/** A rubber stamp coming down: it arrives big, hits the page, overshoots once and holds at a slight angle. With motion reduced it fades in. */
export function StampThump({ play = true, delay = 0, tilt = -8, haptic = false, style, children }: StampThumpProps) {
  const { reduced } = useMotion();
  const still = play === false;
  const landed = useSharedValue(still ? 1 : 0);
  const shown = useSharedValue(still ? 1 : 0);

  useEffect(() => {
    if (still) return;
    landed.set(0);
    shown.set(0);
    shown.set(withDelay(delay, withTiming(1, { duration: reduced ? Duration.standard : 90 })));
    landed.set(withDelay(delay, reduced ? withTiming(1, { duration: 0 }) : withSpring(1, Springs.thump)));
    if (!haptic) return;
    const timer = setTimeout(Haptic.stamp, delay + 60);
    return () => clearTimeout(timer);
  }, [delay, haptic, landed, play, reduced, shown, still]);

  const animated = useAnimatedStyle(() => ({
    opacity: shown.get(),
    transform: [{ rotate: `${tilt + (1 - landed.get()) * 10}deg` }, { scale: 1 + (1 - landed.get()) * 0.9 }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
