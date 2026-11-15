import { settingsStore } from '@/lib/settings/settingsStore';

import { countTaps, EGGS, findEgg, foundEggs, isDevSearch, isEgg, isPhillySearch, postmarkDate, sealFor, seasonFor } from '../eggs';

describe('easter eggs', () => {
  beforeEach(() => {
    settingsStore.set((current) => ({ ...current, secretsFound: [] }));
  });

  it('has ten, each with a unique id', () => {
    expect(EGGS).toHaveLength(10);
    expect(new Set(EGGS.map((egg) => egg.id)).size).toBe(10);
    expect(isEgg('postmark')).toBe(true);
    expect(isEgg('nope')).toBe(false);
  });

  it('reports an egg the first time it is found and not again', () => {
    expect(findEgg('night-owl')?.name).toBe('night owl');
    expect(EGGS.every((egg) => egg.mark.length <= 7)).toBe(true);
    expect(findEgg('night-owl')).toBeNull();
    expect(settingsStore.getSnapshot().secretsFound).toEqual(['night-owl']);
  });

  it('lists found eggs in catalogue order and ignores ids it does not know', () => {
    expect(foundEggs(['postmark', 'made-up', 'night-owl']).map((egg) => egg.id)).toEqual(['night-owl', 'postmark']);
  });

  it('recognises the three Philadelphia searches', () => {
    expect(isPhillySearch('cheesesteak')).toBe(true);
    expect(isPhillySearch('Cheese Steak')).toBe(true);
    expect(isPhillySearch('mango water ice')).toBe(true);
    expect(isPhillySearch('soft pretzels')).toBe(true);
    expect(isPhillySearch('pretzel')).toBe(false);
    expect(isPhillySearch('steak')).toBe(false);
  });

  it('only credits the developer for an exact search', () => {
    expect(isDevSearch(' Theo ')).toBe(true);
    expect(isDevSearch('theobromine')).toBe(false);
  });

  it('knows the seasons', () => {
    expect(seasonFor(new Date(2026, 9, 31))).toBe('bats');
    expect(seasonFor(new Date(2026, 9, 30))).toBeNull();
    expect(seasonFor(new Date(2026, 11, 1))).toBe('snow');
    expect(seasonFor(new Date(2026, 11, 31))).toBe('snow');
    expect(seasonFor(new Date(2027, 0, 1))).toBe('firework');
    expect(seasonFor(new Date(2027, 0, 2))).toBeNull();
    expect(seasonFor(new Date(2026, 10, 15))).toBeNull();
  });

  it('seals a streak at seven days and again at thirty', () => {
    expect(sealFor(6)).toBeNull();
    expect(sealFor(7)).toBe('wax');
    expect(sealFor(29)).toBe('wax');
    expect(sealFor(30)).toBe('rose');
  });

  it('counts only taps that are close together', () => {
    let taps: number[] = [];
    taps = countTaps(taps, 0, 3, 600);
    taps = countTaps(taps, 200, 3, 600);
    expect(taps).toHaveLength(2);
    taps = countTaps(taps, 400, 3, 600);
    expect(taps).toHaveLength(3);
    expect(countTaps(taps, 5000, 3, 600)).toEqual([5000]);
  });

  it('writes a postmark date', () => {
    expect(postmarkDate(new Date(2026, 10, 15))).toBe('NOV 15');
  });
});
