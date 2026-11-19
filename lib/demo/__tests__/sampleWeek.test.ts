import { addEntries, clearLog, logStore } from '@/lib/log/logStore';
import { DEFAULT_SETTINGS, settingsStore } from '@/lib/settings/settingsStore';
import { clearWeights, logWeight, weightStore } from '@/lib/weight/weightStore';
import type { LogEntry } from '@/types';

import { addSampleWeek, hasSampleWeek, removeSampleWeek, sampleEntries, sampleWeights } from '../sampleWeek';

const NOW = new Date(2026, 10, 19, 15);

const mine: LogEntry = { id: 'mine', loggedAt: new Date(2026, 10, 18, 9).toISOString(), mealType: 'breakfast', source: 'usda', externalFoodId: null, externalServingId: null, foodName: 'Toast', brand: null, servings: 1, amountUnit: 'serving', grams: 40, isEstimate: false, imageUri: null, calories: 90, protein: 3, carbs: 16, fat: 1 };

describe('the demo sample week', () => {
  beforeEach(() => {
    clearLog();
    clearWeights();
    settingsStore.set({ ...DEFAULT_SETTINGS });
  });

  it('is seven days of meals, with today stopping after lunch', () => {
    const entries = sampleEntries(NOW);
    const days = new Set(entries.map((item) => new Date(item.loggedAt).toDateString()));
    expect(days.size).toBe(7);
    const today = entries.filter((item) => new Date(item.loggedAt).toDateString() === NOW.toDateString());
    expect(today.map((item) => item.mealType)).toEqual(['breakfast', 'lunch']);
    expect(new Set(entries.map((item) => item.id)).size).toBe(entries.length);
    expect(entries.every((item) => item.id.startsWith('demo-') && item.calories > 0)).toBe(true);
    expect(entries.every((item) => Date.parse(item.loggedAt) <= NOW.getTime())).toBe(true);
  });

  it('has fourteen plausible weigh-ins ending today', () => {
    const weights = sampleWeights(NOW);
    expect(weights).toHaveLength(14);
    expect(weights[13].date).toBe('2026-11-19');
    expect(weights.every((item) => item.kg > 79 && item.kg < 83)).toBe(true);
  });

  it('goes in once, past the welcome screen, without touching what was there', () => {
    addEntries([mine]);
    logWeight(77, new Date(2026, 10, 18, 12));
    expect(addSampleWeek(NOW)).toBe(true);
    expect(addSampleWeek(NOW)).toBe(false);
    expect(hasSampleWeek(logStore.getSnapshot())).toBe(true);
    expect(settingsStore.getSnapshot().welcomed).toBe(true);
    expect(logStore.getSnapshot().some((item) => item.id === 'mine')).toBe(true);
    expect(weightStore.getSnapshot().find((item) => item.date === '2026-11-18')?.kg).toBe(77);
    expect(weightStore.getSnapshot()).toHaveLength(14);
  });

  it('comes back out and leaves the visitor’s own log and weigh-ins', () => {
    addEntries([mine]);
    logWeight(77, new Date(2026, 10, 18, 12));
    addSampleWeek(NOW);
    logWeight(81, new Date(2026, 10, 17, 12));
    expect(removeSampleWeek()).toBe(true);
    expect(logStore.getSnapshot().map((item) => item.id)).toEqual(['mine']);
    expect(weightStore.getSnapshot()).toEqual([
      { date: '2026-11-17', kg: 81 },
      { date: '2026-11-18', kg: 77 },
    ]);
    expect(removeSampleWeek()).toBe(false);
  });
});
