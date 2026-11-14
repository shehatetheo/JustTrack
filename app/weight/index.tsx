import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CloseButton } from '@/components/ui/CloseButton';
import { ListRow, ListSection } from '@/components/ui/ListRow';
import { PillTabs } from '@/components/ui/PillTabs';
import { ThemedText } from '@/components/ui/ThemedText';
import { WeightChart } from '@/components/weight/WeightChart';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useSettings } from '@/hooks/useSettings';
import { useWeights } from '@/hooks/useWeights';
import { WEIGHT_RANGES, weightSummary, type WeightRange } from '@/lib/weight/trend';
import { removeWeight } from '@/lib/weight/weightStore';
import { confirmAsync } from '@/utils/actionSheet';
import { parseDateKey } from '@/utils/date';
import { weightDelta, weightValue } from '@/utils/weight';

const RANGE_WORDS: Record<WeightRange, string> = { '1W': 'this week', '1M': 'in 30 days', '3M': 'in 90 days', ALL: 'since you started' };

function longDate(key: string): string {
  return parseDateKey(key)?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) ?? key;
}

/** Weight: where it is, where it's heading, and every weigh-in behind the line. */
export default function WeightScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { today } = useCurrentTime();
  const { weightUnit, goalWeightKg } = useSettings();
  const entries = useWeights();
  const [range, setRange] = useState<WeightRange>('1M');
  const summary = weightSummary(entries, range, today);
  const latest = entries[entries.length - 1] ?? null;
  const toGoal = latest && goalWeightKg !== null ? goalWeightKg - latest.kg : null;
  const history = [...entries].reverse().slice(0, 60);

  const remove = async (date: string) => {
    const confirmed = await confirmAsync({ title: 'Delete this weigh-in?', message: longDate(date), confirmLabel: 'Delete' });
    if (confirmed) removeWeight(date);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerLeft: () => <CloseButton back onPress={() => router.back()} />, headerTitleAlign: 'center' }} />

      <View style={styles.head}>
        <ThemedText variant="overline" color="tertiary">
          {latest ? `CURRENT · ${longDate(latest.date).toUpperCase()}` : 'NO WEIGH-INS YET'}
        </ThemedText>
        <View style={styles.figure}>
          <ThemedText variant="display" style={styles.number}>
            {latest ? weightValue(latest.kg, weightUnit) : '—'}
          </ThemedText>
          <ThemedText variant="title3" color="secondary">
            {weightUnit}
          </ThemedText>
        </View>
        {summary.change !== null ? (
          <View style={styles.delta}>
            <AppIcon name={summary.change <= 0 ? 'chevronDown' : 'chevronUp'} size={12} color={colors.textSecondary} weight="bold" />
            <ThemedText variant="subhead" color="secondary" style={styles.tabular}>
              {weightDelta(summary.change, weightUnit)} {RANGE_WORDS[range]}
            </ThemedText>
          </View>
        ) : (
          <ThemedText variant="subhead" color="secondary">
            {latest ? 'One more weigh-in and the trend starts.' : 'Weigh in at the same time of day for a cleaner line.'}
          </ThemedText>
        )}
      </View>

      <PillTabs options={WEIGHT_RANGES} value={range} onChange={setRange} accessibilityLabel="Time range" />

      <Card style={styles.chart}>
        {summary.points.length > 0 ? (
          <WeightChart key={range} points={summary.points} unit={weightUnit} goalKg={goalWeightKg} />
        ) : (
          <View style={styles.empty}>
            <ThemedText variant="headline">{entries.length > 0 ? 'Nothing in this range' : 'Your line starts here'}</ThemedText>
            <ThemedText variant="footnote" color="secondary" style={styles.centerText}>
              {entries.length > 0 ? 'Pick a longer range, or log a weigh-in today.' : 'Log a weigh-in and the chart draws the trend through the daily ups and downs.'}
            </ThemedText>
          </View>
        )}
      </Card>

      <View style={styles.stats}>
        <Stat label="CHANGE" value={summary.change !== null ? weightDelta(summary.change, weightUnit) : '—'} />
        <Stat label="PER WEEK" value={summary.perWeek !== null ? weightDelta(summary.perWeek, weightUnit) : '—'} />
        <Stat label="TO GOAL" value={toGoal !== null ? weightDelta(toGoal, weightUnit) : '—'} />
      </View>

      <Button label="Log weight" onPress={() => router.push('/weight/log')} />

      <ListSection footer="The solid line is your trend: an average that leans on recent days, so one salty dinner doesn’t move it much. Dots are the raw weigh-ins.">
        <ListRow icon="target" title="Goal weight" value={goalWeightKg !== null ? `${weightValue(goalWeightKg, weightUnit)} ${weightUnit}` : 'Not set'} onPress={() => router.push({ pathname: '/weight/log', params: { goal: '1' } })} isLast />
      </ListSection>

      {history.length > 0 ? (
        <ListSection title="History" footer="Tap a weigh-in to delete it. Everything here stays on this phone.">
          {history.map((entry, index) => {
            const before = entries[entries.length - 1 - index - 1];
            return (
              <ListRow
                key={entry.date}
                title={longDate(entry.date)}
                value={`${weightValue(entry.kg, weightUnit)} ${weightUnit}${before ? `  ${weightDelta(entry.kg - before.kg, weightUnit).replace(` ${weightUnit}`, '')}` : ''}`}
                showChevron={false}
                onPress={() => void remove(entry.date)}
                isLast={index === history.length - 1}
              />
            );
          })}
        </ListSection>
      ) : null}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.stat}>
      <ThemedText variant="overline" color="tertiary">
        {label}
      </ThemedText>
      <ThemedText variant="headline" style={styles.tabular} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, paddingBottom: Spacing['5xl'], gap: Spacing.lg },
  head: { alignItems: 'center', gap: Spacing.xs, paddingTop: Spacing.sm },
  figure: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  number: { fontVariant: ['tabular-nums'], fontSize: 68, lineHeight: 74, letterSpacing: -2.5 },
  delta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  chart: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.md },
  empty: { height: 220, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  centerText: { textAlign: 'center' },
  stats: { flexDirection: 'row', gap: Spacing.sm },
  stat: { flex: 1, gap: Spacing.xs, padding: Spacing.md },
  tabular: { fontVariant: ['tabular-nums'] },
});
