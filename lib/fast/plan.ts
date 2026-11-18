import type { FastPlan, LogEntry, MealType } from '@/types';
import { addDays, parseDateKey, startOfDay, toDateKey } from '@/utils/date';

import { FAST_GROUPS, groupWord, isFastGroup, nameInGroup, type FastGroup } from './groups';

/**
 * A fast, here, is a stretch of days with some foods set aside: no soda,
 * candy, chips or snacks for twenty days, say. It is about what is eaten, never how little; nothing in
 * it touches the calorie goal. The app counts the days, points out a food
 * that looks like one being given up, and leaves every decision to the
 * person fasting.
 */

export const DEFAULT_FAST_DAYS = 20;
/** What a new fast starts with: no soda, candy, chips or snacks, and nothing between meals. */
export const DEFAULT_FAST_AVOID: readonly FastGroup[] = ['soda', 'candy', 'chips', 'snacks'];
export const DEFAULT_NO_SNACK_MEAL = true;
/** What the label says on something logged between meals. */
export const SNACKING = 'snacking';
export const MIN_FAST_DAYS = 1;
export const MAX_FAST_DAYS = 120;
export const MAX_CUSTOM_WORDS = 12;
export const MAX_WORD_LENGTH = 24;

export function clampFastDays(days: number): number {
  return Math.min(Math.max(Math.round(Number.isFinite(days) ? days : DEFAULT_FAST_DAYS), MIN_FAST_DAYS), MAX_FAST_DAYS);
}

/** Tidies the user's own words: lowercase, no duplicates, nothing empty or too long. */
export function cleanWords(words: readonly unknown[]): string[] {
  const cleaned = words
    .filter((word): word is string => typeof word === 'string')
    .map((word) => word.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, MAX_WORD_LENGTH))
    .filter((word) => word.length >= 2);
  return [...new Set(cleaned)].slice(0, MAX_CUSTOM_WORDS);
}

/** Splits what was typed into words: "soda, fried food" is two. */
export function wordsFromText(text: string): string[] {
  return cleanWords(text.split(/[,\n;]/));
}

const inOrder = (avoid: readonly FastGroup[]): FastGroup[] => FAST_GROUPS.map((group) => group.id).filter((id) => avoid.includes(id));

export function newFastPlan(start: Date, days: number = DEFAULT_FAST_DAYS, avoid: readonly FastGroup[] = DEFAULT_FAST_AVOID, customWords: readonly string[] = [], noSnackMeal: boolean = DEFAULT_NO_SNACK_MEAL): FastPlan {
  return { startedOn: toDateKey(startOfDay(start)), days: clampFastDays(days), avoid: inOrder(avoid), noSnackMeal, customWords: cleanWords(customWords) };
}

/** Reads a saved plan back, dropping anything that isn't one. */
export function parseFastPlan(raw: unknown): FastPlan | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const item = raw as Record<string, unknown>;
  if (typeof item.startedOn !== 'string' || !parseDateKey(item.startedOn)) return null;
  if (typeof item.days !== 'number' || !Number.isFinite(item.days)) return null;
  const avoid = Array.isArray(item.avoid) ? item.avoid.filter(isFastGroup) : [];
  const customWords = Array.isArray(item.customWords) ? cleanWords(item.customWords) : [];
  const noSnackMeal = item.noSnackMeal === true;
  if (avoid.length === 0 && customWords.length === 0 && !noSnackMeal) return null;
  return { startedOn: item.startedOn, days: clampFastDays(item.days), avoid: inOrder(avoid), noSnackMeal, customWords };
}

/** The first and last day of the fast. */
export function fastDates(plan: FastPlan): { start: Date; end: Date } {
  const start = parseDateKey(plan.startedOn) ?? startOfDay(new Date());
  return { start, end: addDays(start, plan.days - 1) };
}

/** Whether the plan sets anything aside at all. */
export function fastIsEmpty(plan: Pick<FastPlan, 'avoid' | 'customWords' | 'noSnackMeal'>): boolean {
  return plan.avoid.length === 0 && plan.customWords.length === 0 && !plan.noSnackMeal;
}

/** "no meat", "no meat or dairy", "no soda, candy, chips or snacks". */
export function fastRuleText(plan: Pick<FastPlan, 'avoid' | 'customWords' | 'noSnackMeal'>): string {
  // Snack foods and nothing-between-meals read as one thing, "snacks"; only one of them reads as itself.
  const names = plan.avoid.filter((group) => group !== 'snacks').map((group) => groupWord(group));
  if (plan.noSnackMeal) names.push(plan.avoid.includes('snacks') ? 'snacks' : 'snacking');
  else if (plan.avoid.includes('snacks')) names.push('snack foods');
  names.push(...plan.customWords);
  if (names.length === 0) return 'nothing set aside yet';
  if (names.length === 1) return `no ${names[0]}`;
  return `no ${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
}

function escapeWord(word: string): string {
  return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * What in the plan a food runs into, as a word to show ("soda", "snack",
 * "meat"), or null when it looks fine. Checks the name and the brand, and,
 * when the meal is known and the plan rules out eating between meals,
 * whether it is going under Snacks ("snacking").
 */
export function fastConflict(plan: Pick<FastPlan, 'avoid' | 'customWords' | 'noSnackMeal'>, foodName: string, brand?: string | null, mealType?: MealType | null): string | null {
  const text = `${foodName} ${brand ?? ''}`;
  for (const group of plan.avoid) {
    if (nameInGroup(text, group)) return groupWord(group);
  }
  for (const word of plan.customWords) {
    if (new RegExp(`\\b${escapeWord(word)}(s|es)?\\b`, 'i').test(text)) return word;
  }
  return plan.noSnackMeal && mealType === 'snacks' ? SNACKING : null;
}

/** kept: food was logged and none of it ran into the fast. off: something did. quiet: nothing logged. ahead: not here yet. */
export type FastDayState = 'kept' | 'off' | 'quiet' | 'ahead';

export interface FastProgress {
  /** Before the first day, during, or after the last. */
  phase: 'upcoming' | 'active' | 'done';
  /** 1-based day of the fast today; days when it is over, 0 before it starts. */
  dayNumber: number;
  daysLeft: number;
  /** One per day of the fast, in order. */
  states: FastDayState[];
  kept: number;
  off: number;
}

export function fastProgress(plan: FastPlan, entries: readonly LogEntry[], today: Date): FastProgress {
  const { start } = fastDates(plan);
  const now = startOfDay(today);
  const elapsed = Math.round((now.getTime() - start.getTime()) / 86_400_000);
  const phase = elapsed < 0 ? 'upcoming' : elapsed >= plan.days ? 'done' : 'active';

  const byDay = new Map<string, LogEntry[]>();
  for (const entry of entries) {
    const at = new Date(entry.loggedAt);
    if (Number.isNaN(at.getTime())) continue;
    const key = toDateKey(at);
    const list = byDay.get(key);
    if (list) list.push(entry);
    else byDay.set(key, [entry]);
  }

  const states: FastDayState[] = Array.from({ length: plan.days }, (_, index) => {
    if (index > elapsed) return 'ahead';
    const logged = byDay.get(toDateKey(addDays(start, index))) ?? [];
    if (logged.length === 0) return 'quiet';
    return logged.some((entry) => fastConflict(plan, entry.foodName, entry.brand, entry.mealType) !== null) ? 'off' : 'kept';
  });

  return {
    phase,
    dayNumber: phase === 'upcoming' ? 0 : Math.min(elapsed + 1, plan.days),
    daysLeft: phase === 'done' ? 0 : phase === 'upcoming' ? plan.days : plan.days - elapsed - 1,
    states,
    kept: states.filter((state) => state === 'kept').length,
    off: states.filter((state) => state === 'off').length,
  };
}

/** The plan, if it is in force on `today` (started and not yet over). */
export function activeFast(plan: FastPlan | null, today: Date): FastPlan | null {
  if (!plan) return null;
  const { start, end } = fastDates(plan);
  const now = startOfDay(today).getTime();
  return now >= start.getTime() && now <= end.getTime() ? plan : null;
}
