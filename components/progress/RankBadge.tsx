import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { StampThump } from '@/components/motion';
import { ThemedText } from '@/components/ui/ThemedText';
import { Fonts } from '@/constants/fonts';
import { useAppTheme } from '@/contexts/ThemeContext';
import type { Rank } from '@/lib/nutrition/rank';

interface RankBadgeProps {
  rank: Rank;
  size?: number;
}

/** The day's letter, in a cut-diamond frame. It slams in like a rank at the end of a level, and again when the letter changes. */
export function RankBadge({ rank, size = 76 }: RankBadgeProps) {
  const { colors } = useAppTheme();
  const top = rank === 'S' || rank === 'A';

  return (
    <StampThump play={rank} tilt={-6} style={{ width: size, height: size }}>
      <View style={styles.fill} accessible accessibilityRole="image" accessibilityLabel={`Rank ${rank}`}>
        <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
          <Path d="M50 3 L97 50 L50 97 L3 50 Z" fill={top ? colors.accent : 'none'} stroke={colors.accent} strokeWidth={2.2} />
          <Path d="M50 13 L87 50 L50 87 L13 50 Z" fill="none" stroke={top ? colors.onAccent : colors.borderAccent} strokeWidth={1} />
        </Svg>
        <ThemedText allowFontScaling={false} style={[styles.letter, { color: top ? colors.onAccent : colors.text, fontSize: size * 0.46, lineHeight: size * 0.56 }]}>
          {rank}
        </ThemedText>
      </View>
    </StampThump>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  letter: { fontFamily: Fonts.displayBold, textAlign: 'center' },
});
