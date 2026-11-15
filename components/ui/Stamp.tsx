import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import { seeded } from '@/components/decor';
import { StampThump } from '@/components/motion';
import { Fonts } from '@/constants/fonts';
import { useAppTheme } from '@/contexts/ThemeContext';
import { ThemedText } from './ThemedText';

interface StampProps {
  /** The word across the middle: "LOGGED", "7 DAYS". Kept short; it is set in spaced capitals. */
  label: string;
  /** A smaller line under it: a date, a place. */
  caption?: string;
  size?: number;
  /** Lavender ink instead of the theme's ink. */
  accent?: boolean;
  /** Slam it down when it appears. Pass false for a stamp that is already on the page. */
  thump?: unknown;
  haptic?: boolean;
  delay?: number;
  tilt?: number;
  /** A different seed wears the ink away in different places. */
  seed?: number;
  /** What a screen reader says. Defaults to "<label> stamp". */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * A postal-style round stamp: two rings, a row of cancellation waves, a
 * word across the middle. The ink is uneven, as if the pad was running dry.
 */
export function Stamp({ label, caption, size = 76, accent = false, thump = false, haptic = false, delay = 0, tilt = -9, seed = 3, accessibilityLabel, style }: StampProps) {
  const { colors } = useAppTheme();
  const ink = accent ? colors.accent : colors.ink;
  const next = seeded(seed);
  // Short gaps scratched through the rings, in the colour of whatever is behind.
  const wear = Array.from({ length: 5 }, () => ({ angle: next() * 360, sweep: 8 + next() * 16 }));
  const r = 46;
  const arc = (angle: number, sweep: number, radius: number) => {
    const a0 = (angle * Math.PI) / 180;
    const a1 = ((angle + sweep) * Math.PI) / 180;
    return `M${50 + Math.cos(a0) * radius} ${50 + Math.sin(a0) * radius} A${radius} ${radius} 0 0 1 ${50 + Math.cos(a1) * radius} ${50 + Math.sin(a1) * radius}`;
  };

  return (
    <StampThump play={thump} haptic={haptic} delay={delay} tilt={tilt} style={[{ width: size, height: size }, style]}>
      <View style={styles.fill} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel ?? `${label.toLowerCase()} stamp`}>
        <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
          <Circle cx={50} cy={50} r={r} stroke={ink} strokeWidth={2.4} fill="none" />
          <Circle cx={50} cy={50} r={r - 6} stroke={ink} strokeWidth={0.9} fill="none" />
          <G>
            {[30, 70].map((y) => (
              <Path key={y} d={`M22 ${y} q4 -3 8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0`} stroke={ink} strokeWidth={0.9} fill="none" opacity={0.75} />
            ))}
          </G>
          <Line x1={16} x2={84} y1={39} y2={39} stroke={ink} strokeWidth={0.7} />
          <Line x1={16} x2={84} y1={61} y2={61} stroke={ink} strokeWidth={0.7} />
          {wear.map((gap, index) => (
            <Path key={index} d={arc(gap.angle, gap.sweep, r)} stroke={colors.surface} strokeWidth={3.4} fill="none" />
          ))}
        </Svg>
        <ThemedText allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit style={[styles.word, { color: ink, fontSize: size * 0.15, lineHeight: size * 0.2, maxWidth: size * 0.82 }]}>
          {label.toUpperCase()}
        </ThemedText>
        {caption ? (
          <ThemedText allowFontScaling={false} numberOfLines={1} style={[styles.caption, { color: ink, fontSize: size * 0.085, lineHeight: size * 0.11, top: size * 0.63 }]}>
            {caption.toUpperCase()}
          </ThemedText>
        ) : null}
      </View>
    </StampThump>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  word: { fontFamily: Fonts.displayBold, letterSpacing: 0.4, textAlign: 'center' },
  caption: { position: 'absolute', fontFamily: Fonts.bodyBold, letterSpacing: 0.8 },
});
