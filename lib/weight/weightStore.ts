import { createPersistedStore } from '@/lib/storage/persistedStore';
import { MAX_WEIGHT_KG, MIN_WEIGHT_KG } from '@/lib/weight/limits';
import type { WeightEntry } from '@/types';
import { parseDateKey, toDateKey } from '@/utils/date';

/** The weigh-in history. Like the food log it lives only on this device, oldest first, one entry per day. */

export function parseWeights(raw: unknown): WeightEntry[] | null {
  if (!Array.isArray(raw)) return null;
  const byDay = new Map<string, WeightEntry>();
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const { date, kg } = item as Record<string, unknown>;
    if (typeof date !== 'string' || parseDateKey(date) === null) continue;
    if (typeof kg !== 'number' || !Number.isFinite(kg) || kg < MIN_WEIGHT_KG || kg > MAX_WEIGHT_KG) continue;
    byDay.set(date, { date, kg });
  }
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export const weightStore = createPersistedStore<WeightEntry[]>('justtrack.weight.v1', [], parseWeights);

/** Records a weigh-in for `day`, replacing any earlier one that day. Returns false for a value that can't be a weight. */
export function logWeight(kg: number, day: Date = new Date()): boolean {
  if (!Number.isFinite(kg) || kg < MIN_WEIGHT_KG || kg > MAX_WEIGHT_KG) return false;
  const date = toDateKey(day);
  const rounded = Math.round(kg * 100) / 100;
  weightStore.set((current) => [...current.filter((entry) => entry.date !== date), { date, kg: rounded }].sort((a, b) => a.date.localeCompare(b.date)));
  return true;
}

export function removeWeight(date: string): void {
  weightStore.set((current) => current.filter((entry) => entry.date !== date));
}

export function clearWeights(): void {
  weightStore.set([]);
}
