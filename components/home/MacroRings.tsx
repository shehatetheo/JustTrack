import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Ring } from '@/components/ui/Ring';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { macroShares } from '@/lib/log/entries';
import type { MacroGoals, NutritionValues } from '@/types';
import { formatNumber } from '@/utils/format';

interface MacroRingsProps {
  totals: NutritionValues;
  /** With targets set, each ring shows grams left; otherwise its share of today's calories. */
  goals?: MacroGoals | null;
}

const MACROS = [
  { key: 'protein', label: 'Protein' },
  { key: 'carbs', label: 'Carbs' },
  { key: 'fat', label: 'Fat' },
] as const;

/** Three rings in a row, the number inside each: protein, carbs, fat. No boxes, nothing to read twice. */
export function MacroRings({ totals, goals }: MacroRingsProps) {
  const { colors } = useAppTheme();
  const shares = macroShares(totals);

  return (
    <View style={styles.row}>
      {MACROS.map(({ key, label }) => {
        const eaten = totals[key];
        const goal = goals?.[key] ?? 0;
        const left = goal - eaten;
        const progress = goals ? (goal > 0 ? eaten / goal : 0) : shares[key];
        const headline = goals ? `${formatNumber(Math.abs(left))}g` : `${Math.round(shares[key] * 100)}%`;
        const caption = goals ? (left < 0 ? `${label} over` : `${label} left`) : label;
        return (
          <View
            key={key}
            style={styles.item}
            accessible
            accessibilityLabel={goals ? `${label}: ${formatNumber(eaten)} of ${formatNumber(goal)} grams, ${headline} ${left < 0 ? 'over' : 'left'}` : `${label} ${headline} of today's calories`}
          >
            <Ring progress={progress} size={76} stroke={7} color={colors[key]} trackColor={colors.surfaceRaised}>
              <ThemedText variant="subheadEmphasized" style={styles.tabular}>
                {headline}
              </ThemedText>
            </Ring>
            <ThemedText variant="caption1" color="secondary">
              {caption}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-evenly', paddingTop: Spacing.sm },
  item: { alignItems: 'center', gap: Spacing.xs },
  tabular: { fontVariant: ['tabular-nums'] },
});
