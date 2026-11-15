import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G, Line } from 'react-native-svg';

import { Duration, Easings } from '@/constants/motion';
import { useAppTheme } from '@/contexts/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RingProps {
  /** 0–1; anything over 1 fills the ring. */
  progress: number;
  size?: number;
  stroke?: number;
  /** Defaults to the theme's lavender. */
  color?: string;
  trackColor?: string;
  /** Draw the filled part as a broken, hatched line. Used for the third macro, so it is told apart without colour. */
  hatched?: boolean;
  /** Clock-face marks around the outside. */
  ticks?: boolean;
  /** A soft halo under the filled arc. */
  glow?: boolean;
  children?: React.ReactNode;
}

/**
 * A round gauge with room in the middle. The arc draws on like a pen stroke
 * when it first appears and glides to each new value after that.
 */
export function Ring({ progress, size = 56, stroke = 4, color, trackColor, hatched = false, ticks = false, glow = false, children }: RingProps) {
  const { colors } = useAppTheme();
  const ink = color ?? colors.accent;
  const track = trackColor ?? colors.track;
  const margin = ticks ? 8 : glow ? 4 : 0;
  const radius = (size - stroke) / 2 - margin;
  const centre = size / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const shown = useSharedValue(0);

  useEffect(() => {
    shown.set(withTiming(clamped, { duration: Duration.hero + 130, easing: Easings.draw }));
  }, [clamped, shown]);

  const filled = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - shown.get()) }));
  // For the hatched ring the whole circle is hatched and the track is drawn over the part not yet reached.
  const remaining = useAnimatedProps(() => ({ strokeDashoffset: -circumference * shown.get() }));

  return (
    <View style={{ width: size, height: size }} accessible={false}>
      <Svg width={size} height={size} style={styles.svg}>
        {ticks ? (
          <G>
            {Array.from({ length: 60 }, (_, index) => {
              const major = index % 5 === 0;
              const angle = (index / 60) * Math.PI * 2;
              const outer = size / 2 - 0.5;
              const inner = outer - (major ? 5 : 2.5);
              return <Line key={index} x1={centre + Math.sin(angle) * inner} y1={centre - Math.cos(angle) * inner} x2={centre + Math.sin(angle) * outer} y2={centre - Math.cos(angle) * outer} stroke={major ? colors.textTertiary : colors.border} strokeWidth={1} />;
            })}
          </G>
        ) : null}
        <G transform={`rotate(-90 ${centre} ${centre})`}>
          {hatched ? (
            <>
              <Circle cx={centre} cy={centre} r={radius} stroke={ink} strokeWidth={stroke} fill="none" strokeDasharray="2.5 3" />
              <AnimatedCircle cx={centre} cy={centre} r={radius} stroke={track} strokeWidth={stroke + 1} fill="none" strokeDasharray={`${circumference} ${circumference}`} animatedProps={remaining} />
            </>
          ) : (
            <>
              <Circle cx={centre} cy={centre} r={radius} stroke={track} strokeWidth={stroke} fill="none" />
              {glow ? <AnimatedCircle cx={centre} cy={centre} r={radius} stroke={colors.accentDeep} strokeOpacity={0.35} strokeWidth={stroke + 6} strokeLinecap="round" fill="none" strokeDasharray={`${circumference} ${circumference}`} animatedProps={filled} /> : null}
              <AnimatedCircle cx={centre} cy={centre} r={radius} stroke={ink} strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={`${circumference} ${circumference}`} animatedProps={filled} />
            </>
          )}
        </G>
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  svg: { position: 'absolute', top: 0, left: 0 },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
