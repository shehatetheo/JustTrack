import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import type { PlannedReminder } from '@/lib/reminders/plan';

/**
 * The native side of reminders: asks for permission and hands the planned
 * list to the phone's own scheduler. Everything is a local notification, so
 * nothing is sent to or from a server. The web build gets notifier.web.ts,
 * which does nothing.
 */

export const remindersSupported = true;

export type ReminderPermission = 'granted' | 'denied' | 'undetermined';

const CHANNEL_ID = 'meal-reminders';
/** Where tapping a reminder lands. */
export const REMINDER_URL = '/food/search';

// Show reminders that arrive while the app is open too (this is also what makes "Send a test" visible).
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

function permissionFrom(status: Notifications.NotificationPermissionsStatus): ReminderPermission {
  const ios = status.ios?.status;
  if (ios === Notifications.IosAuthorizationStatus.AUTHORIZED || ios === Notifications.IosAuthorizationStatus.PROVISIONAL || ios === Notifications.IosAuthorizationStatus.EPHEMERAL) return 'granted';
  if (ios === Notifications.IosAuthorizationStatus.DENIED) return 'denied';
  if (status.granted) return 'granted';
  return status.canAskAgain ? 'undetermined' : 'denied';
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, { name: 'Meal reminders', importance: Notifications.AndroidImportance.DEFAULT });
}

export async function getReminderPermission(): Promise<ReminderPermission> {
  try {
    return permissionFrom(await Notifications.getPermissionsAsync());
  } catch {
    return 'undetermined';
  }
}

/** Shows the system prompt the first time; afterwards it just reports the answer. */
export async function requestReminderPermission(): Promise<ReminderPermission> {
  try {
    // Android only shows its prompt once a channel exists.
    await ensureChannel();
    return permissionFrom(await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } }));
  } catch {
    return 'denied';
  }
}

let queue: Promise<void> = Promise.resolve();

/** Replaces everything that was queued with this plan. Calls run one after another, so a quick double change can't interleave. */
export function scheduleReminders(plan: readonly PlannedReminder[]): Promise<void> {
  queue = queue.then(async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (plan.length === 0) return;
      await ensureChannel();
      for (const reminder of plan) {
        await Notifications.scheduleNotificationAsync({
          content: { title: reminder.title, body: reminder.body, sound: true, data: { url: REMINDER_URL } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.at, channelId: CHANNEL_ID },
        });
      }
    } catch {
      // Permission was withdrawn or the scheduler refused: the next sync tries again.
    }
  });
  return queue;
}

/** Fires one reminder now, so the user can see what they look like. */
export async function sendTestReminder(message: { title: string; body: string }): Promise<void> {
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title: message.title, body: message.body, sound: true, data: { url: REMINDER_URL } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: CHANNEL_ID },
  });
}

/** Calls back when the user taps a reminder, including the tap that launched the app. */
export function onReminderOpened(handler: () => void): () => void {
  let handledId: string | null = null;
  // The tap that launched the app can show up both here and in the listener, so each notification is handled once.
  const open = (response: Notifications.NotificationResponse | null) => {
    if (!response || response.notification.request.content.data?.url !== REMINDER_URL) return;
    const id = response.notification.request.identifier;
    if (id === handledId) return;
    handledId = id;
    handler();
  };
  try {
    open(Notifications.getLastNotificationResponse());
    Notifications.clearLastNotificationResponse();
  } catch {
    // No launch tap to read: taps while the app is running still arrive below.
  }
  const subscription = Notifications.addNotificationResponseReceivedListener(open);
  return () => subscription.remove();
}

/** The app's page in the system Settings, where notifications are switched back on after a "Don't Allow". */
export function openSystemSettings(): void {
  void Linking.openSettings();
}
