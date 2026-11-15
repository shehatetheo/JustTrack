import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useCountUp } from '@/components/motion';
import { OrnateFrame } from '@/components/ui/OrnateFrame';
import { Ring } from '@/components/ui/Ring';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { formatNumber } from '@/utils/format';

interface CaloriesLeftProps {
  eaten: number;
  goal: number;
}

const RING = 208;

/**
 * The headline: calories left today, as a ring under a cathedral arch with
 * the number in the middle. The ring draws on and the number counts as the
 * day fills in. Going over is stated calmly, in the same colours.
 */
export function CaloriesLeft({ eaten, goal }: CaloriesLeftProps) {
  const { colors } = useAppTheme();
  const remaining = Math.round(goal) - Math.round(eaten);
  const shown = useCountUp(Math.abs(remaining));
  const over = remaining < 0;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${formatNumber(eaten)} of ${formatNumber(goal)} calories eaten. ${formatNumber(Math.abs(remaining))} ${over ? 'over' : 'left'} today.`}
    >
      <OrnateFrame variant="arch" color={colors.accent} style={styles.frame}>
        <Ring progress={goal > 0 ? eaten / goal : 0} size={RING} stroke={5} ticks glow trackColor={colors.track}>
          <ThemedText variant="display" numberOfLines={1} adjustsFontSizeToFit style={[styles.number, { color: colors.onHero, textShadowColor: colors.glow }]}>
            {formatNumber(Math.round(shown))}
          </ThemedText>
          <ThemedText variant="overline" style={{ color: colors.onHeroMuted }}>
            {over ? 'KCAL OVER' : 'KCAL LEFT'}
          </ThemedText>
        </Ring>
      </OrnateFrame>
      {over ? (
        <ThemedText variant="tagline" style={{ color: colors.onHeroMuted }}>
          a bit over today, no stress
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.lg },
  frame: { width: RING + 52, alignItems: 'center', paddingTop: 44, paddingBottom: Spacing.md },
  number: { fontSize: 54, lineHeight: 60, letterSpacing: -2, maxWidth: RING - 56, textAlign: 'center', fontVariant: ['tabular-nums'], textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 } },
});
