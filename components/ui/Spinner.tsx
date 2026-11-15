import React, { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useMotion } from '@/components/motion';

interface SpinnerProps {
  size?: number;
  color: string;
}

/**
 * Something is on its way: a thin ring with a gap, turning. The same one
 * wherever the app waits on a button or a search. With motion reduced the
 * broken ring holds still, which still reads as "working".
 */
export function Spinner({ size = 18, color }: SpinnerProps) {
  const { reduced } = useMotion();
  const turn = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    turn.set(withRepeat(withTiming(1, { duration: 900, easing: Easing.linear }), -1, false));
  }, [reduced, turn]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.get() * 360}deg` }] }));

  return (
    <Animated.View style={[{ width: size, height: size }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={9} stroke={color} strokeOpacity={0.25} strokeWidth={2} fill="none" />
        <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} strokeLinecap="round" strokeDasharray="18 39" fill="none" />
      </Svg>
    </Animated.View>
  );
}
