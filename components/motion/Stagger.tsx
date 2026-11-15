import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Duration, RISE } from '@/constants/motion';
import { useMotion } from './useMotion';

interface StaggerProps {
  /** Position in the list; each step waits a little longer. */
  index?: number;
  /** Extra wait before the whole group starts. */
  delay?: number;
  /** Also glide to a new position when siblings come and go. */
  reflow?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/** Past this many rows the wait stops growing, so a long list is never slow to finish arriving. */
const MAX_STEPS = 10;

/** Rows and cards arrive one after another: a fade and a short rise, 35 ms apart. With motion reduced they simply fade. */
export function Stagger({ index = 0, delay = 0, reflow = false, style, children }: StaggerProps) {
  const { reduced } = useMotion();
  const wait = delay + Math.min(index, MAX_STEPS) * Duration.stagger;
  const entering = reduced
    ? FadeIn.duration(Duration.micro)
    : FadeInDown.delay(wait)
        .duration(Duration.standard)
        .withInitialValues({ opacity: 0, transform: [{ translateY: RISE }] });

  return (
    <Animated.View entering={entering} exiting={FadeOut.duration(Duration.micro)} layout={reflow && !reduced ? LinearTransition.duration(Duration.standard) : undefined} style={style}>
      {children}
    </Animated.View>
  );
}
