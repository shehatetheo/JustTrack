import type { MacroGoals, NutritionValues } from '@/types';

/**
 * Ideas for what could fill the rest of the day: given what is left of the
 * calorie goal and of each macro, which foods (and how much of them) fit.
 * These are suggestions and nothing more: the app never tells anyone what
 * they must eat, and nothing here is advice.
 */

export type Macro = 'protein' | 'carbs' | 'fat';
export const MACROS: readonly Macro[] = ['protein', 'carbs', 'fat'];
const KCAL_PER_GRAM: Record<Macro, number> = { protein: 4, carbs: 4, fat: 9 };

/** With no macro targets set, the day is measured against the middle of the usual ranges. */
export const DEFAULT_SPLIT: Record<Macro, number> = { protein: 0.2, carbs: 0.5, fat: 0.3 };

/** Below this many calories left there is no room worth filling. */
export const MIN_ROOM = 100;
/** A plate of several foods needs at least this much room. */
export const MIN_PLATE_ROOM = 250;
/** How far past what is left a suggestion may run. */
const SLACK_KCAL = 25;

export type Remaining = NutritionValues;

/** The gram targets in force: the user's own, or the default split of their calorie goal. */
export function macroTargets(calorieGoal: number, macroGoals: MacroGoals | null): MacroGoals {
  if (macroGoals) return macroGoals;
  return {
    protein: Math.round((calorieGoal * DEFAULT_SPLIT.protein) / KCAL_PER_GRAM.protein),
    carbs: Math.round((calorieGoal * DEFAULT_SPLIT.carbs) / KCAL_PER_GRAM.carbs),
    fat: Math.round((calorieGoal * DEFAULT_SPLIT.fat) / KCAL_PER_GRAM.fat),
  };
}

/** What is left of the day, never below zero. */
export function remainingFor(calorieGoal: number, macroGoals: MacroGoals | null, eaten: NutritionValues): Remaining {
  const targets = macroTargets(calorieGoal, macroGoals);
  const left = (target: number, had: number) => Math.max(0, Math.round(target - had));
  return {
    calories: left(calorieGoal, eaten.calories),
    protein: left(targets.protein, eaten.protein),
    carbs: left(targets.carbs, eaten.carbs),
    fat: left(targets.fat, eaten.fat),
  };
}

export type FoodKind = 'protein' | 'grain' | 'fruit' | 'legume' | 'dairy' | 'fat' | 'vegetable';

export interface Candidate {
  id: string;
  name: string;
  kind: FoodKind;
  /** Nutrition in one unit of its portion ("1 egg", "1 cup"). */
  unit: NutritionValues;
  /** How many units make a sensible amount, the usual one first. */
  counts: readonly number[];
}

export interface Pick {
  candidate: Candidate;
  count: number;
  nutrition: NutritionValues;
  /** The macro most of its calories come from, or "balanced" when none is over half. */
  leads: Macro | 'balanced';
  score: number;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

function scale(unit: NutritionValues, count: number): NutritionValues {
  return { calories: Math.round(unit.calories * count), protein: round1(unit.protein * count), carbs: round1(unit.carbs * count), fat: round1(unit.fat * count) };
}

function macroCalories(nutrition: NutritionValues): Record<Macro, number> {
  return { protein: nutrition.protein * 4, carbs: nutrition.carbs * 4, fat: nutrition.fat * 9 };
}

export function leadingMacro(nutrition: NutritionValues): Macro | 'balanced' {
  const parts = macroCalories(nutrition);
  const total = parts.protein + parts.carbs + parts.fat;
  if (!(total > 0)) return 'balanced';
  const top = MACROS.reduce((best, macro) => (parts[macro] > parts[best] ? macro : best), MACROS[0]);
  return parts[top] / total > 0.5 ? top : 'balanced';
}

/**
 * How well an amount of food suits what is left, from -1 to 1. Two things
 * count: how much of the food goes to macros that still have room (rather
 * than spilling over ones that are full), and how closely its mix of protein,
 * carbs and fat matches the mix that is missing.
 */
export function fit(nutrition: NutritionValues, remaining: Remaining): number {
  const have = macroCalories(nutrition);
  const need = macroCalories(remaining);
  const haveTotal = have.protein + have.carbs + have.fat;
  const needTotal = need.protein + need.carbs + need.fat;
  if (!(haveTotal > 0) || !(needTotal > 0)) return -1;

  let used = 0;
  let spilled = 0;
  let dot = 0;
  let haveSquares = 0;
  let needSquares = 0;
  for (const macro of MACROS) {
    used += Math.min(have[macro], need[macro]);
    spilled += Math.max(0, have[macro] - need[macro]);
    dot += have[macro] * need[macro];
    haveSquares += have[macro] ** 2;
    needSquares += need[macro] ** 2;
  }
  const useful = (used - spilled) / haveTotal;
  const shape = dot / Math.sqrt(haveSquares * needSquares);
  return useful * 0.6 + shape * 0.4;
}

/** An amount that fills a real part of the room ranks a little above a nibble. */
function sizeBonus(nutrition: NutritionValues, remaining: Remaining): number {
  return 0.1 * Math.min(1, nutrition.calories / Math.min(remaining.calories, 300));
}

/**
 * The amount of one food that suits what is left best, or null if no amount
 * of it fits. `fullest` picks the largest amount that suits nearly as well,
 * for building a plate that comes close to the room there is.
 */
export function bestPortion(candidate: Candidate, remaining: Remaining, capKcal = Infinity, fullest = false): Pick | null {
  const ceiling = Math.min(remaining.calories + SLACK_KCAL, capKcal);
  const options: (Pick & { suits: number })[] = [];
  for (const count of candidate.counts) {
    const nutrition = scale(candidate.unit, count);
    if (!(nutrition.calories > 0) || nutrition.calories > ceiling) continue;
    const suits = fit(nutrition, remaining);
    options.push({ candidate, count, nutrition, leads: leadingMacro(nutrition), suits, score: suits + sizeBonus(nutrition, remaining) });
  }
  if (options.length === 0) return null;
  const top = Math.max(...options.map((option) => option.suits));
  const chosen = fullest
    ? options.filter((option) => option.suits >= top - 0.08).sort((x, y) => y.nutrition.calories - x.nutrition.calories)[0]
    : // The usual amount comes first and keeps its place unless another is clearly better.
      (options.find((option) => option.suits >= top - 0.02) ?? options[0]);
  const { suits: _suits, ...pick } = chosen;
  return pick;
}

function ranked(candidates: readonly Candidate[], remaining: Remaining, capKcal?: number, fullest = false): Pick[] {
  return candidates
    .map((candidate) => bestPortion(candidate, remaining, capKcal, fullest))
    .filter((pick): pick is Pick => pick !== null && pick.score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name));
}

/**
 * Single foods that fit, best first. No more than two of a kind, and no more
 * than two led by the same macro, so the list is not five ways to eat
 * chicken. `turn` moves on to the next handful.
 */
export function suggestFoods(candidates: readonly Candidate[], remaining: Remaining, limit = 4, turn = 0): Pick[] {
  if (remaining.calories < MIN_ROOM) return [];
  const all = ranked(candidates, remaining);
  const pages: Pick[][] = [];
  const left = [...all];
  while (left.length > 0) {
    const page: Pick[] = [];
    const kinds = new Map<string, number>();
    for (let index = 0; index < left.length && page.length < limit; ) {
      const pick = left[index];
      const seen = kinds.get(pick.candidate.kind) ?? 0;
      const led = kinds.get(`led by ${pick.leads}`) ?? 0;
      if (seen >= 2 || led >= 2) {
        index += 1;
        continue;
      }
      kinds.set(pick.candidate.kind, seen + 1);
      kinds.set(`led by ${pick.leads}`, led + 1);
      page.push(pick);
      left.splice(index, 1);
    }
    if (page.length === 0) break;
    pages.push(page);
  }
  // Only full pages take a turn, so shuffling never lands on a lone leftover.
  const full = pages.filter((page) => page.length === limit);
  const usable = full.length > 0 ? full : pages.slice(0, 1);
  return usable.length > 0 ? usable[turn % usable.length] : [];
}

export interface Plate {
  picks: Pick[];
  total: NutritionValues;
}

/** A plate is sized like a meal, not like everything left in the day. */
export const PLATE_KCAL = 700;

/**
 * What each part of a plate is drawn from, how much of the room left it may
 * take, and the macro it is there for: the protein is chosen for the protein
 * still missing and the starch for the carbs, so neither is picked for being
 * a bit of everything.
 */
const PLATE_PARTS: readonly { kinds: readonly FoodKind[]; share: number; fills?: Macro }[] = [
  { kinds: ['protein', 'legume'], share: 0.45, fills: 'protein' },
  { kinds: ['grain'], share: 0.7, fills: 'carbs' },
  { kinds: ['vegetable', 'fat'], share: 1 },
  { kinds: ['fruit', 'dairy'], share: 1 },
];

/**
 * A few foods that together make a meal out of what is left: something for
 * protein, something for carbs, then whatever rounds it off. Each part is
 * chosen against what the parts before it left over. With more room than one
 * meal needs, the plate keeps the same mix of macros at a meal's size.
 */
export function suggestPlate(candidates: readonly Candidate[], remaining: Remaining, turn = 0, mealKcal = PLATE_KCAL): Plate | null {
  if (remaining.calories < MIN_PLATE_ROOM) return null;
  const portion = Math.min(1, mealKcal / remaining.calories);
  let room: Remaining = { calories: Math.round(remaining.calories * portion), protein: remaining.protein * portion, carbs: remaining.carbs * portion, fat: remaining.fat * portion };
  const picks: Pick[] = [];
  const used = new Set<string>();

  PLATE_PARTS.forEach((part, index) => {
    if (room.calories < 60) return;
    const pool = candidates.filter((candidate) => part.kinds.includes(candidate.kind) && !used.has(candidate.id));
    const aim: Remaining = part.fills ? { calories: room.calories, protein: 0, carbs: 0, fat: 0, [part.fills]: room[part.fills] } : room;
    const options = ranked(pool, aim, room.calories * part.share + SLACK_KCAL, true).slice(0, 4);
    if (options.length === 0) return;
    // Shuffling changes the first part; the rest follow from what it leaves.
    const pick = options[index === 0 ? turn % options.length : 0];
    picks.push(pick);
    used.add(pick.candidate.id);
    room = {
      calories: Math.max(0, room.calories - pick.nutrition.calories),
      protein: Math.max(0, room.protein - pick.nutrition.protein),
      carbs: Math.max(0, room.carbs - pick.nutrition.carbs),
      fat: Math.max(0, room.fat - pick.nutrition.fat),
    };
  });

  if (picks.length < 2) return null;
  const total = picks.reduce<NutritionValues>(
    (sum, pick) => ({ calories: sum.calories + pick.nutrition.calories, protein: round1(sum.protein + pick.nutrition.protein), carbs: round1(sum.carbs + pick.nutrition.carbs), fat: round1(sum.fat + pick.nutrition.fat) }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return { picks, total };
}
