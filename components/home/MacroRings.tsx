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

/**
 * The three macros are told apart by how they are drawn, not by hue: protein
 * is solid lavender, carbs solid white, fat hatched. Each is labelled.
 */
const MACROS = [
  { key: 'protein', label: 'protein', hatched: false },
  { key: 'carbs', label: 'carbs', hatched: false },
  { key: 'fat', label: 'fat', hatched: true },
] as const;

/** Three thin rings in a row, the number inside each, the name beneath. They sit on the hero, so their text is the hero's ink. */
export function MacroRings({ totals, goals }: MacroRingsProps) {
  const { colors } = useAppTheme();
  const shares = macroShares(totals);
  // On the hero the page is black in both themes, so "white" is the hero ink, not the theme's text.
  const inks = { protein: colors.accent, carbs: colors.onHero, fat: colors.accent };

  return (
    <View style={styles.row}>
      {MACROS.map(({ key, label, hatched }) => {
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
            accessibilityLabel={goals ? `${label}: ${formatNumber(eaten)} of ${formatNumber(goal)} grams, ${headline} ${left < 0 ? 'over' : 'left'}` : `${label}: ${headline} of today's calories`}
          >
            <Ring progress={progress} size={72} stroke={4} color={inks[key]} hatched={hatched} trackColor={colors.track}>
              <ThemedText variant="subheadEmphasized" style={[styles.tabular, { color: colors.onHero }]}>
                {headline}
              </ThemedText>
            </Ring>
            <ThemedText variant="caption1" style={{ color: colors.onHeroMuted }}>
              {caption}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: Spacing.lg },
  item: { alignItems: 'center', gap: Spacing.sm, flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
});
