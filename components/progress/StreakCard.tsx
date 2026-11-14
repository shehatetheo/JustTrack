import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import type { StreakSummary } from '@/lib/log/streak';

function line(streak: StreakSummary): string {
  if (streak.current === 0) return streak.best > 0 ? `Log a meal to start again. Your best is ${streak.best}.` : 'Log a meal today and the count starts.';
  if (streak.waiting) return 'Log something today to hold it.';
  if (streak.current >= streak.best && streak.current > 1) return 'Your longest run yet.';
  return 'Logged today. Same again tomorrow.';
}

/** Days in a row with food logged, with the last week laid out as seven plates. */
export function StreakCard({ streak }: { streak: StreakSummary }) {
  const { colors } = useAppTheme();

  return (
    <Card style={styles.card} accessible accessibilityLabel={`${streak.current} day streak. Best ${streak.best}. ${line(streak)}`}>
      <View style={styles.top}>
        <View style={styles.figure}>
          <ThemedText variant="largeTitle" style={[styles.number, { color: streak.waiting ? colors.textSecondary : colors.text }]}>
            {streak.current}
          </ThemedText>
          <ThemedText variant="overline" color="tertiary">
            DAY STREAK
          </ThemedText>
        </View>
        <View style={styles.best}>
          <ThemedText variant="overline" color="tertiary">
            BEST
          </ThemedText>
          <ThemedText variant="headline" style={styles.tabular}>
            {streak.best}
          </ThemedText>
        </View>
      </View>

      <View style={styles.week}>
        {streak.week.map(({ date, logged }, index) => {
          const isToday = index === streak.week.length - 1;
          return (
            <View key={date.toISOString()} style={styles.day}>
              <View style={[styles.plate, { backgroundColor: logged ? colors.text : 'transparent', borderColor: logged ? colors.text : isToday ? colors.accent : colors.border }]} />
              <ThemedText variant="caption2" color={isToday ? 'primary' : 'tertiary'} style={styles.dayLabel}>
                {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
              </ThemedText>
            </View>
          );
        })}
      </View>

      <ThemedText variant="footnote" color="secondary">
        {line(streak)}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  top: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  figure: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  number: { fontSize: 48, lineHeight: 52, letterSpacing: -1.8, fontVariant: ['tabular-nums'] },
  best: { alignItems: 'flex-end', gap: 2 },
  week: { flexDirection: 'row', gap: Spacing.sm },
  day: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  plate: { alignSelf: 'stretch', height: 10, borderRadius: 3, borderWidth: StyleSheet.hairlineWidth * 2 },
  dayLabel: { fontWeight: '700' },
  tabular: { fontVariant: ['tabular-nums'] },
});
