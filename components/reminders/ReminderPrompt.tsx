import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { NotificationPreview } from '@/components/reminders/NotificationPreview';
import { PressScale } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/Sheet';
import { ThemedText } from '@/components/ui/ThemedText';
import { Haptic } from '@/constants/motion';
import { MIN_TAP, Spacing } from '@/constants/theme';
import { useReminderSamples } from '@/hooks/useReminderSamples';
import { useSettings } from '@/hooks/useSettings';
import { remindersSupported } from '@/lib/reminders/notifier';
import { turnOnReminders } from '@/lib/reminders/sync';
import { updateReminders } from '@/lib/settings/settingsStore';

/** "Not now" holds until the app is next launched; then it asks again. */
let snoozedThisLaunch = false;

/** How long Home gets to itself before the question slides up. */
const DELAY_MS = 2400;

/**
 * Asks whether to send reminders, each time the app opens, until the user
 * answers yes or "don't ask again". Sits over the tabs, so it never
 * interrupts a food being added.
 */
export function ReminderPrompt() {
  const { reminders, displayName } = useSettings();
  const { sample } = useReminderSamples(displayName);
  const wanted = remindersSupported && !reminders.enabled && !reminders.asked;
  const [visible, setVisible] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!wanted || snoozedThisLaunch) return;
    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [wanted]);

  const notNow = () => {
    snoozedThisLaunch = true;
    setVisible(false);
  };

  const accept = async () => {
    setWorking(true);
    Haptic.success();
    await turnOnReminders();
    setWorking(false);
    setVisible(false);
  };

  const firstName = displayName?.trim().split(/\s+/)[0];

  return (
    <BottomSheet visible={visible && wanted} inline onClose={notNow} title={firstName ? `${firstName}, want a nudge?` : 'Want a nudge?'} tagline="so no snack goes unlogged">
      <ThemedText variant="subhead" color="secondary" style={styles.center}>
        We’ll poke you every hour and a half. Jokes included, guilt not. Prefer just breakfast, lunch and dinner? Change it in Profile.
      </ThemedText>
      <View style={styles.preview}>
        <NotificationPreview title={sample.title} body={sample.body} />
      </View>
      <Button label="Yes, nag me" onPress={() => void accept()} loading={working} haptic={null} />
      <Button label="Not now" variant="secondary" onPress={notNow} disabled={working} />
      <PressScale
        onPress={() => {
          updateReminders({ asked: true });
          setVisible(false);
        }}
        haptic="select"
        accessibilityRole="button"
        disabled={working}
        style={styles.never}
      >
        <ThemedText variant="footnote" color="tertiary">
          don’t ask again
        </ThemedText>
      </PressScale>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  preview: { marginVertical: Spacing.xs },
  never: { alignSelf: 'center', minHeight: MIN_TAP, justifyContent: 'center', paddingHorizontal: Spacing.lg },
});
