import React, { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { LinearTransition, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Duration, Easings } from '@/constants/motion';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useMotion } from './useMotion';

interface TearAwayProps {
  /** Set true to tear the row off. `onTorn` runs when it has gone, which is when to remove it for real. */
  tearing: boolean;
  onTorn: () => void;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/** A zigzag across `width`, like the perforated edge of a receipt. */
function zigzag(width: number): string {
  const tooth = 7;
  let path = 'M 0 3';
  for (let x = 0; x < width; x += tooth) path += ` L ${x + tooth / 2} 0 L ${x + tooth} 3`;
  return path;
}

/**
 * A row leaving the way a receipt is torn from the roll: a perforated edge
 * appears, the row slides and tilts off, and the rows below close the gap.
 * With motion reduced it fades and the gap closes at once.
 */
export function TearAway({ tearing, onTorn, style, children }: TearAwayProps) {
  const { colors } = useAppTheme();
  const { reduced } = useMotion();
  const [width, setWidth] = useState(0);
  const torn = useSharedValue(0);

  useEffect(() => {
    if (!tearing) return;
    torn.set(
      withTiming(1, { duration: reduced ? Duration.micro : Duration.standard, easing: Easings.slash }, (finished) => {
        if (finished) runOnJS(onTorn)();
      })
    );
    // `onTorn` is the caller's latest; re-running for a new function identity would tear twice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tearing, reduced, torn]);

  const leaving = useAnimatedStyle(() => {
    const t = torn.get();
    return reduced ? { opacity: 1 - t } : { opacity: 1 - t, transform: [{ translateX: -t * 36 }, { rotate: `${-t * 1.5}deg` }] };
  });
  const edge = useAnimatedStyle(() => ({ opacity: torn.get() > 0 && torn.get() < 1 ? 1 : 0 }));

  return (
    <Animated.View layout={reduced ? undefined : LinearTransition.duration(Duration.standard)} style={style} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <Animated.View style={leaving}>{children}</Animated.View>
      {width > 0 && !reduced ? (
        <Animated.View pointerEvents="none" style={[styles.edge, edge]}>
          <View>
            <Svg width={width} height={4}>
              <Path d={zigzag(width)} stroke={colors.inkFaint} strokeWidth={1} fill="none" />
            </Svg>
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  edge: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
