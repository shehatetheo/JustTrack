import { REMINDER_MESSAGES, momentFor, personalize } from '@/lib/reminders/messages';
import { createDealer, formatMinute, planReminders, reminderMinutes } from '@/lib/reminders/plan';
import { DEFAULT_REMINDERS, parseSettings } from '@/lib/settings/settingsStore';
import type { ReminderSettings } from '@/types';

const on: ReminderSettings = { ...DEFAULT_REMINDERS, enabled: true };
const at = (hour: number, minute = 0) => new Date(2026, 10, 14, hour, minute);
const clock = (date: Date) => `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

describe('reminder messages', () => {
  it('has well over 20 lines, each with a unique id, an emoji title and a body', () => {
    expect(REMINDER_MESSAGES.length).toBeGreaterThanOrEqual(40);
    expect(new Set(REMINDER_MESSAGES.map((message) => message.id)).size).toBe(REMINDER_MESSAGES.length);
    for (const message of REMINDER_MESSAGES) {
      expect(message.title).toMatch(/\p{Extended_Pictographic}/u);
      expect(message.body.length).toBeGreaterThan(10);
      // Lock-screen banners cut long text off.
      expect(message.title.length).toBeLessThanOrEqual(40);
      expect(message.body.length).toBeLessThanOrEqual(110);
    }
  });

  it('has at least 20 lines that fit every part of the day', () => {
    for (const moment of ['morning', 'midday', 'afternoon', 'evening'] as const) {
      expect(REMINDER_MESSAGES.filter((message) => message.when === 'any' || message.when === moment).length).toBeGreaterThanOrEqual(20);
    }
  });

  it('skips lines that need a name when there is none', () => {
    const named = REMINDER_MESSAGES.find((message) => message.title.includes('{name}'))!;
    expect(personalize(named, null)).toBeNull();
    expect(personalize(named, 'Theo')?.title).toContain('Theo');
  });

  it('sorts hours into parts of the day', () => {
    expect([8, 11, 12.5, 14, 17, 17.5, 21].map(momentFor)).toEqual(['morning', 'midday', 'midday', 'afternoon', 'afternoon', 'evening', 'evening']);
  });
});

describe('reminderMinutes', () => {
  it('runs every 90 minutes from the start hour until 9:30 PM', () => {
    expect(reminderMinutes(on).map(formatMinute)).toEqual(['8:00 AM', '9:30 AM', '11:00 AM', '12:30 PM', '2:00 PM', '3:30 PM', '5:00 PM', '6:30 PM', '8:00 PM', '9:30 PM']);
    expect(reminderMinutes({ ...on, startHour: 10 }).map(formatMinute)).toEqual(['10:00 AM', '11:30 AM', '1:00 PM', '2:30 PM', '4:00 PM', '5:30 PM', '7:00 PM', '8:30 PM']);
  });

  it('uses only the meals that are switched on in mealtime mode', () => {
    expect(reminderMinutes({ ...on, mode: 'meals' }).map(formatMinute)).toEqual(['8:30 AM', '12:30 PM', '6:30 PM']);
    expect(reminderMinutes({ ...on, mode: 'meals', meals: { breakfast: false, lunch: true, dinner: false } }).map(formatMinute)).toEqual(['12:30 PM']);
  });
});

describe('planReminders', () => {
  it('plans nothing when reminders are off or every meal is off', () => {
    expect(planReminders({ now: at(7), reminders: DEFAULT_REMINDERS })).toEqual([]);
    expect(planReminders({ now: at(7), reminders: { ...on, mode: 'meals', meals: { breakfast: false, lunch: false, dinner: false } } })).toEqual([]);
  });

  it('only schedules times still ahead today, then full days, and stays under the iOS limit of 64', () => {
    const plan = planReminders({ now: at(13, 10), reminders: on });
    const today = plan.filter((reminder) => reminder.at.getDate() === 14);
    expect(today.map((reminder) => clock(reminder.at))).toEqual(['14:00', '15:30', '17:00', '18:30', '20:00', '21:30']);
    expect(plan.filter((reminder) => reminder.at.getDate() === 15)).toHaveLength(10);
    expect(plan.length).toBeLessThanOrEqual(64);
    expect(plan.every((reminder) => reminder.at.getTime() > at(13, 10).getTime())).toBe(true);
    // Earliest start still fits.
    expect(planReminders({ now: at(0, 5), reminders: { ...on, startHour: 6 } }).length).toBeLessThanOrEqual(64);
  });

  it('ends with two comeback notes after the regular nudges', () => {
    const plan = planReminders({ now: at(7), reminders: on });
    const tail = plan.slice(-2).map((reminder) => reminder.messageId);
    expect(tail.sort()).toEqual(['been-a-while', 'ghosted']);
    const lastNudge = plan[plan.length - 3].at.getTime();
    expect(plan[plan.length - 2].at.getTime()).toBeGreaterThan(lastNudge);
    expect(plan.slice(0, -2).some((reminder) => ['ghosted', 'been-a-while'].includes(reminder.messageId))).toBe(false);
  });

  it('never repeats a line back to back and cycles at least 20 lines before any repeat', () => {
    const plan = planReminders({ now: at(7), reminders: on, displayName: 'Theo King', seed: 42 }).slice(0, -2);
    for (let index = 1; index < plan.length; index++) expect(plan[index].messageId).not.toBe(plan[index - 1].messageId);
    const firstRepeat = plan.findIndex((reminder, index) => plan.slice(0, index).some((earlier) => earlier.messageId === reminder.messageId));
    expect(firstRepeat === -1 ? plan.length : firstRepeat).toBeGreaterThanOrEqual(20);
    expect(new Set(plan.map((reminder) => reminder.messageId)).size).toBeGreaterThanOrEqual(40);
  });

  it('matches lines to the time of day', () => {
    const byId = new Map(REMINDER_MESSAGES.map((message) => [message.id, message]));
    for (const reminder of planReminders({ now: at(7), reminders: on, seed: 7 }).slice(0, -2)) {
      const when = byId.get(reminder.messageId)!.when;
      expect(['any', momentFor(reminder.at.getHours() + reminder.at.getMinutes() / 60)]).toContain(when);
    }
  });

  it('deals a different order with a different seed, and fills in the first name', () => {
    const first = planReminders({ now: at(7), reminders: on, seed: 1 }).map((reminder) => reminder.messageId);
    const second = planReminders({ now: at(7), reminders: on, seed: 2 }).map((reminder) => reminder.messageId);
    expect(first).not.toEqual(second);
    const named = planReminders({ now: at(7), reminders: on, displayName: 'Theo King', seed: 3 });
    expect(named.some((reminder) => reminder.title.includes('Theo'))).toBe(true);
    expect(named.every((reminder) => !`${reminder.title}${reminder.body}`.includes('{name}') && !reminder.title.includes('King'))).toBe(true);
    expect(planReminders({ now: at(7), reminders: on, seed: 3 }).every((reminder) => !`${reminder.title}${reminder.body}`.includes('{name}'))).toBe(true);
  });

  it('skips a meal that is already logged today, but not tomorrow', () => {
    const meals: ReminderSettings = { ...on, mode: 'meals' };
    const plan = planReminders({ now: at(7), reminders: meals, loggedMealsToday: ['lunch'] });
    expect(plan.filter((reminder) => reminder.at.getDate() === 14).map((reminder) => clock(reminder.at))).toEqual(['8:30', '18:30']);
    expect(plan.filter((reminder) => reminder.at.getDate() === 15).map((reminder) => clock(reminder.at))).toEqual(['8:30', '12:30', '18:30']);
  });

  it('holds off for 45 minutes after food is logged', () => {
    const plan = planReminders({ now: at(12, 10), reminders: on, lastLoggedAt: at(12, 5) });
    expect(clock(plan[0].at)).toBe('14:00');
    expect(clock(planReminders({ now: at(12, 10), reminders: on, lastLoggedAt: at(11, 0) })[0].at)).toBe('12:30');
  });
});

describe('createDealer', () => {
  it('goes through every line that fits before repeating one', () => {
    const deal = createDealer(null, 9);
    const pool = REMINDER_MESSAGES.filter((message) => (message.when === 'any' || message.when === 'evening') && personalize(message, null));
    const dealt = Array.from({ length: pool.length }, () => deal('evening').message.id);
    expect(new Set(dealt).size).toBe(pool.length);
  });
});

describe('reminder settings', () => {
  it('defaults to off, every 1.5 hours from 8 AM, for saves made before reminders existed', () => {
    expect(parseSettings({ welcomed: true })?.reminders).toEqual({ enabled: false, asked: false, mode: 'interval', startHour: 8, meals: { breakfast: true, lunch: true, dinner: true } });
  });

  it('keeps valid values and repairs bad ones', () => {
    expect(parseSettings({ reminders: { enabled: true, asked: true, mode: 'meals', startHour: 9, meals: { breakfast: false, lunch: true } } })?.reminders).toEqual({ enabled: true, asked: true, mode: 'meals', startHour: 9, meals: { breakfast: false, lunch: true, dinner: true } });
    expect(parseSettings({ reminders: { enabled: 'yes', mode: 'hourly', startHour: 3 } })?.reminders).toEqual(DEFAULT_REMINDERS);
  });
});
