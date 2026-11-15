import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { SheetFrame } from '@/components/layout/SheetFrame';
import { SheetHeader } from '@/components/layout/SheetHeader';
import { InkReveal, Stagger } from '@/components/motion';
import { NotificationPreview } from '@/components/reminders/NotificationPreview';
import { AppIcon } from '@/components/ui/AppIcon';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Glass } from '@/components/ui/Glass';
import { ListRow, ListSection } from '@/components/ui/ListRow';
import { ThemedText } from '@/components/ui/ThemedText';
import { Toggle } from '@/components/ui/Toggle';
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
  return (
    <SheetFrame>
      <Reminders />
    </SheetFrame>
  );
}

function Reminders() {
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
    if (!on) {
      updateReminders({ enabled: false, asked: true });
      return;
    }
    setPermission(await turnOnReminders());
  };

  const pickMode = (mode: ReminderMode) => updateReminders({ mode });

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
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SheetHeader title="Reminders" tagline="a nudge, never a lecture" onClose={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
      <InkReveal>
        <Glass radius={Radii.xl} lit style={styles.stage}>
          <ThemedText variant="overline" color="tertiary">
            WHAT THEY LOOK LIKE
          </ThemedText>
          <NotificationPreview title={sample.title} body={sample.body} />
          <Button label="Show me another" variant="secondary" size="md" fullWidth={false} haptic="select" onPress={next} accessibilityLabel="Show another reminder" />
          <ThemedText variant="caption1" color="tertiary" style={styles.stageFoot}>
            {REMINDER_MESSAGES.length} different lines, shuffled so they don’t repeat back to back.
          </ThemedText>
        </Glass>
      </InkReveal>

      {!remindersSupported ? <Banner message="Reminders work in the iPhone app. A browser can’t schedule them for later." /> : null}
      {blocked ? <Banner tone="warning" icon="bell" message="Notifications are switched off for JustTrack in Settings, so nothing can arrive." actionLabel="Open Settings" onAction={openSystemSettings} /> : null}

      <ListSection footer={reminders.enabled ? summary : 'Off. Flip it on and we’ll poke you to log your food. Jokes included.'}>
        <ListRow
          icon="bell"
         
          title="Meal reminders"
          showChevron={false}
          isLast
          accessory={
            <Toggle value={reminders.enabled} onValueChange={(on) => void toggle(on)} disabled={!remindersSupported} accessibilityLabel="Meal reminders" />
          }
        />
      </ListSection>

      {reminders.enabled ? (
        <Stagger>
          <ListSection title="How often">
            <ListRow
              icon="clock"
             
              title="Every 1.5 hours"
              showChevron={false}
              onPress={() => pickMode('interval')}
              accessory={reminders.mode === 'interval' ? <AppIcon name="check" size={16} color={colors.accentText} weight="semibold" /> : undefined}
            />
            <ListRow
              icon="dinner"
             
              title="Just mealtimes"
              showChevron={false}
              onPress={() => pickMode('meals')}
              isLast
              accessory={reminders.mode === 'meals' ? <AppIcon name="check" size={16} color={colors.accentText} weight="semibold" /> : undefined}
            />
          </ListSection>

          {reminders.mode === 'interval' ? (
            <InkReveal key="interval">
              <ListSection footer={`Then one every hour and a half. The last one is at or before ${formatMinute(LAST_MINUTE_OF_DAY)}, and a nudge is skipped if you just logged something.`}>
                <ListRow
                  icon="breakfast"
                 
                  title="First reminder"
                  value={formatMinute(reminders.startHour * 60)}
                  onPress={() => showOptionSheet({ title: 'First reminder of the day', options: START_OPTIONS, selected: String(reminders.startHour), onSelect: (hour) => updateReminders({ startHour: Number(hour) }) })}
                  isLast
                />
              </ListSection>
            </InkReveal>
          ) : (
            <InkReveal key="meals">
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
                      <Toggle value={reminders.meals[meal]} onValueChange={(on) => updateReminders({ meals: { ...reminders.meals, [meal]: on } })} accessibilityLabel={`${MEAL_LABELS[meal].title} reminder`} />
                    }
                  />
                ))}
              </ListSection>
            </InkReveal>
          )}

          {remindersSupported && permission === 'granted' ? (
            <View style={styles.test}>
              <Button label={testSent ? 'On its way…' : 'Send me a test'} variant="secondary" onPress={() => void sendTest()} disabled={testSent} />
            </View>
          ) : null}
        </Stagger>
      ) : null}

      <ThemedText variant="footnote" color="tertiary" style={styles.privacy}>
        Reminders are scheduled on your phone. Nothing is sent to or from a server, and you can switch them off here any time.
      </ThemedText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing['5xl'], gap: Spacing.md },
  stage: { padding: Spacing.lg, gap: Spacing.md, alignItems: 'stretch' },
  stageFoot: { textAlign: 'center' },
  test: { marginTop: Spacing['2xl'] },
  privacy: { textAlign: 'center', marginTop: Spacing.lg, paddingHorizontal: Spacing.lg },
});
