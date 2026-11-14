import { Alert } from 'react-native';

import { loggedOn } from '@/lib/log/day';
import { logStore } from '@/lib/log/logStore';
import { getReminderPermission, openSystemSettings, remindersSupported, requestReminderPermission, scheduleReminders, type ReminderPermission } from '@/lib/reminders/notifier';
import { planReminders, REMINDER_MEALS } from '@/lib/reminders/plan';
import { settingsStore, updateReminders } from '@/lib/settings/settingsStore';
import type { ReminderMeal } from '@/types';

/**
 * Rebuilds the queue of reminders from what's on the device right now: the
 * settings, and today's log (so a meal that's already logged isn't nagged
 * about). Safe to call as often as needed; each call replaces the last.
 */
export async function syncReminders(now: Date = new Date()): Promise<void> {
  if (!remindersSupported) return;
  const { reminders, displayName } = settingsStore.getSnapshot();
  if (!reminders.enabled || (await getReminderPermission()) !== 'granted') {
    await scheduleReminders([]);
    return;
  }
  const today = logStore.getSnapshot().filter((entry) => loggedOn(entry, now));
  const loggedMealsToday = REMINDER_MEALS.filter((meal: ReminderMeal) => today.some((entry) => entry.mealType === meal));
  const lastLogged = today.reduce((latest, entry) => Math.max(latest, new Date(entry.loggedAt).getTime()), 0);
  await scheduleReminders(planReminders({ now, reminders, displayName, loggedMealsToday, lastLoggedAt: lastLogged > 0 ? new Date(lastLogged) : null, seed: now.getTime() }));
}

/** Asks the system for permission and, if it's given, switches reminders on. Either way the launch prompt stops asking. */
export async function turnOnReminders(): Promise<ReminderPermission> {
  const permission = await requestReminderPermission();
  updateReminders(permission === 'granted' ? { enabled: true, asked: true } : { asked: true });
  if (permission !== 'granted') {
    Alert.alert('Notifications are off', 'JustTrack isn’t allowed to send notifications yet. Switch them on in Settings and reminders will start.', [
      { text: 'Not now', style: 'cancel' },
      { text: 'Open Settings', onPress: openSystemSettings },
    ]);
  }
  return permission;
}
