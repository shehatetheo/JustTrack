import type { PlannedReminder } from '@/lib/reminders/plan';

/** Browsers can't schedule a notification for later without a server, so reminders are an app-only feature. */

export const remindersSupported = false;

export type ReminderPermission = 'granted' | 'denied' | 'undetermined';

export const REMINDER_URL = '/food/search';

export async function getReminderPermission(): Promise<ReminderPermission> {
  return 'denied';
}

export async function requestReminderPermission(): Promise<ReminderPermission> {
  return 'denied';
}

export function scheduleReminders(_plan: readonly PlannedReminder[]): Promise<void> {
  return Promise.resolve();
}

export async function sendTestReminder(_message: { title: string; body: string }): Promise<void> {}

export function onReminderOpened(_handler: () => void): () => void {
  return () => {};
}

export function openSystemSettings(): void {}
