import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { WeightChart } from '@/components/weight/WeightChart';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/hooks/useSettings';
import { useWeights } from '@/hooks/useWeights';
import { weightSummary } from '@/lib/weight/trend';
import { weightDelta, weightValue } from '@/utils/weight';

/** Weight at a glance: the latest number, the month's change, and the trend line. Opens the full chart. */
export function WeightCard({ today }: { today: Date }) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { weightUnit } = useSettings();
  const entries = useWeights();
  const summary = weightSummary(entries, '1M', today);
  const latest = entries[entries.length - 1] ?? null;

  if (!latest) {
    return (
      <Card style={styles.card}>
        <ThemedText variant="headline">Weight</ThemedText>
        <ThemedText variant="footnote" color="secondary">
          Weigh in a few times a week and watch the trend, not the day-to-day noise.
        </ThemedText>
        <Button label="Log weight" variant="secondary" size="md" onPress={() => router.push('/weight/log')} />
      </Card>
    );
  }

  return (
    <Pressable onPress={() => router.push('/weight')} accessibilityRole="button" accessibilityLabel={`Weight ${weightValue(latest.kg, weightUnit)} ${weightUnit}. Open the chart.`} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <ThemedText variant="headline">Weight</ThemedText>
          <AppIcon name="chevronRight" size={14} color={colors.textTertiary} weight="semibold" />
        </View>
        <View style={styles.row}>
          <View style={styles.figure}>
            <View style={styles.value}>
              <ThemedText variant="largeTitle" style={styles.tabular}>
                {weightValue(latest.kg, weightUnit)}
              </ThemedText>
              <ThemedText variant="subhead" color="secondary">
                {weightUnit}
              </ThemedText>
            </View>
            <ThemedText variant="footnote" color="secondary" style={styles.tabular}>
              {summary.change !== null ? `${weightDelta(summary.change, weightUnit)} in 30 days` : 'Log again to see the trend'}
            </ThemedText>
          </View>
          <View style={styles.spark}>{summary.points.length > 0 ? <WeightChart points={summary.points} unit={weightUnit} height={64} compact /> : null}</View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.lg },
  figure: { gap: 2 },
  value: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs },
  spark: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
});
