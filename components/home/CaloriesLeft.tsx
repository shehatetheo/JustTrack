import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCountUp } from '@/hooks/useCountUp';
import { formatNumber } from '@/utils/format';

interface CaloriesLeftProps {
  eaten: number;
  goal: number;
}

/** The headline: how many calories are left today, counting as it changes. */
export function CaloriesLeft({ eaten, goal }: CaloriesLeftProps) {
  const { colors } = useAppTheme();
  const remaining = Math.round(goal) - Math.round(eaten);
  const shown = useCountUp(Math.abs(remaining));
  const over = remaining < 0;

  return (
    <View style={styles.container} accessible accessibilityRole="text" accessibilityLabel={`${formatNumber(Math.abs(remaining))} calories ${over ? 'over' : 'left'} today`}>
      <ThemedText variant="display" style={[styles.number, { color: colors.onGradient }]}>
        {formatNumber(shown)}
      </ThemedText>
      <ThemedText variant="overline" style={{ color: over ? colors.danger : colors.onGradient, opacity: over ? 1 : 0.8 }}>
        {over ? 'KCAL OVER' : 'KCAL LEFT'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: Spacing['2xl'], paddingBottom: Spacing.sm },
  number: { fontVariant: ['tabular-nums'], textAlign: 'center' },
});
