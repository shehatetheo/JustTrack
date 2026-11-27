import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { CaloriesLeft } from '@/components/home/CaloriesLeft';
import { FillCard } from '@/components/home/FillCard';
import { MacroRings } from '@/components/home/MacroRings';
import { MealCard } from '@/components/home/MealCard';
import { WeekStrip } from '@/components/home/WeekStrip';
import { discover } from '@/components/easterEggs/found';
import { InkPull } from '@/components/easterEggs/InkPull';
import { NightOwl, OwlFlight } from '@/components/easterEggs/NightOwl';
import { Seasonal } from '@/components/easterEggs/Seasonal';
import { FastCard } from '@/components/fast/FastCard';
import { Hero } from '@/components/layout/Hero';
import { InkReveal, PressScale, Stagger } from '@/components/motion';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Heading } from '@/components/ui/Heading';
import { ThemedText } from '@/components/ui/ThemedText';
import { PRIVACY_LINE } from '@/constants/brand';
import { HAIRLINE, MIN_TAP, Radii, Spacing } from '@/constants/theme';
import { useAddSheet } from '@/hooks/useAddSheet';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useLog } from '@/hooks/useLog';
import { useSettings } from '@/hooks/useSettings';
import { EASTER_EGGS_ENABLED, HIDDEN_LINE, seasonFor } from '@/lib/easterEggs/eggs';
import { streakSummary } from '@/lib/log/streak';
import { formatRelativeDay, getGreeting, isSameDay } from '@/utils/date';

/** The cards rise in once per launch, not every time Home comes back into view. */
let homeShown = false;

function initialFor(name: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || 'J';
}

export default function HomeScreen() {
  const router = useRouter();
  const addFood = useAddSheet();
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
  const firstName = settings.displayName?.split(' ')[0];
  const plate = { backgroundColor: colors.photoPlate, borderColor: colors.border };
  // How far Home has been pulled down past its top, for the ink drop that hangs there.
  const pull = useSharedValue(0);
  const season = seasonFor(today);
  useEffect(() => {
    if (season) discover('seasonal');
  }, [season]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="never"
      scrollEventThrottle={16}
      onScroll={(event) => {
        const y = event.nativeEvent.contentOffset.y;
        pull.set(y < 0 ? -y : 0);
        // Pulled down well past the top: the line hidden up there has been seen.
        if (EASTER_EGGS_ENABLED && y < -70) discover('tagline');
      }}
    >
      <InkPull pull={pull} />
      {EASTER_EGGS_ENABLED ? (
        <View pointerEvents="none" style={styles.hidden} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <ThemedText variant="tagline" color="secondary" style={styles.hiddenLine}>
            {HIDDEN_LINE}
          </ThemedText>
        </View>
      ) : null}
      <Hero page="home">
        {season ? <Seasonal season={season} /> : null}
        <OwlFlight />
        <View style={styles.topRow}>
          <View style={styles.greeting}>
            <View style={styles.greetingRow}>
              <ThemedText variant="overline" style={{ color: colors.onHeroMuted }}>
                {(isToday ? `${getGreeting(now)}${firstName ? `, ${firstName}` : ''}` : formatRelativeDay(day, today)).toUpperCase()}
              </ThemedText>
              <NightOwl />
            </View>
            <ThemedText variant="title2" style={{ color: colors.onHero }} accessibilityRole="header">
              {isToday ? 'today' : day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toLowerCase()}
            </ThemedText>
          </View>
          {streak.current > 0 ? (
            <PressScale onPress={() => router.push('/stats')} haptic="select" accessibilityRole="button" accessibilityLabel={`${streak.current} day streak${streak.waiting ? ', log today to keep it' : ''}`} style={[styles.streak, plate, { opacity: streak.waiting ? 0.7 : 1 }]}>
              <AppIcon name="flame" size={14} color={colors.accent} />
              <ThemedText variant="subheadEmphasized" style={[styles.tabular, { color: colors.onHero }]}>
                {streak.current}
              </ThemedText>
            </PressScale>
          ) : null}
          <PressScale onPress={() => router.push('/profile')} haptic="select" accessibilityRole="button" accessibilityLabel={settings.displayName ? `${settings.displayName}, profile` : 'Profile'} style={[styles.avatar, plate]}>
            <ThemedText variant="subheadEmphasized" style={{ color: colors.onHero }}>
              {initialFor(settings.displayName)}
            </ThemedText>
          </PressScale>
        </View>
        <WeekStrip today={today} selected={day} onSelect={setPicked} />
        <InkReveal key={day.toDateString()}>
          <CaloriesLeft eaten={totals.calories} goal={settings.calorieGoal} />
          <MacroRings totals={totals} goals={settings.macroGoals} />
        </InkReveal>
      </Hero>

      <View style={styles.body}>
        <FastCard />
        {isToday ? <FillCard eaten={totals} calorieGoal={settings.calorieGoal} macroGoals={settings.macroGoals} now={now} /> : null}
        <Heading
          title="daily meals"
          tagline="what was eaten, written down"
          accessory={!isToday ? <Button label="back to today" variant="secondary" size="md" fullWidth={false} onPress={() => setPicked(null)} /> : undefined}
        />
        <View style={styles.cards}>
          {sections.map((section, index) =>
            firstShow ? (
              <Stagger key={`${section.mealType}-${day.toDateString()}`} index={index} delay={120}>
                <MealCard section={section} onAdd={() => addFood(section.mealType)} />
              </Stagger>
            ) : (
              <MealCard key={`${section.mealType}-${day.toDateString()}`} section={section} onAdd={() => addFood(section.mealType)} />
            )
          )}
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
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  greeting: { flex: 1, gap: Spacing.xxs },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, height: 16 },
  // Sits above the top of the page, where only a pull past the edge can reach it.
  hidden: { position: 'absolute', top: -96, left: 0, right: 0, alignItems: 'center', zIndex: 1 },
  hiddenLine: { textAlign: 'center' },
  avatar: { width: MIN_TAP, height: MIN_TAP, borderRadius: Radii.full, borderWidth: HAIRLINE, alignItems: 'center', justifyContent: 'center' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, height: 36, paddingHorizontal: Spacing.md, borderRadius: Radii.full, borderWidth: HAIRLINE },
  tabular: { fontVariant: ['tabular-nums'] },
  body: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, gap: Spacing.lg },
  cards: { gap: Spacing.md },
  footnote: { textAlign: 'center', marginTop: Spacing.lg, paddingHorizontal: Spacing.lg },
});
