import { useRouter } from 'expo-router';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { useSettings } from '@/hooks/useSettings';
import { logStore } from '@/lib/log/logStore';
import { onReminderOpened, remindersSupported } from '@/lib/reminders/notifier';
import { syncReminders } from '@/lib/reminders/sync';

/**
 * Keeps the phone's queue of reminders in step with the app. It re-plans
 * when the settings or the log change and whenever the app comes back to
 * the front (which also rolls the schedule forward a day at a time), and it
 * opens Add Food when a reminder is tapped. Renders nothing.
 */
export function ReminderSync() {
  const router = useRouter();
  const { reminders, displayName, welcomed } = useSettings();
  const entries = useSyncExternalStore(logStore.subscribe, logStore.getSnapshot, logStore.getSnapshot);

  useEffect(() => {
    if (!remindersSupported) return;
    // Settle first: toggling a few switches in a row should plan once.
    const timer = setTimeout(() => void syncReminders(), 500);
    return () => clearTimeout(timer);
  }, [reminders, displayName, entries]);

  useEffect(() => {
    if (!remindersSupported) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncReminders();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!remindersSupported || !welcomed) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = onReminderOpened(() => {
      // On a cold start the navigator needs a beat before it can take a push.
      timer = setTimeout(() => router.push('/food/search'), 350);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [router, welcomed]);

  return null;
}
