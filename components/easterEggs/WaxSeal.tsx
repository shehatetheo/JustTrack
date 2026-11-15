import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { RoseWindow } from '@/components/decor';
import { StampThump } from '@/components/motion';
import { ThemedText } from '@/components/ui/ThemedText';
import { Fonts } from '@/constants/fonts';
import { useAppTheme } from '@/contexts/ThemeContext';
import type { Seal } from '@/lib/easterEggs/eggs';

interface WaxSealProps {
  seal: Seal;
  days: number;
  size?: number;
  /** Change this to press the seal down again. */
  thump?: unknown;
}

/** A blob of wax with an uneven edge: twelve lobes, no two quite the same. */
function waxPath(): string {
  const lobes = 12;
  let d = '';
  for (let index = 0; index <= lobes; index += 1) {
    const angle = (index / lobes) * Math.PI * 2;
    const next = ((index + 0.5) / lobes) * Math.PI * 2;
    const r = 44 + ((index * 7) % 5) - 2;
    const bulge = 50 + ((index * 3) % 4);
    const x = 50 + Math.cos(angle) * r;
    const y = 50 + Math.sin(angle) * r;
    const cx = 50 + Math.cos(next) * bulge;
    const cy = 50 + Math.sin(next) * bulge;
    const nx = 50 + Math.cos(((index + 1) / lobes) * Math.PI * 2) * (44 + (((index + 1) * 7) % 5) - 2);
    const ny = 50 + Math.sin(((index + 1) / lobes) * Math.PI * 2) * (44 + (((index + 1) * 7) % 5) - 2);
    d += index === 0 ? `M${x} ${y} Q${cx} ${cy} ${nx} ${ny}` : index < lobes ? ` Q${cx} ${cy} ${nx} ${ny}` : ' Z';
  }
  return d;
}

const WAX = waxPath();

/**
 * What a week of logging in a row earns: a lavender wax seal pressed with
 * the number of days. At thirty the seal is pressed with a rose window.
 * It marks consistency, and nothing else.
 */
export function WaxSeal({ seal, days, size = 64, thump }: WaxSealProps) {
  const { colors } = useAppTheme();
  return (
    <StampThump play={thump ?? true} tilt={-6} haptic style={{ width: size, height: size }}>
      <View style={styles.fill} accessible accessibilityRole="image" accessibilityLabel={seal === 'rose' ? `${days} day streak, rose window seal` : `${days} day streak, wax seal`}>
        <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
          <Path d={WAX} fill={colors.accent} />
          <Circle cx={50} cy={50} r={33} stroke={colors.onAccent} strokeWidth={1.2} fill="none" opacity={0.55} />
          <Path d="M22 34 q10 -14 26 -16" stroke={colors.onHero} strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.5} />
        </Svg>
        {seal === 'rose' ? (
          <RoseWindow size={size * 0.56} color={colors.onAccent} />
        ) : (
          <ThemedText allowFontScaling={false} style={[styles.days, { color: colors.onAccent, fontSize: size * 0.34, lineHeight: size * 0.4 }]}>
            {days}
          </ThemedText>
        )}
      </View>
    </StampThump>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  days: { fontFamily: Fonts.displayBold, textAlign: 'center' },
});
