import React from 'react';
import { StyleSheet, View } from 'react-native';

import { CountUp } from '@/components/motion';
import { Card } from '@/components/ui/Card';
import { Stamp } from '@/components/ui/Stamp';
import { ThemedText } from '@/components/ui/ThemedText';
import { HAIRLINE, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import type { StreakSummary } from '@/lib/log/streak';

function line(streak: StreakSummary): string {
  if (streak.current === 0) return streak.best > 0 ? `log a meal to start again. your best is ${streak.best}.` : 'log a meal today and the count starts.';
  if (streak.waiting) return 'log something today to hold it.';
  if (streak.current >= streak.best && streak.current > 1) return 'your longest run yet.';
  return 'logged today. same again tomorrow.';
}

/** Days in a row with food logged: the count, a postmark for it, and the last week laid out as seven plates. */
export function StreakCard({ streak }: { streak: StreakSummary }) {
  const { colors } = useAppTheme();

  return (
    <Card style={styles.card} accessible accessibilityLabel={`${streak.current} day streak. Best ${streak.best}. ${line(streak)}`}>
      <View style={styles.top}>
        <View style={styles.words}>
          <ThemedText variant="overline" color="tertiary">
            LOGGING STREAK
          </ThemedText>
          <View style={styles.figure}>
            <CountUp value={streak.current} variant="figure" style={{ color: streak.waiting ? colors.textSecondary : colors.text }} />
            <ThemedText variant="subhead" color="secondary">
              {streak.current === 1 ? 'day' : 'days'} · best {streak.best}
            </ThemedText>
          </View>
        </View>
        {streak.current > 0 ? <Stamp label={`${streak.current} ${streak.current === 1 ? 'day' : 'days'}`} caption="streak" size={64} accent thump={streak.current} seed={streak.current + 2} accessibilityLabel={`${streak.current} day streak stamp`} /> : null}
      </View>

      <View style={styles.week}>
        {streak.week.map(({ date, logged }, index) => {
          const isToday = index === streak.week.length - 1;
          return (
            <View key={date.toISOString()} style={styles.day}>
              <View style={[styles.plate, { backgroundColor: logged ? colors.accent : 'transparent', borderColor: logged ? colors.accent : isToday ? colors.text : colors.border }]} />
              <ThemedText variant="caption2" color={isToday ? 'primary' : 'tertiary'}>
                {date.toLocaleDateString('en-US', { weekday: 'narrow' }).toLowerCase()}
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
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  words: { gap: Spacing.xs, flex: 1 },
  figure: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  week: { flexDirection: 'row', gap: Spacing.sm },
  day: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  plate: { alignSelf: 'stretch', height: 8, borderRadius: 2, borderWidth: HAIRLINE },
});
