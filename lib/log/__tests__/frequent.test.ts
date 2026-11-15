import type { LogEntry } from '@/types';

import { frequentEntries } from '../frequent';

const NOW = new Date('2026-11-15T12:00:00Z');

function entry(id: string, foodName: string, daysAgo: number, extra: Partial<LogEntry> = {}): LogEntry {
  return {
    id,
    loggedAt: new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString(),
    mealType: 'lunch',
    source: 'usda',
    externalFoodId: null,
    externalServingId: null,
    foodName,
    brand: null,
    servings: 1,
    amountUnit: 'serving',
    grams: 100,
    isEstimate: false,
    imageUri: null,
    calories: 100,
    protein: 5,
    carbs: 10,
    fat: 3,
    ...extra,
  };
}

describe('frequentEntries', () => {
  it('leaves out foods logged only once', () => {
    expect(frequentEntries([entry('a', 'Banana', 1)], NOW)).toEqual([]);
  });

  it('orders by how often, then by how recently', () => {
    const log = [entry('a1', 'Oatmeal', 1), entry('a2', 'Oatmeal', 2), entry('a3', 'Oatmeal', 3), entry('b1', 'Banana', 0.5), entry('b2', 'Banana', 4), entry('c1', 'Rice', 5), entry('c2', 'Rice', 6)];
    expect(frequentEntries(log, NOW).map((item) => item.foodName)).toEqual(['Oatmeal', 'Banana', 'Rice']);
  });

  it('returns the most recent entry of each food, so the latest amount is repeated', () => {
    const log = [entry('old', 'Oatmeal', 5, { servings: 1 }), entry('new', 'Oatmeal', 1, { servings: 2 })];
    expect(frequentEntries(log, NOW)[0].id).toBe('new');
  });

  it('treats the same name under different brands as different foods', () => {
    const log = [entry('a', 'Greek yogurt', 1, { brand: 'Chobani' }), entry('b', 'Greek yogurt', 2, { brand: 'Fage' })];
    expect(frequentEntries(log, NOW)).toEqual([]);
  });

  it('ignores case and stray spaces in the name', () => {
    const log = [entry('a', 'Banana', 1), entry('b', ' banana ', 2)];
    expect(frequentEntries(log, NOW)).toHaveLength(1);
  });

  it('only looks at the last 30 days', () => {
    const log = [entry('a', 'Banana', 1), entry('b', 'Banana', 45)];
    expect(frequentEntries(log, NOW)).toEqual([]);
  });

  it('keeps to the limit', () => {
    const log = ['A', 'B', 'C', 'D'].flatMap((name, index) => [entry(`${name}1`, name, index + 1), entry(`${name}2`, name, index + 2)]);
    expect(frequentEntries(log, NOW, 2)).toHaveLength(2);
  });
});
