import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MacroShareRow } from '@/components/home/MacroShareRow';
import { StreakCard } from '@/components/progress/StreakCard';
import { WeightCard } from '@/components/progress/WeightCard';
import { GradientHeader } from '@/components/layout/GradientHeader';
import { AppIcon } from '@/components/ui/AppIcon';
import { Card } from '@/components/ui/Card';
import { GrowBar } from '@/components/ui/GrowBar';
import { ThemedText } from '@/components/ui/ThemedText';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useLog } from '@/hooks/useLog';
import { useSettings } from '@/hooks/useSettings';
import { caloriesByDay } from '@/lib/log/day';
import { streakSummary } from '@/lib/log/streak';
import { balanceScore, MIN_CALORIES_FOR_SCORE } from '@/lib/nutrition/balance';
import { addDays } from '@/utils/date';
import { formatNumber } from '@/utils/format';

/** Progress: today's intake, the streak, weight, balance, calories by meal, and the week so far. */
export default function ProgressScreen() {
  const { colors } = useAppTheme();
  const { today } = useCurrentTime();
  const { sections, totals, all } = useLog(today);
  const settings = useSettings();
  const balance = balanceScore(totals);
  const streak = streakSummary(all, today);
  const maxMeal = Math.max(...sections.map((section) => section.totals.calories), 1);
  const week = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
  const weekCalories = caloriesByDay(all, week);
  const maxDay = Math.max(...weekCalories, settings.calorieGoal, 1);
  const progress = settings.calorieGoal > 0 ? Math.min(totals.calories / settings.calorieGoal, 1) : 0;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <GradientHeader seed={19}>
        <ThemedText variant="headline" style={[styles.center, { color: colors.onGradient }]} accessibilityRole="header">
          Progress
        </ThemedText>
        <View style={styles.headline}>
          <ThemedText variant="display" style={[styles.tabular, { color: colors.onGradient }]}>
            {formatNumber(totals.calories)}
          </ThemedText>
          <ThemedText variant="subhead" style={{ color: colors.onGradientMuted }}>
            of {formatNumber(settings.calorieGoal)} kcal eaten today
          </ThemedText>
          <View style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.25)' }]} accessible accessibilityLabel={`${Math.round(progress * 100)} percent of your goal`}>
            <GrowBar fraction={progress} style={[styles.fill, { backgroundColor: colors.onGradient }]} />
          </View>
        </View>
        <MacroShareRow totals={totals} goals={settings.macroGoals} onGradient />
      </GradientHeader>

      <View style={styles.body}>
        <StreakCard streak={streak} />
        <WeightCard today={today} />

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText variant="headline">Balance</ThemedText>
            <Pressable onPress={() => Alert.alert('Balance', 'How close your calorie split is to the standard ranges: protein 10–35%, carbs 45–65%, fat 20–35%. A rough guide, not advice.')} accessibilityRole="button" accessibilityLabel="What is balance?" hitSlop={10}>
              <AppIcon name="info" size={16} color={colors.textTertiary} />
            </Pressable>
          </View>
          {balance ? (
            <>
              <View style={styles.scoreRow}>
                <ThemedText variant="largeTitle" style={styles.tabular}>
                  {balance.score}
                </ThemedText>
                <ThemedText variant="subhead" color="secondary">
                  / 100
                </ThemedText>
              </View>
              <ThemedText variant="footnote" color="secondary">
                {balance.note ?? 'Protein, carbs, and fat are all inside the recommended ranges.'}
              </ThemedText>
            </>
          ) : (
            <ThemedText variant="footnote" color="secondary">
              Log at least {formatNumber(MIN_CALORIES_FOR_SCORE)} kcal to see how balanced the day is.
            </ThemedText>
          )}
        </Card>

        <Card style={styles.card}>
          <ThemedText variant="headline">Calories by meal</ThemedText>
          <View style={styles.meals}>
            {sections.map((section) => {
              const share = section.totals.calories / Math.max(totals.calories, 1);
              return (
                <View key={section.mealType} style={styles.mealRow} accessible accessibilityLabel={`${MEAL_TYPE_META[section.mealType].label} ${formatNumber(section.totals.calories)} calories`}>
                  <View style={styles.mealHead}>
                    <ThemedText variant="subhead">{MEAL_TYPE_META[section.mealType].label}</ThemedText>
                    <View style={styles.mealValue}>
                      <ThemedText variant="subheadEmphasized" style={styles.tabular}>
                        {formatNumber(section.totals.calories)}
                      </ThemedText>
                      <ThemedText variant="caption1" color="tertiary" style={styles.tabular}>
                        {section.totals.calories > 0 ? ` · ${Math.round(share * 100)}%` : ''}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[styles.barTrack, { backgroundColor: colors.accentMuted }]}>
                    <GrowBar fraction={section.totals.calories / maxMeal} style={[styles.barFill, { backgroundColor: colors.accent }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        <Card style={styles.card}>
          <ThemedText variant="headline">Last 7 days</ThemedText>
          <View style={styles.week} accessible accessibilityLabel={week.map((day, index) => `${day.toLocaleDateString('en-US', { weekday: 'long' })} ${formatNumber(weekCalories[index])} calories`).join(', ')}>
            {week.map((day, index) => (
              <View key={day.toISOString()} style={styles.weekDay}>
                <View style={[styles.weekTrack, { backgroundColor: colors.accentMuted }]}>
                  <GrowBar axis="y" delay={index * 40} fraction={weekCalories[index] / maxDay} style={[styles.weekFill, { backgroundColor: index === 6 ? colors.text : colors.textTertiary }]} />
                </View>
                <ThemedText variant="caption2" color={index === 6 ? 'primary' : 'secondary'}>
                  {day.toLocaleDateString('en-US', { weekday: 'narrow' })}
                </ThemedText>
              </View>
            ))}
          </View>
          <ThemedText variant="caption1" color="tertiary">
            Calories logged each day, against your {formatNumber(settings.calorieGoal)} kcal goal.
          </ThemedText>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing['5xl'] },
  center: { textAlign: 'center' },
  headline: { alignItems: 'center', paddingTop: Spacing['2xl'], gap: Spacing.xs },
  track: { width: 200, height: 6, borderRadius: Radii.full, overflow: 'hidden', marginTop: Spacing.md },
  fill: { height: '100%', borderRadius: Radii.full },
  body: { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingTop: Spacing.sm },
  card: { gap: Spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs },
  meals: { gap: Spacing.md, marginTop: Spacing.xs },
  mealRow: { gap: Spacing.xs + 2 },
  mealHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: Spacing.md },
  mealValue: { flexDirection: 'row', alignItems: 'baseline', flexShrink: 0 },
  barTrack: { height: 8, borderRadius: Radii.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radii.full },
  week: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm, height: 110, paddingTop: Spacing.xs },
  weekDay: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  weekTrack: { flex: 1, width: '100%', borderRadius: Radii.md, overflow: 'hidden', justifyContent: 'flex-end' },
  weekFill: { width: '100%', borderRadius: Radii.md },
  tabular: { fontVariant: ['tabular-nums'] },
});
