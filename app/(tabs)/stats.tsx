import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { GridPatch } from '@/components/decor';
import { MacroShareRow } from '@/components/home/MacroShareRow';
import { Hero } from '@/components/layout/Hero';
import { CountUp, PressScale, Stagger } from '@/components/motion';
import { RankBadge } from '@/components/progress/RankBadge';
import { StreakCard } from '@/components/progress/StreakCard';
import { WeightCard } from '@/components/progress/WeightCard';
import { AppIcon } from '@/components/ui/AppIcon';
import { Card } from '@/components/ui/Card';
import { GrowBar } from '@/components/ui/GrowBar';
import { Heading } from '@/components/ui/Heading';
import { OrnateFrame } from '@/components/ui/OrnateFrame';
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
import { rankFor, rankLine } from '@/lib/nutrition/rank';
import { addDays } from '@/utils/date';
import { formatNumber } from '@/utils/format';

const BALANCE_NOTE = 'how close your split of calories is to the usual ranges: protein 10–35%, carbs 45–65%, fat 20–35%. the letter adds one thing: logging seven days running. a rough guide, not advice.';

/** Today: what has been eaten, how balanced it is, the streak, weight, and the week so far. */
export default function TodayScreen() {
  const { colors } = useAppTheme();
  const { today } = useCurrentTime();
  const { sections, totals, all } = useLog(today);
  const settings = useSettings();
  const [explaining, setExplaining] = useState(false);
  const balance = balanceScore(totals);
  const streak = streakSummary(all, today);
  const rank = rankFor(balance?.score ?? null, streak.current);
  const maxMeal = Math.max(...sections.map((section) => section.totals.calories), 1);
  const week = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
  const weekCalories = caloriesByDay(all, week);
  const maxDay = Math.max(...weekCalories, settings.calorieGoal, 1);
  const progress = settings.calorieGoal > 0 ? Math.min(totals.calories / settings.calorieGoal, 1) : 0;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <Hero page="today" veil={0.35}>
        <Heading title="today" tagline="the shape of the day" level="title" align="center" onHero />
        <View style={styles.headline} accessible accessibilityLabel={`${formatNumber(totals.calories)} of ${formatNumber(settings.calorieGoal)} calories eaten today`}>
          <CountUp value={totals.calories} variant="display" style={{ color: colors.onHero, textShadowColor: colors.glow, textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 } }} />
          <ThemedText variant="subhead" style={{ color: colors.onHeroMuted }}>
            of {formatNumber(settings.calorieGoal)} kcal eaten today
          </ThemedText>
          <View style={[styles.track, { backgroundColor: colors.track }]}>
            <GrowBar fraction={progress} style={styles.fill} />
          </View>
        </View>
        <MacroShareRow totals={totals} goals={settings.macroGoals} onHero />
      </Hero>

      <View style={styles.body}>
        <Stagger index={0}>
          <OrnateFrame variant="corners" corner={30}>
            <Card lit style={styles.balance}>
              <View style={styles.balanceWords}>
                <View style={styles.cardHeader}>
                  <ThemedText variant="overline" color="tertiary">
                    BALANCE
                  </ThemedText>
                  <PressScale onPress={() => setExplaining((open) => !open)} haptic="select" accessibilityRole="button" accessibilityLabel="What is balance?" accessibilityState={{ expanded: explaining }} hitSlop={14}>
                    <AppIcon name="info" size={15} color={colors.textTertiary} />
                  </PressScale>
                </View>
                {balance ? (
                  <>
                    <View style={styles.scoreRow}>
                      <CountUp value={balance.score} variant="figure" />
                      <ThemedText variant="subhead" color="secondary">
                        / 100
                      </ThemedText>
                    </View>
                    <ThemedText variant="footnote" color="secondary">
                      {(balance.note ?? 'protein, carbs and fat are all inside the usual ranges.').toLowerCase()}
                    </ThemedText>
                    {rank ? (
                      <ThemedText variant="tagline" color="secondary">
                        {rankLine(rank, balance.score, streak.current)}
                      </ThemedText>
                    ) : null}
                  </>
                ) : (
                  <ThemedText variant="footnote" color="secondary">
                    log at least {formatNumber(MIN_CALORIES_FOR_SCORE)} kcal to see how balanced the day is.
                  </ThemedText>
                )}
                {explaining ? (
                  <ThemedText variant="caption1" color="tertiary">
                    {BALANCE_NOTE}
                  </ThemedText>
                ) : null}
              </View>
              {rank ? <RankBadge rank={rank} /> : null}
            </Card>
          </OrnateFrame>
        </Stagger>

        <Stagger index={1}>
          <StreakCard streak={streak} />
        </Stagger>
        <Stagger index={2}>
          <WeightCard today={today} />
        </Stagger>

        <Stagger index={3}>
          <Card style={styles.card}>
            <ThemedText variant="overline" color="tertiary">
              CALORIES BY MEAL
            </ThemedText>
            <View style={styles.meals}>
              {sections.map((section, index) => {
                const share = section.totals.calories / Math.max(totals.calories, 1);
                return (
                  <View key={section.mealType} style={styles.mealRow} accessible accessibilityLabel={`${MEAL_TYPE_META[section.mealType].label}: ${formatNumber(section.totals.calories)} calories, ${Math.round(share * 100)} percent of today`}>
                    <View style={styles.mealHead}>
                      <ThemedText variant="subhead">{MEAL_TYPE_META[section.mealType].label.toLowerCase()}</ThemedText>
                      <ThemedText variant="subheadEmphasized" style={styles.tabular}>
                        {formatNumber(section.totals.calories)}
                        <ThemedText variant="caption1" color="tertiary">
                          {section.totals.calories > 0 ? `  ${Math.round(share * 100)}%` : ''}
                        </ThemedText>
                      </ThemedText>
                    </View>
                    <View style={[styles.barTrack, { backgroundColor: colors.track }]}>
                      <GrowBar fraction={section.totals.calories / maxMeal} delay={index * 60} style={styles.barFill} />
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        </Stagger>

        <Stagger index={4}>
          <Card style={styles.card}>
            <ThemedText variant="overline" color="tertiary">
              LAST 7 DAYS
            </ThemedText>
            <View style={styles.week} accessible accessibilityRole="image" accessibilityLabel={week.map((day, index) => `${day.toLocaleDateString('en-US', { weekday: 'long' })} ${formatNumber(weekCalories[index])} calories`).join(', ')}>
              <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <GridPatch width={340} height={WEEK_HEIGHT} cell={12} opacity={0.5} />
              </View>
              {week.map((day, index) => (
                <View key={day.toISOString()} style={styles.weekDay}>
                  <ThemedText variant="caption2" color="tertiary" style={styles.tabular}>
                    {weekCalories[index] > 0 ? formatNumber(weekCalories[index]) : ''}
                  </ThemedText>
                  <View style={styles.weekTrack}>
                    <GrowBar axis="y" delay={index * 40} fraction={weekCalories[index] / maxDay} color={index === 6 ? colors.accent : colors.textSecondary} style={styles.weekFill} />
                  </View>
                  <ThemedText variant="caption2" color={index === 6 ? 'primary' : 'tertiary'}>
                    {day.toLocaleDateString('en-US', { weekday: 'narrow' }).toLowerCase()}
                  </ThemedText>
                </View>
              ))}
            </View>
            <ThemedText variant="caption1" color="tertiary">
              calories logged each day. the tallest a bar can be is your {formatNumber(settings.calorieGoal)} kcal goal, or your biggest day.
            </ThemedText>
          </Card>
        </Stagger>
      </View>
    </ScrollView>
  );
}

const WEEK_HEIGHT = 132;

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing['5xl'] },
  headline: { alignItems: 'center', paddingTop: Spacing.lg, gap: Spacing.xs },
  track: { width: 200, height: 4, borderRadius: Radii.full, overflow: 'hidden', marginTop: Spacing.md },
  fill: { height: '100%', borderRadius: Radii.full },
  body: { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingTop: Spacing.lg },
  card: { gap: Spacing.md },
  balance: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  balanceWords: { flex: 1, gap: Spacing.xs },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs },
  meals: { gap: Spacing.md },
  mealRow: { gap: Spacing.xs + 2 },
  mealHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: Spacing.md },
  barTrack: { height: 4, borderRadius: Radii.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radii.full },
  week: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm, height: WEEK_HEIGHT, overflow: 'hidden' },
  weekDay: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  weekTrack: { flex: 1, width: 6, justifyContent: 'flex-end' },
  weekFill: { width: '100%', borderRadius: Radii.full },
  tabular: { fontVariant: ['tabular-nums'] },
});
