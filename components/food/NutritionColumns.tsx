import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { macroShares } from '@/lib/log/entries';
import type { NutritionValues } from '@/types';
import { formatDecimal } from '@/utils/format';

/**
 * Protein / Carbs / Fat as three tall columns that fill from the bottom by
 * their share of the food's calories, with the grams underneath.
 */
export function NutritionColumns({ nutrition }: { nutrition: NutritionValues }) {
  const { colors } = useAppTheme();
  const shares = macroShares(nutrition);
  const columns = [
    { key: 'protein', label: 'Protein', color: colors.protein },
    { key: 'carbs', label: 'Carbs', color: colors.carbs },
    { key: 'fat', label: 'Fat', color: colors.fat },
  ] as const;

  return (
    <View style={styles.row}>
      {columns.map(({ key, label, color }) => {
        const share = shares[key];
        return (
          <View
            key={key}
            style={[styles.column, { backgroundColor: colors.surface }]}
            accessible
            accessibilityLabel={`${label} ${formatDecimal(nutrition[key])} grams, ${Math.round(share * 100)} percent of calories`}
          >
            <View style={[styles.fill, { height: `${Math.round(Math.max(share, 0.04) * 100)}%`, backgroundColor: color }]} />
            <ThemedText variant="footnote" color="secondary" style={styles.label}>
              {label}
            </ThemedText>
            <View style={styles.bottom}>
              <ThemedText variant="headline" style={styles.tabular}>
                {formatDecimal(nutrition[key])} g
              </ThemedText>
              <ThemedText variant="caption1" color="secondary" style={styles.tabular}>
                {Math.round(share * 100)}%
              </ThemedText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md, height: 190 },
  column: { flex: 1, borderRadius: Radii.lg, overflow: 'hidden', justifyContent: 'space-between', padding: Spacing.md },
  fill: { position: 'absolute', left: 0, right: 0, bottom: 0, opacity: 0.22, borderTopLeftRadius: Radii.md, borderTopRightRadius: Radii.md },
  label: { textAlign: 'center' },
  bottom: { alignItems: 'center', gap: 2 },
  tabular: { fontVariant: ['tabular-nums'] },
});
