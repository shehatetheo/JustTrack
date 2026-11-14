import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotificationPreview } from '@/components/reminders/NotificationPreview';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
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
  const { colors, shadows } = useAppTheme();
  const insets = useSafeAreaInsets();
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

  if (!visible || !wanted) return null;

  const notNow = () => {
    snoozedThisLaunch = true;
    setVisible(false);
  };

  const accept = async () => {
    setWorking(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await turnOnReminders();
    setWorking(false);
    setVisible(false);
  };

  const firstName = displayName?.trim().split(/\s+/)[0];

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)} style={[StyleSheet.absoluteFill, styles.backdrop]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={notNow} accessibilityRole="button" accessibilityLabel="Not now" />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.springify().damping(20).stiffness(190)}
        exiting={SlideOutDown.duration(220)}
        style={[styles.sheet, shadows.lg, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + Spacing.lg }]}
      >
        <View style={[styles.grabber, { backgroundColor: colors.border }]} />
        <ThemedText variant="overline" color="tertiary" style={styles.center}>
          REMINDERS
        </ThemedText>
        <ThemedText variant="title2" style={styles.center} accessibilityRole="header">
          {firstName ? `${firstName}, want us to nag you?` : 'Want us to nag you?'}
        </ThemedText>
        <ThemedText variant="subhead" color="secondary" style={styles.center}>
          We’ll poke you every hour and a half so no snack goes unlogged. Jokes included, guilt not. Prefer just breakfast, lunch and dinner? Change it in Profile.
        </ThemedText>
        <View style={styles.preview}>
          <NotificationPreview title={sample.title} body={sample.body} />
        </View>
        <Button label="Yes, nag me" onPress={() => void accept()} loading={working} />
        <Button label="Not now" variant="secondary" onPress={notNow} disabled={working} />
        <Pressable
          onPress={() => {
            updateReminders({ asked: true });
            setVisible(false);
          }}
          accessibilityRole="button"
          hitSlop={8}
          disabled={working}
          style={styles.never}
        >
          <ThemedText variant="footnote" color="tertiary">
            Don’t ask again
          </ThemedText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: Radii['2xl'], borderTopRightRadius: Radii['2xl'], borderWidth: StyleSheet.hairlineWidth * 2, borderBottomWidth: 0, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.md },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: Spacing.xs },
  center: { textAlign: 'center' },
  preview: { marginVertical: Spacing.xs },
  never: { alignSelf: 'center', paddingVertical: Spacing.xs },
});
