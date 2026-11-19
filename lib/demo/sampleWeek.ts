import { addEntries, logStore } from '@/lib/log/logStore';
import { settingsStore } from '@/lib/settings/settingsStore';
import { logWeight, weightStore } from '@/lib/weight/weightStore';
import type { LogEntry, MealType, WeightEntry } from '@/types';
import { addDays, startOfDay, toDateKey } from '@/utils/date';

/**
 * A week of made-up food and weigh-ins, for the website's demo: one tap
 * and the app on the page has something to show. Every sample entry's id
 * starts with "demo-", so the sample can be taken out again without
 * touching anything the visitor logged themselves.
 */

const PREFIX = 'demo-';
const DAYS = 7;
const WEIGH_INS = 14;

type Dish = [name: string, calories: number, protein: number, carbs: number, fat: number];

const BREAKFASTS: Dish[] = [
  ['Oatmeal with banana', 380, 12, 68, 7],
  ['Greek yogurt with berries', 220, 20, 24, 5],
  ['Scrambled eggs and toast', 340, 20, 26, 17],
  ['Bagel with cream cheese', 360, 11, 52, 12],
];
const LUNCHES: Dish[] = [
  ['Chicken burrito bowl', 720, 45, 78, 24],
  ['Turkey sandwich', 480, 30, 48, 17],
  ['Lentil soup with bread', 430, 22, 64, 9],
  ['Chicken caesar salad', 520, 38, 22, 30],
];
const DINNERS: Dish[] = [
  ['Salmon, rice and broccoli', 640, 40, 58, 24],
  ['Spaghetti with meat sauce', 680, 32, 86, 20],
  ['Tofu and vegetable stir-fry', 520, 28, 48, 22],
  ['Roast chicken and potatoes', 610, 44, 46, 26],
];
const SNACKS: Dish[] = [
  ['Apple', 95, 0, 25, 0],
  ['Protein shake', 160, 25, 8, 3],
  ['Almonds', 170, 6, 6, 15],
];

function entry(day: Date, index: number, hour: number, mealType: MealType, [foodName, calories, protein, carbs, fat]: Dish): LogEntry {
  const at = new Date(day);
  at.setHours(hour, 10 + index * 7, 0, 0);
  return { id: `${PREFIX}${toDateKey(day)}-${mealType}`, loggedAt: at.toISOString(), mealType, source: 'usda', externalFoodId: null, externalServingId: null, foodName, brand: null, servings: 1, amountUnit: 'serving', grams: 250, isEstimate: false, imageUri: null, calories, protein, carbs, fat };
}

/** Seven days of meals ending today. Today stops after lunch, so there is still something left to log. */
export function sampleEntries(now: Date): LogEntry[] {
  const today = startOfDay(now);
  const entries: LogEntry[] = [];
  for (let back = DAYS - 1; back >= 0; back -= 1) {
    const day = addDays(today, -back);
    const turn = DAYS - 1 - back;
    entries.push(entry(day, 0, 8, 'breakfast', BREAKFASTS[turn % BREAKFASTS.length]));
    entries.push(entry(day, 1, 12, 'lunch', LUNCHES[turn % LUNCHES.length]));
    if (back === 0) continue;
    entries.push(entry(day, 2, 19, 'dinner', DINNERS[turn % DINNERS.length]));
    if (turn % 2 === 0) entries.push(entry(day, 3, 16, 'snacks', SNACKS[turn % SNACKS.length]));
  }
  return entries;
}

/** Two weeks of weigh-ins drifting gently down, with the day-to-day wobble a real scale has. */
export function sampleWeights(now: Date): WeightEntry[] {
  const today = startOfDay(now);
  return Array.from({ length: WEIGH_INS }, (_, index) => {
    const back = WEIGH_INS - 1 - index;
    const kg = 80.4 + back * 0.09 + Math.sin(back * 1.7) * 0.35;
    return { date: toDateKey(addDays(today, -back)), kg: Math.round(kg * 100) / 100 };
  });
}

const isSample = (item: LogEntry) => item.id.startsWith(PREFIX);

export function hasSampleWeek(entries: readonly LogEntry[]): boolean {
  return entries.some(isSample);
}

/**
 * Puts the sample in: the meals, weigh-ins on days that have none, and past
 * the welcome screen if the visitor hasn't been. Does nothing if it is
 * already there.
 */
export function addSampleWeek(now: Date = new Date()): boolean {
  if (hasSampleWeek(logStore.getSnapshot())) return false;
  addEntries(sampleEntries(now));
  const taken = new Set(weightStore.getSnapshot().map((item) => item.date));
  for (const weight of sampleWeights(now)) {
    if (!taken.has(weight.date)) logWeight(weight.kg, new Date(`${weight.date}T12:00:00`));
  }
  if (!settingsStore.getSnapshot().welcomed) settingsStore.set((current) => ({ ...current, welcomed: true, welcomedAt: now.toISOString() }));
  return true;
}

/** Takes the sample back out: its meals, and its weigh-ins where they are still exactly as they were put in. */
export function removeSampleWeek(): boolean {
  const entries = logStore.getSnapshot();
  const sample = entries.filter(isSample);
  if (sample.length === 0) return false;
  // The sample was dated from the day it was added, which is the last day it has a meal on.
  const anchor = new Date(Math.max(...sample.map((item) => Date.parse(item.loggedAt))));
  const added = new Map(sampleWeights(anchor).map((item) => [item.date, item.kg]));
  logStore.set((current) => current.filter((item) => !isSample(item)));
  weightStore.set((current) => current.filter((item) => added.get(item.date) !== item.kg));
  return true;
}
