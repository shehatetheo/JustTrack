import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { macroShares } from '@/lib/log/entries';
import type { MacroGoals, NutritionValues } from '@/types';
import { formatNumber } from '@/utils/format';

interface MacroShareRowProps {
  totals: NutritionValues;
  /** When set, shows grams against the target instead of calorie shares. */
  goals?: MacroGoals | null;
  onGradient?: boolean;
}

const LABELS = [
  { key: 'protein', label: 'Protein' },
  { key: 'carbs', label: 'Carbs' },
  { key: 'fat', label: 'Fat' },
] as const;

/** Protein · Carbs · Fat, as shares of today's calories (or grams vs. goal). */
export function MacroShareRow({ totals, goals, onGradient = false }: MacroShareRowProps) {
  const { colors } = useAppTheme();
  const shares = macroShares(totals);
  // The row sits at the foot of the header, where the gradient has already faded into the page.
  const labelColor = onGradient ? colors.onHeroMuted : colors.textSecondary;
  const valueColor = onGradient ? colors.onHero : colors.text;

  return (
    <View style={styles.row}>
      {LABELS.map(({ key, label }, index) => {
        const value = goals ? `${formatNumber(totals[key])} / ${formatNumber(goals[key])}g` : `${Math.round(shares[key] * 100)}%`;
        return (
          <View
            key={key}
            style={[styles.cell, index < LABELS.length - 1 && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: onGradient ? 'rgba(90,59,244,0.18)' : colors.border }]}
            accessible
            accessibilityLabel={`${label} ${value}`}
          >
            <ThemedText variant="footnote" style={{ color: labelColor }}>
              {label}
            </ThemedText>
            <ThemedText variant="headline" style={[styles.value, { color: valueColor }]}>
              {value}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: Spacing.md },
  cell: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  value: { fontVariant: ['tabular-nums'] },
});
