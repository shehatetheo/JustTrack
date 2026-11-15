import React from 'react';
import { StyleSheet, View } from 'react-native';

import { GrowBar } from '@/components/ui/GrowBar';
import { ThemedText } from '@/components/ui/ThemedText';
import { HAIRLINE, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { macroShares } from '@/lib/log/entries';
import type { MacroGoals, NutritionValues } from '@/types';
import { formatNumber } from '@/utils/format';

interface MacroShareRowProps {
  totals: NutritionValues;
  /** When set, shows grams against the target instead of calorie shares. */
  goals?: MacroGoals | null;
  /** Sits on the hero artwork, so it takes the hero's inks. */
  onHero?: boolean;
}

const MACROS = [
  { key: 'protein', label: 'protein', hatched: false },
  { key: 'carbs', label: 'carbs', hatched: false },
  { key: 'fat', label: 'fat', hatched: true },
] as const;

/** Protein · carbs · fat, each with its key (solid lavender, solid white, hatched) and its share of today's calories or grams against a goal. */
export function MacroShareRow({ totals, goals, onHero = false }: MacroShareRowProps) {
  const { colors } = useAppTheme();
  const shares = macroShares(totals);
  const text = onHero ? colors.onHero : colors.text;
  const muted = onHero ? colors.onHeroMuted : colors.textSecondary;
  const inks = { protein: colors.accent, carbs: onHero ? colors.onHero : colors.carbs, fat: colors.accent };

  return (
    <View style={styles.row}>
      {MACROS.map(({ key, label, hatched }, index) => {
        const value = goals ? `${formatNumber(totals[key])} / ${formatNumber(goals[key])}g` : `${Math.round(shares[key] * 100)}%`;
        return (
          <View key={key} style={[styles.cell, index < MACROS.length - 1 && { borderRightWidth: HAIRLINE, borderRightColor: colors.border }]} accessible accessibilityLabel={`${label} ${value}`}>
            <View style={styles.key}>
              <View style={styles.swatch}>
                <GrowBar fraction={1} hatched={hatched} color={inks[key]} style={styles.swatchFill} />
              </View>
              <ThemedText variant="caption1" style={{ color: muted }}>
                {label}
              </ThemedText>
            </View>
            <ThemedText variant="headline" style={[styles.value, { color: text }]}>
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
  key: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs + 2 },
  swatch: { width: 14, height: 6, borderRadius: 2, overflow: 'hidden' },
  swatchFill: { height: '100%' },
  value: { fontVariant: ['tabular-nums'] },
});
