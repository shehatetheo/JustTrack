import { MAX_CALORIE_TARGET } from '@/constants/onboarding';
import { MIN_CALORIE_TARGET } from '@/lib/nutrition/calorieTarget';
import { createPersistedStore } from '@/lib/storage/persistedStore';
import { MAX_WEIGHT_KG, MIN_WEIGHT_KG } from '@/lib/weight/limits';
import type { MacroGoals, ReminderSettings, Settings } from '@/types';

/** Earliest and latest hour the first reminder of the day can be set to. */
export const REMINDER_START_HOURS = [6, 7, 8, 9, 10] as const;

export const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: false,
  asked: false,
  mode: 'interval',
  startHour: 8,
  meals: { breakfast: true, lunch: true, dinner: true },
};

export const DEFAULT_SETTINGS: Settings = {
  welcomed: false,
  displayName: null,
  calorieGoal: 2000,
  macroGoals: null,
  weightUnit: 'lb',
  heightUnit: 'ft_in',
  reminders: DEFAULT_REMINDERS,
  goalWeightKg: null,
  welcomedAt: null,
  welcomeBackAt: null,
};

function clampGoal(value: unknown): number {
  const goal = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : DEFAULT_SETTINGS.calorieGoal;
  return Math.min(Math.max(goal, MIN_CALORIE_TARGET), MAX_CALORIE_TARGET);
}

function parseMacroGoals(raw: unknown): MacroGoals | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { protein, carbs, fat } = raw as Record<string, unknown>;
  const ok = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 2000;
  return ok(protein) && ok(carbs) && ok(fat) ? { protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat) } : null;
}

function parseTimestamp(raw: unknown): string | null {
  return typeof raw === 'string' && Number.isFinite(Date.parse(raw)) ? raw : null;
}

function parseReminders(raw: unknown): ReminderSettings {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_REMINDERS;
  const item = raw as Record<string, unknown>;
  const meals = (typeof item.meals === 'object' && item.meals !== null ? item.meals : {}) as Record<string, unknown>;
  const startHour = (REMINDER_START_HOURS as readonly number[]).includes(item.startHour as number) ? (item.startHour as number) : DEFAULT_REMINDERS.startHour;
  return {
    enabled: item.enabled === true,
    asked: item.asked === true,
    mode: item.mode === 'meals' ? 'meals' : 'interval',
    startHour,
    // A meal is on unless it was explicitly switched off.
    meals: { breakfast: meals.breakfast !== false, lunch: meals.lunch !== false, dinner: meals.dinner !== false },
  };
}

export function parseSettings(raw: unknown): Settings | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const item = raw as Record<string, unknown>;
  return {
    welcomed: item.welcomed === true,
    displayName: typeof item.displayName === 'string' && item.displayName.trim() ? item.displayName.trim().slice(0, 40) : null,
    calorieGoal: clampGoal(item.calorieGoal),
    macroGoals: parseMacroGoals(item.macroGoals),
    weightUnit: item.weightUnit === 'kg' ? 'kg' : 'lb',
    heightUnit: item.heightUnit === 'cm' ? 'cm' : 'ft_in',
    reminders: parseReminders(item.reminders),
    goalWeightKg: typeof item.goalWeightKg === 'number' && item.goalWeightKg >= MIN_WEIGHT_KG && item.goalWeightKg <= MAX_WEIGHT_KG ? item.goalWeightKg : null,
    welcomedAt: parseTimestamp(item.welcomedAt),
    welcomeBackAt: parseTimestamp(item.welcomeBackAt),
  };
}

export const settingsStore = createPersistedStore<Settings>('justtrack.settings.v1', DEFAULT_SETTINGS, parseSettings);

export function updateSettings(patch: Partial<Settings>): void {
  settingsStore.set((current) => ({ ...current, ...patch, calorieGoal: clampGoal(patch.calorieGoal ?? current.calorieGoal) }));
}

export function updateReminders(patch: Partial<ReminderSettings>): void {
  settingsStore.set((current) => ({ ...current, reminders: { ...current.reminders, ...patch } }));
}
