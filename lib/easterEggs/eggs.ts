import { settingsStore } from '@/lib/settings/settingsStore';

/**
 * Hidden details. None of them is needed to use the app, none says
 * anything about food or the body, and all of them can be turned off here
 * in one place: set this to false and nothing below ever fires or shows.
 */
export const EASTER_EGGS_ENABLED = true;

export type EggId = 'night-owl' | 'philly' | 'shatter' | 'tagline' | 'ink-shake' | 'wax-seal' | 'seasonal' | 'dev-credit' | 'postmark' | 'blade-flip';

export interface Egg {
  id: EggId;
  /** What it is called when it is found. */
  name: string;
  /** What the collected stamp says: one short word, because it is set inside a postmark. */
  mark: string;
  /** Shown once found, in the list of secrets. */
  found: string;
}

export const EGGS: readonly Egg[] = [
  { id: 'night-owl', name: 'night owl', mark: 'owl', found: 'You woke the moon on Home.' },
  { id: 'philly', name: 'philly', mark: 'philly', found: 'You searched for a Philadelphia classic.' },
  { id: 'shatter', name: 'shatter', mark: 'shatter', found: 'You pressed the mark until it broke.' },
  { id: 'tagline', name: 'tagline', mark: 'tagline', found: 'You pulled Home down past the top.' },
  { id: 'ink-shake', name: 'ink shake', mark: 'ink', found: 'You shook the ink loose on Today.' },
  { id: 'wax-seal', name: 'wax seal', mark: 'seal', found: 'You logged seven days in a row.' },
  { id: 'seasonal', name: 'in season', mark: 'season', found: 'You opened the app on the right day.' },
  { id: 'dev-credit', name: 'built by theo', mark: 'theo', found: 'You looked up who made this.' },
  { id: 'postmark', name: 'postmark', mark: 'post', found: 'You re-inked a LOGGED stamp.' },
  { id: 'blade-flip', name: 'blade flip', mark: 'flip', found: 'You turned the tab bar around.' },
];

export function isEgg(id: string): id is EggId {
  return EGGS.some((egg) => egg.id === id);
}

/** The eggs in `found` that still exist, in the order they are listed above. */
export function foundEggs(found: readonly string[]): Egg[] {
  return EGGS.filter((egg) => found.includes(egg.id));
}

/**
 * Records that an egg was found. Returns the egg the first time, and null
 * after that (or when eggs are switched off), so the caller can say
 * "secret found" exactly once.
 */
export function findEgg(id: EggId): Egg | null {
  if (!EASTER_EGGS_ENABLED) return null;
  if (settingsStore.getSnapshot().secretsFound.includes(id)) return null;
  settingsStore.set((current) => (current.secretsFound.includes(id) ? current : { ...current, secretsFound: [...current.secretsFound, id] }));
  return EGGS.find((egg) => egg.id === id) ?? null;
}

const PHILLY = /\b(cheese ?steaks?|water ice|soft pretzels?)\b/i;

/** The line hidden above the top of Home. */
export const HIDDEN_LINE = 'the wonders of the invisible macro';
/** What the monogram says when it is broken open. */
export const SHATTER_LINE = 'made in philly · open source';

/** A search for one of three things the city is known for. */
export function isPhillySearch(query: string): boolean {
  return EASTER_EGGS_ENABLED && PHILLY.test(query);
}

/** A search for the person who made the app, and nothing else. */
export function isDevSearch(query: string): boolean {
  return EASTER_EGGS_ENABLED && query.trim().toLowerCase() === 'theo';
}

export type Season = 'bats' | 'snow' | 'firework';

/** Halloween, any day in December, New Year's Day: the three days (and one month) the hero gets a little extra ink. */
export function seasonFor(date: Date): Season | null {
  if (!EASTER_EGGS_ENABLED) return null;
  const month = date.getMonth();
  const day = date.getDate();
  if (month === 9 && day === 31) return 'bats';
  if (month === 11) return 'snow';
  if (month === 0 && day === 1) return 'firework';
  return null;
}

export type Seal = 'wax' | 'rose';

/** A week of logging in a row earns a wax seal; thirty days, the rose window. Consistency is the only thing that earns anything. */
export function sealFor(streakDays: number): Seal | null {
  if (!EASTER_EGGS_ENABLED) return null;
  if (streakDays >= 30) return 'rose';
  if (streakDays >= 7) return 'wax';
  return null;
}

/** How many taps, and how close together, set off a tap-counting egg. */
export function countTaps(times: readonly number[], now: number, needed: number, windowMs: number): number[] {
  const recent = [...times.filter((time) => now - time <= windowMs), now];
  return recent.slice(-needed);
}

/** "NOV 15": the date a postmark carries. */
export function postmarkDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}
