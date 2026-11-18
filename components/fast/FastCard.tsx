import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PressScale } from '@/components/motion';
import { AppIcon } from '@/components/ui/AppIcon';
import { Glass } from '@/components/ui/Glass';
import { GrowBar } from '@/components/ui/GrowBar';
import { Stamp } from '@/components/ui/Stamp';
import { ThemedText } from '@/components/ui/ThemedText';
import { HAIRLINE, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useFast } from '@/hooks/useFast';
import { fastDates, fastRuleText, type FastDayState, type FastProgress } from '@/lib/fast/plan';
import type { FastPlan } from '@/types';

/** Up to this many days, each day gets its own plate; a longer fast is shown as one bar. */
const MAX_PLATES = 40;

const shortDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function line(plan: FastPlan, progress: FastProgress): string {
  const { start, end } = fastDates(plan);
  if (progress.phase === 'upcoming') return `starts ${shortDate(start)}. nothing to do until then.`;
  if (progress.phase === 'done') return `${plan.days} days, done. ${progress.kept} of them logged clean.`;
  const today = progress.states[progress.dayNumber - 1];
  const left = progress.daysLeft === 0 ? 'last day' : `${progress.daysLeft} ${progress.daysLeft === 1 ? 'day' : 'days'} left`;
  // Calm either way: a day that went off the fast is a day, not a failure.
  if (today === 'off') return `${left}. something today wasn’t in the fast; tomorrow is a new day.`;
  return `${left} · ends ${shortDate(end)}`;
}

function Plates({ states, today }: { states: FastDayState[]; today: number }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.plates}>
      {states.map((state, index) => {
        const isToday = index === today - 1;
        return (
          <View
            key={index}
            style={[
              styles.plate,
              state === 'kept' && { backgroundColor: colors.accent, borderColor: colors.accent },
              // Off the fast is drawn as an open plate with a mark in it, in the same ink as everything else.
              state === 'off' && { borderColor: colors.textSecondary },
              // A day with nothing logged can't be read either way, so it stays an empty plate with a firmer edge.
              state === 'quiet' && { borderColor: colors.textTertiary },
              state === 'ahead' && { borderColor: colors.border },
              isToday && state !== 'kept' && { borderColor: colors.text },
            ]}
          >
            {state === 'off' ? <View style={[styles.mark, { backgroundColor: colors.textSecondary }]} /> : null}
          </View>
        );
      })}
    </View>
  );
}

/**
 * The fast on Home: which day it is, what is being set aside, and a plate
 * for every day (filled when the day's log stayed inside the fast). Tapping
 * it opens the fast's settings. Shows nothing when there is no fast.
 */
export function FastCard() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { plan, progress } = useFast();
  if (!plan || !progress) return null;

  const rule = fastRuleText(plan);
  const heading = progress.phase === 'upcoming' ? `FAST · ${plan.days} DAYS` : progress.phase === 'done' ? 'FAST · COMPLETE' : `FAST · DAY ${progress.dayNumber} OF ${plan.days}`;
  const spoken = `Fast, ${rule}. ${progress.phase === 'active' ? `Day ${progress.dayNumber} of ${plan.days}. ` : ''}${line(plan, progress)} Opens the fast’s settings.`;

  return (
    <PressScale onPress={() => router.push('/settings/fast')} pressScale={0.985} haptic="select" accessibilityRole="button" accessibilityLabel={spoken}>
      <Glass radius={Radii.xl} lit style={styles.card}>
        <View style={styles.top}>
          <View style={styles.words}>
            <ThemedText variant="overline" color="tertiary">
              {heading}
            </ThemedText>
            <ThemedText variant="title3" numberOfLines={2}>
              {rule}
            </ThemedText>
          </View>
          {progress.phase === 'upcoming' ? (
            <AppIcon name="chevronRight" size={14} color={colors.textTertiary} weight="semibold" />
          ) : (
            <Stamp label={progress.phase === 'done' ? 'kept' : `day ${progress.dayNumber}`} caption={progress.phase === 'done' ? `${plan.days} days` : `of ${plan.days}`} size={58} accent thump={progress.dayNumber} seed={plan.days + 1} tilt={7} accessibilityLabel="" />
          )}
        </View>
        {plan.days <= MAX_PLATES ? (
          <Plates states={progress.states} today={progress.phase === 'active' ? progress.dayNumber : 0} />
        ) : (
          <View style={[styles.track, { backgroundColor: colors.track }]}>
            <GrowBar fraction={progress.dayNumber / plan.days} style={styles.bar} />
          </View>
        )}
        <ThemedText variant="footnote" color="secondary">
          {line(plan, progress)}
        </ThemedText>
      </Glass>
    </PressScale>
  );
}

const PLATE = 12;

const styles = StyleSheet.create({
  card: { padding: Spacing.lg, gap: Spacing.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  words: { flex: 1, gap: Spacing.xxs },
  plates: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs + 2 },
  plate: { width: PLATE, height: PLATE, borderRadius: Radii.full, borderWidth: HAIRLINE, alignItems: 'center', justifyContent: 'center' },
  mark: { width: PLATE - 6, height: HAIRLINE },
  track: { height: 4, borderRadius: Radii.full, overflow: 'hidden' },
  bar: { height: 4, borderRadius: Radii.full },
});
