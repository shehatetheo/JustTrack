import { momentFor, personalize, REMINDER_MESSAGES, type ReminderMessage, type ReminderMoment } from '@/lib/reminders/messages';
import type { ReminderMeal, ReminderSettings } from '@/types';

/**
 * Works out which reminders to queue. Pure: give it the clock and the
 * settings and it returns the list, so the timing rules can be tested
 * without a phone.
 *
 * iOS keeps at most 64 pending notifications per app, so the plan covers a
 * few days and is rebuilt every time the app comes to the front. If the app
 * stays closed, the nudges run out on their own, followed by a couple of
 * "come back" notes.
 */

/** Minutes between nudges in interval mode. */
export const INTERVAL_MINUTES = 90;
/** Nothing is scheduled after this time of day (21:30). */
export const LAST_MINUTE_OF_DAY = 21 * 60 + 30;
/** When each meal's reminder lands, in minutes after midnight. */
export const MEAL_MINUTES: Record<ReminderMeal, number> = { breakfast: 8 * 60 + 30, lunch: 12 * 60 + 30, dinner: 18 * 60 + 30 };
export const REMINDER_MEALS: readonly ReminderMeal[] = ['breakfast', 'lunch', 'dinner'];

/** Stay under the iOS cap of 64, leaving room for the comeback notes. */
const MAX_NUDGES = 60;
const MAX_DAYS = 7;
/** After logging food, the next nudge waits at least this long. */
const QUIET_AFTER_LOG_MINUTES = 45;
/** Days after the last nudge that each comeback note is sent. */
const COMEBACK_DAYS = [2, 5];
const COMEBACK_MINUTE = 12 * 60;

export interface PlannedReminder {
  at: Date;
  messageId: string;
  title: string;
  body: string;
}

export interface PlanInput {
  now: Date;
  reminders: ReminderSettings;
  /** The user's name, for the handful of lines that use it. */
  displayName?: string | null;
  /** Meals that already have food logged today; their reminder is skipped for today. */
  loggedMealsToday?: readonly ReminderMeal[];
  /** When food was last logged, so a nudge doesn't arrive right after. */
  lastLoggedAt?: Date | null;
  /** Any number; a different seed deals the messages in a different order. */
  seed?: number;
}

/** The times of day (minutes after midnight) reminders go out with these settings. */
export function reminderMinutes(reminders: ReminderSettings): number[] {
  if (reminders.mode === 'meals') {
    return REMINDER_MEALS.filter((meal) => reminders.meals[meal]).map((meal) => MEAL_MINUTES[meal]);
  }
  const minutes: number[] = [];
  for (let minute = reminders.startHour * 60; minute <= LAST_MINUTE_OF_DAY; minute += INTERVAL_MINUTES) minutes.push(minute);
  return minutes;
}

function atMinute(day: Date, dayOffset: number, minute: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + dayOffset, Math.floor(minute / 60), minute % 60, 0, 0);
}

/** Small seeded generator (mulberry32), so a plan can be reproduced in tests. */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: readonly T[], next: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(next() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

/**
 * Deals messages so nothing repeats until everything that fits has been
 * used. Each draw picks, among the lines that fit the moment, the one used
 * least so far; the shuffle decides ties.
 */
export function createDealer(firstName: string | null, seed: number) {
  const deck = shuffled(REMINDER_MESSAGES, random(seed)).filter((message) => personalize(message, firstName) !== null);
  const uses = new Map<string, number>();
  let previous: string | null = null;

  return (moment: Exclude<ReminderMoment, 'any'>): { message: ReminderMessage; title: string; body: string } => {
    const fits = deck.filter((message) => message.when === moment || (moment !== 'comeback' && message.when === 'any'));
    const least = Math.min(...fits.map((message) => uses.get(message.id) ?? 0));
    const fresh = fits.filter((message) => (uses.get(message.id) ?? 0) === least);
    const message = fresh.find((candidate) => candidate.id !== previous) ?? fresh[0];
    uses.set(message.id, least + 1);
    previous = message.id;
    const text = personalize(message, firstName) ?? { title: message.title, body: message.body };
    return { message, ...text };
  };
}

function firstNameOf(displayName: string | null | undefined): string | null {
  return displayName?.trim().split(/\s+/)[0] || null;
}

export function planReminders({ now, reminders, displayName = null, loggedMealsToday = [], lastLoggedAt = null, seed = 1 }: PlanInput): PlannedReminder[] {
  if (!reminders.enabled) return [];
  const minutes = reminderMinutes(reminders);
  if (minutes.length === 0) return [];

  const days = Math.min(MAX_DAYS, Math.floor(MAX_NUDGES / minutes.length));
  const quietUntil = lastLoggedAt ? lastLoggedAt.getTime() + QUIET_AFTER_LOG_MINUTES * 60_000 : 0;
  const mealAt = new Map<number, ReminderMeal>(REMINDER_MEALS.map((meal) => [MEAL_MINUTES[meal], meal]));
  const deal = createDealer(firstNameOf(displayName), seed);
  const plan: PlannedReminder[] = [];

  for (let day = 0; day < days; day++) {
    for (const minute of minutes) {
      const at = atMinute(now, day, minute);
      // Leave a minute of slack so nothing fires the instant it is scheduled.
      if (at.getTime() <= now.getTime() + 60_000) continue;
      if (at.getTime() < quietUntil) continue;
      if (day === 0 && reminders.mode === 'meals') {
        const meal = mealAt.get(minute);
        if (meal && loggedMealsToday.includes(meal)) continue;
      }
      const { message, title, body } = deal(momentFor(minute / 60));
      plan.push({ at, messageId: message.id, title, body });
    }
  }

  for (const offset of COMEBACK_DAYS) {
    const { message, title, body } = deal('comeback');
    plan.push({ at: atMinute(now, days - 1 + offset, COMEBACK_MINUTE), messageId: message.id, title, body });
  }
  return plan;
}

/** "8:00 AM" for minutes after midnight. */
export function formatMinute(minute: number): string {
  const hour = Math.floor(minute / 60);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 === 0 ? 12 : hour % 12}:${String(minute % 60).padStart(2, '0')} ${suffix}`;
}
