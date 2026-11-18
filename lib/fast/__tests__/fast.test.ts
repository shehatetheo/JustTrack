import type { LogEntry } from '@/types';

import { nameInGroup } from '../groups';
import { activeFast, clampFastDays, cleanWords, fastConflict, fastDates, fastProgress, fastRuleText, newFastPlan, parseFastPlan, wordsFromText } from '../plan';

const START = new Date(2026, 10, 18);

function entry(id: string, foodName: string, daysIn: number, brand: string | null = null): LogEntry {
  const at = new Date(2026, 10, 18 + daysIn, 12);
  return { id, loggedAt: at.toISOString(), mealType: 'lunch', source: 'usda', externalFoodId: null, externalServingId: null, foodName, brand, servings: 1, amountUnit: 'serving', grams: 100, isEstimate: false, imageUri: null, calories: 300, protein: 10, carbs: 30, fat: 10 };
}

describe('food groups', () => {
  it.each(['Grilled chicken breast', 'Bacon cheeseburger', 'Chicken Burrito Bowl', 'Turkey sub', 'Pepperoni pizza', 'Philly Cheesesteak', 'Big Mac', 'Pulled pork sandwich', 'Carne asada tacos', 'Ham and swiss', 'Beef jerky', '10 pc Chicken McNuggets'])('reads %s as meat', (name) => {
    expect(nameInGroup(name, 'meat')).toBe(true);
  });

  it.each(['Veggie burger', 'Impossible Whopper', 'Beyond Burger', 'Tofu scramble', 'Black bean burger', 'Hamburger buns', 'Steak fries', 'Beefsteak tomato', 'Banana, raw', 'Oatmeal', 'Graham crackers', 'Hamilton Beach smoothie', 'Champagne grapes', 'Cheese pizza', 'Marinara sauce'])('does not read %s as meat', (name) => {
    expect(nameInGroup(name, 'meat')).toBe(false);
  });

  it('keeps fish apart from meat', () => {
    expect(nameInGroup('Grilled salmon', 'meat')).toBe(false);
    expect(nameInGroup('Grilled salmon', 'fish')).toBe(true);
    expect(nameInGroup('Goldfish crackers', 'fish')).toBe(false);
  });

  it('knows plant milks and nut butters are not dairy', () => {
    expect(nameInGroup('Whole milk', 'dairy')).toBe(true);
    expect(nameInGroup('Oat milk latte', 'dairy')).toBe(true);
    expect(nameInGroup('Almond milk', 'dairy')).toBe(false);
    expect(nameInGroup('Peanut butter', 'dairy')).toBe(false);
    expect(nameInGroup('Butternut squash soup', 'dairy')).toBe(false);
    expect(nameInGroup('Greek yogurt', 'dairy')).toBe(true);
  });

  it('handles the other groups and their lookalikes', () => {
    expect(nameInGroup('Scrambled eggs', 'eggs')).toBe(true);
    expect(nameInGroup('Eggplant parmesan', 'eggs')).toBe(false);
    expect(nameInGroup('Chocolate chip cookie', 'sweets')).toBe(true);
    expect(nameInGroup('Sweet potato fries', 'sweets')).toBe(false);
    expect(nameInGroup('Chicken pot pie', 'sweets')).toBe(false);
    expect(nameInGroup('Light beer', 'alcohol')).toBe(true);
    expect(nameInGroup('Root beer', 'alcohol')).toBe(false);
    expect(nameInGroup('Ginger ale', 'alcohol')).toBe(false);
  });
});

describe('fast plan', () => {
  it('defaults to twenty days without meat', () => {
    const plan = newFastPlan(START);
    expect(plan).toEqual({ startedOn: '2026-11-18', days: 20, avoid: ['meat'], customWords: [] });
    const { end } = fastDates(plan);
    expect([end.getMonth(), end.getDate()]).toEqual([11, 7]);
  });

  it('keeps the length within bounds', () => {
    expect(clampFastDays(0)).toBe(1);
    expect(clampFastDays(500)).toBe(120);
    expect(clampFastDays(Number.NaN)).toBe(20);
    expect(clampFastDays(7.6)).toBe(8);
  });

  it('tidies custom words', () => {
    expect(wordsFromText(' Soda, fried food ;soda\n x ')).toEqual(['soda', 'fried food']);
    expect(cleanWords(['A', 7, 'energy drinks'])).toEqual(['energy drinks']);
  });

  it('says the rule in words', () => {
    expect(fastRuleText({ avoid: ['meat'], customWords: [] })).toBe('no meat');
    expect(fastRuleText({ avoid: ['meat', 'dairy'], customWords: [] })).toBe('no meat or dairy');
    expect(fastRuleText({ avoid: ['meat', 'fish'], customWords: ['soda'] })).toBe('no meat, fish or soda');
    expect(fastRuleText({ avoid: [], customWords: [] })).toBe('nothing set aside yet');
  });

  it('finds what a food runs into, by group, brand or custom word', () => {
    const plan = { avoid: ['meat' as const], customWords: ['soda', 'energy drink'] };
    expect(fastConflict(plan, 'Chicken Bowl', 'Chipotle Mexican Grill')).toBe('meat');
    expect(fastConflict(plan, 'Diet sodas')).toBe('soda');
    expect(fastConflict(plan, 'Energy Drinks, original', 'Monster')).toBe('energy drink');
    expect(fastConflict(plan, 'Sofritas Bowl', 'Chipotle Mexican Grill')).toBeNull();
    expect(fastConflict(plan, 'Banana, raw')).toBeNull();
  });

  it('reads a saved plan and refuses a broken one', () => {
    expect(parseFastPlan({ startedOn: '2026-11-18', days: 20, avoid: ['meat', 'nonsense'], customWords: ['Soda'] })).toEqual({ startedOn: '2026-11-18', days: 20, avoid: ['meat'], customWords: ['soda'] });
    expect(parseFastPlan({ startedOn: 'soon', days: 20, avoid: ['meat'] })).toBeNull();
    expect(parseFastPlan({ startedOn: '2026-11-18', days: 20, avoid: [] })).toBeNull();
    expect(parseFastPlan(null)).toBeNull();
  });
});

describe('fast progress', () => {
  const plan = newFastPlan(START, 20, ['meat']);

  it('counts the day and what is left', () => {
    const first = fastProgress(plan, [], START);
    expect([first.phase, first.dayNumber, first.daysLeft]).toEqual(['active', 1, 19]);
    const last = fastProgress(plan, [], new Date(2026, 11, 7));
    expect([last.phase, last.dayNumber, last.daysLeft]).toEqual(['active', 20, 0]);
    expect(fastProgress(plan, [], new Date(2026, 11, 8)).phase).toBe('done');
    const before = fastProgress(plan, [], new Date(2026, 10, 17));
    expect([before.phase, before.dayNumber, before.daysLeft]).toEqual(['upcoming', 0, 20]);
  });

  it('marks each day kept, off, quiet or still ahead', () => {
    const log = [entry('a', 'Oatmeal', 0), entry('b', 'Lentil soup', 0), entry('c', 'Chicken sandwich', 1), entry('d', 'Salad', 3)];
    const progress = fastProgress(plan, log, new Date(2026, 10, 21));
    expect(progress.states.slice(0, 5)).toEqual(['kept', 'off', 'quiet', 'kept', 'ahead']);
    expect([progress.kept, progress.off]).toEqual([2, 1]);
    expect(progress.states).toHaveLength(20);
  });

  it('is only in force between its first and last day', () => {
    expect(activeFast(plan, new Date(2026, 10, 17))).toBeNull();
    expect(activeFast(plan, START)).toBe(plan);
    expect(activeFast(plan, new Date(2026, 11, 7, 23))).toBe(plan);
    expect(activeFast(plan, new Date(2026, 11, 8))).toBeNull();
    expect(activeFast(null, START)).toBeNull();
  });
});
