import React, { useEffect } from 'react';
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import { Path, type PathProps } from 'react-native-svg';

import { Duration, Easings } from '@/constants/motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * A value that runs from 0 to 1 once, like a pen crossing the page. Pass a
 * `replay` key to draw again when something changes.
 */
export function useDraw(options: { delay?: number; duration?: number; replay?: unknown; paused?: boolean } = {}): SharedValue<number> {
  const { delay = 0, duration = Duration.hero, replay, paused = false } = options;
  const drawn = useSharedValue(0);
  useEffect(() => {
    if (paused) return;
    drawn.set(0);
    drawn.set(withDelay(delay, withTiming(1, { duration, easing: Easings.draw })));
  }, [delay, drawn, duration, paused, replay]);
  return drawn;
}

interface DrawStrokeProps extends Omit<PathProps, 'strokeDasharray' | 'strokeDashoffset'> {
  d: string;
  /** At least as long as the path. Longer is fine; it only changes how the speed is spread. */
  length: number;
  /** 0 = nothing drawn, 1 = the whole stroke. Use `useDraw` for a one-off, or drive it yourself. */
  progress: SharedValue<number>;
}

/** An SVG path that draws itself on as `progress` goes from 0 to 1. */
export function DrawStroke({ d, length, progress, fill = 'none', strokeLinecap = 'round', strokeLinejoin = 'round', ...rest }: DrawStrokeProps) {
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - progress.get()) }));
  return <AnimatedPath d={d} fill={fill} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin} strokeDasharray={`${length} ${length}`} animatedProps={animatedProps} {...rest} />;
}
