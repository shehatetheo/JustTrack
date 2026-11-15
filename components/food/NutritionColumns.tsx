import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';

import { CountUp } from '@/components/motion';
import { ThemedText } from '@/components/ui/ThemedText';
import { Duration, Springs } from '@/constants/motion';
import { HAIRLINE, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { macroShares } from '@/lib/log/entries';
import type { NutritionValues } from '@/types';
import { formatDecimal } from '@/utils/format';

function Column({ label, grams, share, color, hatched }: { label: string; grams: number; share: number; color: string; hatched: boolean }) {
  const { colors } = useAppTheme();
  // The fill follows the portion: it springs to its new height as the amount changes.
  const level = useDerivedValue(() => withSpring(Math.max(share, 0.04), Springs.settle));
  const fill = useAnimatedStyle(() => ({ height: `${Math.round(level.get() * 100)}%` }));
  return (
    <View style={[styles.column, { backgroundColor: colors.surface, borderColor: colors.border }]} accessible accessibilityLabel={`${label} ${formatDecimal(grams)} grams, ${Math.round(share * 100)} percent of calories`}>
      <Animated.View style={[styles.fill, { backgroundColor: hatched ? 'transparent' : color, borderTopColor: color, opacity: hatched ? 0.9 : 0.24 }, fill]}>
        {hatched ? (
          <View style={styles.hatch}>
            {Array.from({ length: 16 }, (_, index) => (
              <View key={index} style={[styles.hatchLine, { backgroundColor: color, top: index * 12 }]} />
            ))}
          </View>
        ) : null}
      </Animated.View>
      <ThemedText variant="overline" color="secondary" style={styles.center}>
        {label.toUpperCase()}
      </ThemedText>
      <View style={styles.bottom}>
        <CountUp value={grams} durationMs={Duration.standard} format={(value) => `${formatDecimal(value)} g`} variant="headline" style={styles.tabular} />
        <ThemedText variant="caption1" color="secondary" style={styles.tabular}>
          {Math.round(share * 100)}%
        </ThemedText>
      </View>
    </View>
  );
}

/**
 * Protein, carbs and fat as three tall columns that fill from the bottom by
 * their share of the food's calories, with the grams underneath. Protein is
 * lavender, carbs white, fat hatched, as on Home's rings.
 */
export function NutritionColumns({ nutrition }: { nutrition: NutritionValues }) {
  const { colors } = useAppTheme();
  const shares = macroShares(nutrition);
  return (
    <View style={styles.row}>
      <Column label="Protein" grams={nutrition.protein} share={shares.protein} color={colors.protein} hatched={false} />
      <Column label="Carbs" grams={nutrition.carbs} share={shares.carbs} color={colors.carbs} hatched={false} />
      <Column label="Fat" grams={nutrition.fat} share={shares.fat} color={colors.fat} hatched />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md, height: 168 },
  column: { flex: 1, borderRadius: Radii.lg, borderWidth: HAIRLINE, overflow: 'hidden', justifyContent: 'space-between', padding: Spacing.md },
  fill: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: HAIRLINE, overflow: 'hidden' },
  hatch: { ...StyleSheet.absoluteFill, opacity: 0.45 },
  hatchLine: { position: 'absolute', left: -20, right: -20, height: HAIRLINE, transform: [{ rotate: '-24deg' }] },
  center: { textAlign: 'center' },
  bottom: { alignItems: 'center', gap: 2 },
  tabular: { fontVariant: ['tabular-nums'] },
});
