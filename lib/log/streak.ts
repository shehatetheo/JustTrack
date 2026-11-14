import type { LogEntry } from '@/types';
import { addDays, toDateKey } from '@/utils/date';

/**
 * A streak is a run of calendar days with at least one food logged. It
 * stays alive through today until midnight: if yesterday was logged and
 * today isn't yet, the streak still stands and is marked as waiting.
 */
export interface StreakSummary {
  /** Days in a row, ending today, or yesterday if today has nothing yet. */
  current: number;
  /** The longest run on record. */
  best: number;
  loggedToday: boolean;
  /** A streak that needs something logged today to carry on. */
  waiting: boolean;
  /** How many days have anything logged at all. */
  daysLogged: number;
  /** The last seven days, oldest first, ending today. */
  week: { date: Date; logged: boolean }[];
}

function daysWithLogs(entries: readonly Pick<LogEntry, 'loggedAt'>[]): Set<string> {
  const days = new Set<string>();
  for (const entry of entries) {
    const loggedAt = new Date(entry.loggedAt);
    if (Number.isFinite(loggedAt.getTime())) days.add(toDateKey(loggedAt));
  }
  return days;
}

export function streakSummary(entries: readonly Pick<LogEntry, 'loggedAt'>[], today: Date): StreakSummary {
  const days = daysWithLogs(entries);
  const has = (date: Date) => days.has(toDateKey(date));
  const loggedToday = has(today);

  let current = 0;
  for (let day = loggedToday ? today : addDays(today, -1); has(day); day = addDays(day, -1)) current += 1;

  // Longest run: start counting at each day whose yesterday is empty.
  let best = 0;
  for (const key of days) {
    const [year, month, date] = key.split('-').map(Number);
    const start = new Date(year, month - 1, date);
    if (has(addDays(start, -1))) continue;
    let run = 0;
    for (let day = start; has(day); day = addDays(day, 1)) run += 1;
    best = Math.max(best, run);
  }

  return {
    current,
    best: Math.max(best, current),
    loggedToday,
    waiting: current > 0 && !loggedToday,
    daysLogged: days.size,
    week: Array.from({ length: 7 }, (_, index) => {
      const date = addDays(today, index - 6);
      return { date, logged: has(date) };
    }),
  };
}

/** Whole days since anything was last logged; null when nothing ever has been. */
export function daysSinceLastLog(entries: readonly Pick<LogEntry, 'loggedAt'>[], now: Date): number | null {
  let latest = 0;
  for (const entry of entries) {
    const loggedAt = Date.parse(entry.loggedAt);
    if (Number.isFinite(loggedAt) && loggedAt > latest) latest = loggedAt;
  }
  if (latest === 0) return null;
  const last = new Date(latest);
  const from = new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

/** After this many days without logging, the app greets the user with the welcome-back slides. */
export const LAPSE_DAYS = 3;
/** If they still haven't logged, the slides can come back after this long. */
export const RESHOW_DAYS = 7;

function calendarDaysBetween(from: Date, to: Date): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((end - start) / 86_400_000);
}

interface LapseInput {
  entries: readonly Pick<LogEntry, 'loggedAt'>[];
  /** When onboarding was finished: the starting line for someone who has never logged. */
  welcomedAt: string | null;
  /** When the slides were last shown. */
  welcomeBackAt: string | null;
  now: Date;
}

/**
 * How many days the user has been away, if it is time to show the
 * welcome-back slides; otherwise null. One lapse gets one showing, with a
 * second only if a further week passes with nothing logged.
 */
export function lapseDays({ entries, welcomedAt, welcomeBackAt, now }: LapseInput): number | null {
  const lastLog = entries.reduce((latest, entry) => {
    const loggedAt = Date.parse(entry.loggedAt);
    return Number.isFinite(loggedAt) && loggedAt > latest ? loggedAt : latest;
  }, 0);
  const lastActive = lastLog > 0 ? lastLog : welcomedAt ? Date.parse(welcomedAt) : Number.NaN;
  if (!Number.isFinite(lastActive)) return null;
  const away = calendarDaysBetween(new Date(lastActive), now);
  if (away < LAPSE_DAYS) return null;
  if (welcomeBackAt) {
    const shown = Date.parse(welcomeBackAt);
    if (Number.isFinite(shown) && shown > lastActive && calendarDaysBetween(new Date(shown), now) < RESHOW_DAYS) return null;
  }
  return away;
}
