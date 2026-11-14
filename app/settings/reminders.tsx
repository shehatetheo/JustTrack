import * as Haptics from 'expo-haptics';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { NotificationPreview } from '@/components/reminders/NotificationPreview';
import { AppIcon } from '@/components/ui/AppIcon';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { CloseButton } from '@/components/ui/CloseButton';
import { ListRow, ListSection } from '@/components/ui/ListRow';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useReminderSamples } from '@/hooks/useReminderSamples';
import { useSettings } from '@/hooks/useSettings';
import { REMINDER_MESSAGES } from '@/lib/reminders/messages';
import { getReminderPermission, openSystemSettings, remindersSupported, sendTestReminder, type ReminderPermission } from '@/lib/reminders/notifier';
import { formatMinute, LAST_MINUTE_OF_DAY, MEAL_MINUTES, REMINDER_MEALS, reminderMinutes } from '@/lib/reminders/plan';
import { turnOnReminders } from '@/lib/reminders/sync';
import { REMINDER_START_HOURS, updateReminders } from '@/lib/settings/settingsStore';
import type { ReminderMeal, ReminderMode } from '@/types';
import { showOptionSheet } from '@/utils/actionSheet';

const MEAL_LABELS: Record<ReminderMeal, { title: string; icon: 'breakfast' | 'lunch' | 'dinner' }> = {
  breakfast: { title: 'Breakfast', icon: 'breakfast' },
  lunch: { title: 'Lunch', icon: 'lunch' },
  dinner: { title: 'Dinner', icon: 'dinner' },
};

const START_OPTIONS = REMINDER_START_HOURS.map((hour) => ({ value: String(hour), label: formatMinute(hour * 60) }));

/** Reminders: on or off, every 90 minutes or just at mealtimes, with a peek at what they say. */
export default function RemindersScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { reminders, displayName } = useSettings();
  const { sample, next } = useReminderSamples(displayName);
  const [permission, setPermission] = useState<ReminderPermission>('undetermined');
  const [testSent, setTestSent] = useState(false);

  // Re-read the permission on every return, including from the system Settings app.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void getReminderPermission().then((value) => {
        if (!cancelled) setPermission(value);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const blocked = remindersSupported && reminders.enabled && permission === 'denied';
  const times = reminderMinutes(reminders);

  const toggle = async (on: boolean) => {
    Haptics.selectionAsync();
    if (!on) {
      updateReminders({ enabled: false, asked: true });
      return;
    }
    setPermission(await turnOnReminders());
  };

  const pickMode = (mode: ReminderMode) => {
    Haptics.selectionAsync();
    updateReminders({ mode });
  };

  const sendTest = async () => {
    await sendTestReminder(sample);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 4000);
  };

  const summary =
    reminders.mode === 'interval'
      ? `${times.length} nudges a day, from ${formatMinute(times[0])} to ${formatMinute(times[times.length - 1])}.`
      : times.length > 0
        ? `${times.length} ${times.length === 1 ? 'nudge' : 'nudges'} a day, at the meals you pick.`
        : 'Every meal is switched off, so nothing will be sent.';

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerRight: () => <CloseButton onPress={() => router.back()} />, headerTitleAlign: 'center' }} />

      <View style={[styles.stage, { backgroundColor: colors.surfaceTint, borderColor: colors.border }]}>
        <ThemedText variant="overline" color="tertiary">
          WHAT THEY LOOK LIKE
        </ThemedText>
        <NotificationPreview title={sample.title} body={sample.body} />
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            next();
          }}
          accessibilityRole="button"
          accessibilityLabel="Show another reminder"
          hitSlop={8}
          style={({ pressed }) => [styles.shuffle, { backgroundColor: colors.surfaceTintStrong, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
        >
          <ThemedText variant="footnote" style={{ color: colors.text, fontWeight: '700' }}>
            Show me another
          </ThemedText>
        </Pressable>
        <ThemedText variant="caption1" color="tertiary" style={styles.stageFoot}>
          {REMINDER_MESSAGES.length} different lines, shuffled so they don’t repeat back to back.
        </ThemedText>
      </View>

      {!remindersSupported ? <Banner message="Reminders work in the iPhone app. A browser can’t schedule them for later." /> : null}
      {blocked ? <Banner tone="warning" icon="bell" message="Notifications are switched off for JustTrack in Settings, so nothing can arrive." actionLabel="Open Settings" onAction={openSystemSettings} /> : null}

      <ListSection footer={reminders.enabled ? summary : 'Off. Flip it on and we’ll poke you to log your food. Jokes included.'}>
        <ListRow
          icon="bell"
         
          title="Meal reminders"
          showChevron={false}
          isLast
          accessory={
            <Switch
              value={reminders.enabled}
              onValueChange={(on) => void toggle(on)}
              disabled={!remindersSupported}
              trackColor={{ true: colors.accent, false: colors.border }}
              accessibilityLabel="Meal reminders"
            />
          }
        />
      </ListSection>

      {reminders.enabled ? (
        <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(150)} layout={LinearTransition.duration(220)}>
          <ListSection title="How often">
            <ListRow
              icon="clock"
             
              title="Every 1.5 hours"
              showChevron={false}
              onPress={() => pickMode('interval')}
              accessory={reminders.mode === 'interval' ? <AppIcon name="check" size={16} color={colors.accent} weight="semibold" /> : undefined}
            />
            <ListRow
              icon="dinner"
             
              title="Just mealtimes"
              showChevron={false}
              onPress={() => pickMode('meals')}
              isLast
              accessory={reminders.mode === 'meals' ? <AppIcon name="check" size={16} color={colors.accent} weight="semibold" /> : undefined}
            />
          </ListSection>

          {reminders.mode === 'interval' ? (
            <Animated.View key="interval" entering={FadeIn.duration(220)}>
              <ListSection footer={`Then one every hour and a half. The last one is at or before ${formatMinute(LAST_MINUTE_OF_DAY)}, and a nudge is skipped if you just logged something.`}>
                <ListRow
                  icon="breakfast"
                 
                  title="First reminder"
                  value={formatMinute(reminders.startHour * 60)}
                  onPress={() => showOptionSheet({ title: 'First reminder of the day', options: START_OPTIONS, selected: String(reminders.startHour), onSelect: (hour) => updateReminders({ startHour: Number(hour) }) })}
                  isLast
                />
              </ListSection>
            </Animated.View>
          ) : (
            <Animated.View key="meals" entering={FadeIn.duration(220)}>
              <ListSection footer="A meal you’ve already logged that day doesn’t get a reminder.">
                {REMINDER_MEALS.map((meal, index) => (
                  <ListRow
                    key={meal}
                    icon={MEAL_LABELS[meal].icon}
                   
                    title={MEAL_LABELS[meal].title}
                    value={formatMinute(MEAL_MINUTES[meal])}
                    showChevron={false}
                    isLast={index === REMINDER_MEALS.length - 1}
                    accessory={
                      <Switch
                        value={reminders.meals[meal]}
                        onValueChange={(on) => {
                          Haptics.selectionAsync();
                          updateReminders({ meals: { ...reminders.meals, [meal]: on } });
                        }}
                        trackColor={{ true: colors.accent, false: colors.border }}
                        accessibilityLabel={`${MEAL_LABELS[meal].title} reminder`}
                      />
                    }
                  />
                ))}
              </ListSection>
            </Animated.View>
          )}

          {remindersSupported && permission === 'granted' ? (
            <View style={styles.test}>
              <Button label={testSent ? 'On its way…' : 'Send me a test'} variant="secondary" onPress={() => void sendTest()} disabled={testSent} />
            </View>
          ) : null}
        </Animated.View>
      ) : null}

      <ThemedText variant="footnote" color="tertiary" style={styles.privacy}>
        Reminders are scheduled on your phone. Nothing is sent to or from a server, and you can switch them off here any time.
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, paddingBottom: Spacing['5xl'], gap: Spacing.md },
  stage: { borderRadius: Radii.xl, borderWidth: StyleSheet.hairlineWidth * 2, padding: Spacing.lg, gap: Spacing.md },
  shuffle: { alignSelf: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radii.md, borderWidth: StyleSheet.hairlineWidth * 2 },
  stageFoot: { textAlign: 'center' },
  test: { marginTop: Spacing['2xl'] },
  privacy: { textAlign: 'center', marginTop: Spacing.lg, paddingHorizontal: Spacing.lg },
});
