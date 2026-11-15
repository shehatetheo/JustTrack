import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import type { NutritionValues } from '@/types';
import { formatDecimal, formatNumber } from '@/utils/format';

interface NutritionSummaryProps {
  nutrition: NutritionValues;
  /** What the numbers are for, e.g. "150 g". */
  caption?: string;
  /** AI-derived numbers are always labeled as estimates. */
  estimated?: boolean;
}

export function NutritionSummary({ nutrition, caption, estimated = false }: NutritionSummaryProps) {
  const { colors } = useAppTheme();
  const macros = [
    { label: 'Protein', value: nutrition.protein, color: colors.protein },
    { label: 'Carbs', value: nutrition.carbs, color: colors.carbs },
    { label: 'Fat', value: nutrition.fat, color: colors.fat },
  ];
  const spoken = `${estimated ? 'Estimated: ' : ''}${formatNumber(nutrition.calories)} calories${caption ? ` for ${caption}` : ''}. ${macros
    .map((macro) => `${macro.label} ${formatDecimal(macro.value)} grams`)
    .join(', ')}.`;

  return (
    <Card style={styles.card} accessible accessibilityLabel={spoken}>
      {estimated ? (
        <View style={[styles.estimate, { backgroundColor: colors.surfaceRaised }]}>
          <ThemedText variant="caption2" color="secondary">
            ESTIMATED NUTRITION
          </ThemedText>
        </View>
      ) : null}
      <View style={styles.calories}>
        <ThemedText variant="largeTitle" style={styles.tabular}>
          {formatNumber(nutrition.calories)}
        </ThemedText>
        <ThemedText variant="subhead" color="secondary">
          calories{caption ? ` · ${caption}` : ''}
        </ThemedText>
      </View>
      <View style={styles.macros}>
        {macros.map((macro) => (
          <View key={macro.label} style={styles.macro}>
            <View style={styles.macroLabel}>
              <View style={[styles.dot, { backgroundColor: macro.color }]} />
              <ThemedText variant="footnote" color="secondary">
                {macro.label}
              </ThemedText>
            </View>
            <ThemedText variant="headline" style={styles.tabular}>
              {formatDecimal(macro.value)} g
            </ThemedText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.lg },
  estimate: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radii.full },
  calories: { gap: 2 },
  macros: { flexDirection: 'row', justifyContent: 'space-between' },
  macro: { gap: 2 },
  macroLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  tabular: { fontVariant: ['tabular-nums'] },
});
