import type { LogEntry } from '@/types';

import { nameInGroup } from '../groups';
import { activeFast, clampFastDays, cleanWords, fastConflict, fastDates, fastIsEmpty, fastProgress, fastRuleText, newFastPlan, parseFastPlan, SNACKING, wordsFromText } from '../plan';

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
    expect(nameInGroup('Chocolate cake', 'sweets')).toBe(true);
    expect(nameInGroup('Vanilla ice cream', 'sweets')).toBe(true);
    expect(nameInGroup('Sweet potato fries', 'sweets')).toBe(false);
    expect(nameInGroup('Chicken pot pie', 'sweets')).toBe(false);
    expect(nameInGroup('Pancakes', 'sweets')).toBe(false);
    expect(nameInGroup('Light beer', 'alcohol')).toBe(true);
    expect(nameInGroup('Root beer', 'alcohol')).toBe(false);
    expect(nameInGroup('Ginger ale', 'alcohol')).toBe(false);
  });

  it.each(['Coca-Cola Classic - 22 fl oz', 'Diet Coke - 32 fl oz', 'Sprite', 'Mountain Dew', 'Dr Pepper', 'Dr. Pepper Zero', 'Root beer', 'Ginger ale', 'Orange soda', 'Red Bull', 'Cola, with caffeine'])('reads %s as soda', (name) => {
    expect(nameInGroup(name, 'soda')).toBe(true);
  });

  it.each(['Club soda', 'Baking soda', 'Irish soda bread', 'Sparkling water', 'Orange juice', 'Iced tea', 'Water', 'Pepper steak'])('does not read %s as soda', (name) => {
    expect(nameInGroup(name, 'soda')).toBe(false);
  });

  it.each(['Snickers bar', 'Gummy bears', 'Sour Patch Kids', 'Dark chocolate', 'Milk chocolate candy bar', "Reese's Peanut Butter Cups", 'Skittles', 'Hard candy', 'Jelly beans', 'M&Ms'])('reads %s as candy', (name) => {
    expect(nameInGroup(name, 'candy')).toBe(true);
  });

  it.each(['Chocolate milk', 'Chocolate protein shake', 'Chocolate chip pancakes', 'Candied yams', 'Caramel latte', 'Salted Caramel Cream Cold Brew', 'Truffle, Mushroom & Brie Egg Bites', 'Caramelized onions', 'Hot chocolate', 'Apple'])('does not read %s as candy', (name) => {
    expect(nameInGroup(name, 'candy')).toBe(false);
  });

  it.each(['Potato chips', 'Chips - Large', 'Chips & Guac', 'Tortilla chips', 'Doritos Nacho Cheese', 'Flamin Hot Cheetos', "Lay's Classic", 'Pringles', 'Takis', 'Kettle chips, sea salt'])('reads %s as chips', (name) => {
    expect(nameInGroup(name, 'chips')).toBe(true);
  });

  it.each(['Chocolate chip cookie', 'Chocolate chips', 'Fish and chips', 'Chips Ahoy', 'French fries', 'Chipotle chicken', 'Pickles, Crinkle (3 Chips)', 'Nacho Cheese Doritos Locos Taco', 'Apple crisp'])('does not read %s as chips', (name) => {
    expect(nameInGroup(name, 'chips')).toBe(false);
  });

  it.each(['Chocolate chip cookie', 'Oreo cookies', 'Popcorn, buttered', 'Saltine crackers', 'Soft pretzel', 'Cheez-It', 'Goldfish crackers', 'Fruit snacks', 'Pop-Tarts', 'Granola bar', 'Chex Mix'])('reads %s as a snack food', (name) => {
    expect(nameInGroup(name, 'snacks')).toBe(true);
  });

  it.each(['Graham cracker crust pie', 'Cookies and cream ice cream', 'Cookie dough ice cream', 'Banana, raw', 'Greek yogurt', 'Turkey sandwich', 'Protein bar', 'Popcorn Chicken', 'Ranch Snack Wrap'])('does not read %s as a snack food', (name) => {
    expect(nameInGroup(name, 'snacks')).toBe(false);
  });
});

describe('fast plan', () => {
  it('defaults to twenty days of no soda, candy, chips or snacks, with nothing between meals', () => {
    const plan = newFastPlan(START);
    expect(plan).toEqual({ startedOn: '2026-11-18', days: 20, avoid: ['soda', 'candy', 'chips', 'snacks'], noSnackMeal: true, customWords: [] });
    expect(fastRuleText(plan)).toBe('no soda, candy, chips or snacks');
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
    expect(fastRuleText({ avoid: ['meat'], customWords: [], noSnackMeal: false })).toBe('no meat');
    expect(fastRuleText({ avoid: ['meat', 'dairy'], customWords: [], noSnackMeal: false })).toBe('no meat or dairy');
    expect(fastRuleText({ avoid: ['meat', 'fish'], customWords: ['fried food'], noSnackMeal: false })).toBe('no meat, fish or fried food');
    expect(fastRuleText({ avoid: ['snacks'], customWords: [], noSnackMeal: false })).toBe('no snack foods');
    expect(fastRuleText({ avoid: ['soda'], customWords: [], noSnackMeal: true })).toBe('no soda or snacking');
    expect(fastRuleText({ avoid: [], customWords: [], noSnackMeal: false })).toBe('nothing set aside yet');
    expect(fastIsEmpty({ avoid: [], customWords: [], noSnackMeal: false })).toBe(true);
    expect(fastIsEmpty({ avoid: [], customWords: [], noSnackMeal: true })).toBe(false);
  });

  it('finds what a food runs into, by group, brand or custom word', () => {
    const plan = { avoid: ['meat' as const], customWords: ['fried', 'energy drink'], noSnackMeal: false };
    expect(fastConflict(plan, 'Chicken Bowl', 'Chipotle Mexican Grill')).toBe('meat');
    expect(fastConflict(plan, 'Fried rice')).toBe('fried');
    expect(fastConflict(plan, 'Energy Drinks, original', 'Monster')).toBe('energy drink');
    expect(fastConflict(plan, 'Sofritas Bowl', 'Chipotle Mexican Grill')).toBeNull();
    expect(fastConflict(plan, 'Banana, raw')).toBeNull();
  });

  it('names the default fast\u2019s four things, and counts anything under Snacks', () => {
    const plan = newFastPlan(START);
    expect(fastConflict(plan, 'Coca-Cola Classic - 22 fl oz', 'Chipotle Mexican Grill')).toBe('soda');
    expect(fastConflict(plan, 'Snickers bar')).toBe('candy');
    expect(fastConflict(plan, 'Chips - Regular', 'Chipotle Mexican Grill')).toBe('chips');
    expect(fastConflict(plan, 'Oreo cookies')).toBe('snack');
    expect(fastConflict(plan, 'Chicken Bowl', 'Chipotle Mexican Grill', 'lunch')).toBeNull();
    expect(fastConflict(plan, 'Banana, raw', null, 'breakfast')).toBeNull();
    expect(fastConflict(plan, 'Banana, raw', null, 'snacks')).toBe(SNACKING);
    expect(fastConflict({ ...plan, noSnackMeal: false }, 'Banana, raw', null, 'snacks')).toBeNull();
  });

  it('reads a saved plan and refuses a broken one', () => {
    expect(parseFastPlan({ startedOn: '2026-11-18', days: 20, avoid: ['meat', 'nonsense', 'soda'], customWords: ['Fried'], noSnackMeal: true })).toEqual({ startedOn: '2026-11-18', days: 20, avoid: ['soda', 'meat'], noSnackMeal: true, customWords: ['fried'] });
    expect(parseFastPlan({ startedOn: '2026-11-18', days: 20, avoid: ['meat'] })?.noSnackMeal).toBe(false);
    expect(parseFastPlan({ startedOn: 'soon', days: 20, avoid: ['meat'] })).toBeNull();
    expect(parseFastPlan({ startedOn: '2026-11-18', days: 20, avoid: [] })).toBeNull();
    expect(parseFastPlan({ startedOn: '2026-11-18', days: 20, avoid: [], noSnackMeal: true })).not.toBeNull();
    expect(parseFastPlan(null)).toBeNull();
  });
});

describe('fast progress', () => {
  const plan = newFastPlan(START, 20, ['meat'], [], false);

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

  it('with the default fast, a day is off for soda or for anything logged under Snacks', () => {
    const mine = newFastPlan(START);
    const log = [entry('a', 'Chicken sandwich', 0), entry('b', 'Sprite', 1), { ...entry('c', 'Apple', 2), mealType: 'snacks' as const }, entry('d', 'Apple', 3)];
    expect(fastProgress(mine, log, new Date(2026, 10, 21)).states.slice(0, 4)).toEqual(['kept', 'off', 'off', 'kept']);
  });

  it('is only in force between its first and last day', () => {
    expect(activeFast(plan, new Date(2026, 10, 17))).toBeNull();
    expect(activeFast(plan, START)).toBe(plan);
    expect(activeFast(plan, new Date(2026, 11, 7, 23))).toBe(plan);
    expect(activeFast(plan, new Date(2026, 11, 8))).toBeNull();
    expect(activeFast(null, START)).toBeNull();
  });
});
