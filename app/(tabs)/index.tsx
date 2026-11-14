import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { CaloriesLeft } from '@/components/home/CaloriesLeft';
import { MacroRings } from '@/components/home/MacroRings';
import { MealCard } from '@/components/home/MealCard';
import { WeekStrip } from '@/components/home/WeekStrip';
import { GradientHeader } from '@/components/layout/GradientHeader';
import { AppIcon } from '@/components/ui/AppIcon';
import { Tap } from '@/components/ui/Tap';
import { ThemedText } from '@/components/ui/ThemedText';
import { PRIVACY_LINE } from '@/constants/brand';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useLog } from '@/hooks/useLog';
import { streakSummary } from '@/lib/log/streak';
import { useSettings } from '@/hooks/useSettings';
import { formatRelativeDay, getGreeting, isSameDay } from '@/utils/date';

/** The entrance plays once per launch, not every time Home comes back into view. */
let homeShown = false;

function initialFor(name: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || 'JT';
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { now, today } = useCurrentTime();
  const [picked, setPicked] = useState<Date | null>(null);
  const [firstShow] = useState(() => !homeShown);
  useEffect(() => {
    homeShown = true;
  }, []);
  // Follow the calendar: once a new day starts, the picked day falls back to today.
  const day = picked && picked <= today ? picked : today;
  const isToday = isSameDay(day, today);
  const { sections, totals, all } = useLog(day);
  const streak = streakSummary(all, today);
  const settings = useSettings();

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="never">
      <GradientHeader fadeEnd={0.92}>
        <View style={styles.topRow}>
          <View style={styles.greeting}>
            <ThemedText variant="overline" style={{ color: colors.onGradientMuted }}>
              {(isToday ? `${getGreeting(now)}${settings.displayName ? `, ${settings.displayName.split(' ')[0]}` : ''}` : formatRelativeDay(day, today)).toUpperCase()}
            </ThemedText>
            <ThemedText variant="title2" style={{ color: colors.onGradient }} accessibilityRole="header">
              {isToday ? 'Stay on track today' : day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </ThemedText>
          </View>
          {streak.current > 0 ? (
            <Tap
              onPress={() => router.push('/stats')}
              pressScale={0.94}
              accessibilityRole="button"
              accessibilityLabel={`${streak.current} day streak${streak.waiting ? ', log today to keep it' : ''}`}
              style={[styles.streak, { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.22)', opacity: streak.waiting ? 0.7 : 1 }]}
            >
              <AppIcon name="flame" size={14} color={streak.waiting ? colors.onGradientMuted : colors.carbs} />
              <ThemedText variant="subheadEmphasized" style={[styles.streakCount, { color: colors.onGradient }]}>
                {streak.current}
              </ThemedText>
            </Tap>
          ) : null}
          <Tap onPress={() => router.push('/profile')} pressScale={0.9} accessibilityRole="button" accessibilityLabel={settings.displayName ? `${settings.displayName}, profile` : 'Profile'} style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.22)', borderWidth: StyleSheet.hairlineWidth * 2 }]}>
            <ThemedText variant="subheadEmphasized" style={{ color: colors.onGradient }}>
              {initialFor(settings.displayName)}
            </ThemedText>
          </Tap>
        </View>
        <WeekStrip today={today} selected={day} onSelect={setPicked} />
        <Animated.View key={day.toDateString()} entering={firstShow ? FadeIn.duration(350) : undefined}>
          <CaloriesLeft eaten={totals.calories} goal={settings.calorieGoal} />
          <View style={styles.rings}>
            <MacroRings totals={totals} goals={settings.macroGoals} />
          </View>
        </Animated.View>
      </GradientHeader>

      <View style={styles.body}>
        <View style={styles.sectionHeader}>
          <ThemedText variant="title3" accessibilityRole="header">
            Daily meals
          </ThemedText>
          {!isToday ? (
            <Tap onPress={() => setPicked(null)} accessibilityRole="button" hitSlop={8} style={[styles.todayChip, { backgroundColor: colors.surfaceTint }]}>
              <ThemedText variant="footnote" style={{ color: colors.accent, fontWeight: '600' }}>
                Back to today
              </ThemedText>
            </Tap>
          ) : null}
        </View>

        <View style={styles.cards}>
          {sections.map((section, index) => (
            <Animated.View key={`${section.mealType}-${day.toDateString()}`} entering={firstShow ? FadeInDown.delay(80 + index * 70).duration(420) : undefined}>
              <MealCard section={section} onAdd={() => router.push({ pathname: '/food/search', params: { mealType: section.mealType } })} />
            </Animated.View>
          ))}
        </View>

        <ThemedText variant="caption1" color="tertiary" style={styles.footnote}>
          {PRIVACY_LINE}
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing['5xl'] },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  greeting: { flex: 1, gap: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingHorizontal: Spacing.md, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth * 2 },
  streakCount: { fontVariant: ['tabular-nums'], fontWeight: '700' },
  rings: { paddingBottom: Spacing.lg },
  body: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  cards: { gap: Spacing.md },
  todayChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: 999 },
  footnote: { textAlign: 'center', marginTop: Spacing['2xl'], paddingHorizontal: Spacing.lg },
});
