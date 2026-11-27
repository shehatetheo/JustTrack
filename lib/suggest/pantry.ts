import { getUsdaFood } from '@/lib/food/usdaDatabase';
import type { FoodDetail, FoodServing } from '@/types';
import type { Candidate, FoodKind } from './fill';

/**
 * The foods suggestions are drawn from: plain, everyday things from the
 * built-in USDA database, each in a portion someone would actually eat. No
 * restaurant items and nothing branded.
 *
 * [USDA id, short name, kind, the database portion it is counted in, sensible counts (usual first), what one and several of that portion are called]
 */
type PantryRow = [id: string, name: string, kind: FoodKind, portion: string, counts: number[], units: [one: string, many: string]];

const PANTRY: readonly PantryRow[] = [
  ['2705958', 'Chicken breast', 'protein', '1 small breast', [1, 1.5, 2, 0.5], ['small breast', 'small breasts']],
  ['2707154', 'Boiled eggs', 'protein', '1 egg', [2, 1, 3], ['egg', 'eggs']],
  ['2707170', 'Egg whites', 'protein', '1 egg white', [3, 4, 6], ['egg white', 'egg whites']],
  ['2706311', 'Canned tuna', 'protein', '1 small can', [1, 2], ['small can', 'small cans']],
  ['2706113', 'Roast turkey', 'protein', '1 large or thick slice', [1, 2, 3], ['thick slice', 'thick slices']],
  ['2706363', 'Steamed shrimp', 'protein', '1 large/jumbo shrimp', [6, 10, 14], ['large shrimp', 'large shrimp']],
  ['2707435', 'Tofu', 'protein', '1 piece (2-1/2" x 2-3/4" x 1")', [1, 2], ['piece', 'pieces']],
  ['2705424', 'Greek yogurt, plain', 'dairy', '1 6 oz container', [1, 2], ['6 oz container', '6 oz containers']],
  ['2705386', 'Milk, 2%', 'dairy', '1 cup', [1, 2], ['cup', 'cups']],
  ['2705723', 'Mozzarella stick', 'dairy', '1 stick', [1, 2], ['stick', 'sticks']],
  ['2707425', 'Lentils', 'legume', '1 cup', [1, 0.5, 1.5], ['cup', 'cups']],
  ['2707363', 'Black beans', 'legume', '1 cup', [1, 0.5], ['cup', 'cups']],
  ['2707418', 'Chickpeas', 'legume', '1 cup', [1, 0.5], ['cup', 'cups']],
  ['2707436', 'Edamame', 'legume', '1 cup', [1, 0.5], ['cup', 'cups']],
  ['2708408', 'White rice', 'grain', '1 cup, cooked', [1, 0.5, 1.5, 2], ['cup, cooked', 'cups, cooked']],
  ['2708414', 'Brown rice', 'grain', '1 cup, cooked', [1, 0.5, 1.5], ['cup, cooked', 'cups, cooked']],
  ['2708381', 'Oatmeal', 'grain', '1 cup, cooked', [1, 1.5, 2], ['cup, cooked', 'cups, cooked']],
  ['2708357', 'Pasta', 'grain', '1 cup, cooked', [1, 1.5, 2, 0.5], ['cup, cooked', 'cups, cooked']],
  ['2708400', 'Quinoa', 'grain', '1 cup, cooked', [1, 0.5, 1.5], ['cup, cooked', 'cups, cooked']],
  ['2707709', 'Whole wheat bread', 'grain', '1 medium or regular slice', [2, 1, 3], ['slice', 'slices']],
  ['2709699', 'Baked sweet potato', 'grain', '1 medium', [1, 2], ['medium', 'medium']],
  ['2709383', 'Baked potato', 'grain', '1 small', [1, 0.5], ['small', 'small']],
  ['2709224', 'Banana', 'fruit', '1 banana', [1, 2], ['banana', 'bananas']],
  ['2709215', 'Apple', 'fruit', '1 medium', [1], ['medium apple', 'medium apples']],
  ['2709171', 'Orange', 'fruit', '1 fruit', [1, 2], ['orange', 'oranges']],
  ['2709275', 'Blueberries', 'fruit', '1 cup', [1, 0.5], ['cup', 'cups']],
  ['2709237', 'Grapes', 'fruit', '1 cup', [1, 0.5], ['cup', 'cups']],
  ['2709223', 'Avocado', 'fat', '1 fruit', [0.5, 1, 0.25], ['avocado', 'avocados']],
  ['2707485', 'Almonds', 'fat', '1 nut', [20, 10, 30], ['almond', 'almonds']],
  ['2707531', 'Walnuts', 'fat', '1 nut', [10, 7, 14], ['walnut half', 'walnut halves']],
  ['2707537', 'Peanut butter', 'fat', '1 tablespoon', [2, 1], ['tablespoon', 'tablespoons']],
  ['2707402', 'Hummus', 'fat', '1 tablespoon', [4, 2, 6], ['tablespoon', 'tablespoons']],
  ['2709645', 'Broccoli', 'vegetable', '1 cup', [1, 2], ['cup', 'cups']],
  ['2709660', 'Carrots', 'vegetable', '1 cup', [1], ['cup', 'cups']],
];

export interface PantryFood {
  candidate: Candidate;
  food: FoodDetail;
  serving: FoodServing;
  units: [one: string, many: string];
}

const FRACTIONS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' };

/** "2 eggs", "½ avocado", "1½ cups, cooked": an amount the way someone would say it. */
export function amountLabel(units: readonly [string, string], count: number): string {
  const whole = Math.floor(count);
  const fraction = FRACTIONS[String(Math.round((count - whole) * 100) / 100)];
  const number = fraction ? `${whole > 0 ? whole : ''}${fraction}` : String(Math.round(count * 100) / 100);
  return `${number} ${count > 1 ? units[1] : units[0]}`;
}

let cache: PantryFood[] | null = null;

/** The pantry, looked up in the database. A row the database no longer has is left out. */
export function pantryFoods(): PantryFood[] {
  if (cache) return cache;
  cache = PANTRY.flatMap(([id, name, kind, portion, counts, units]) => {
    const food = getUsdaFood(id);
    const serving = food?.servings.find((item) => item.id === `portion:${portion}`);
    if (!food || !serving) return [];
    const unit = { calories: serving.calories, protein: serving.protein, carbs: serving.carbs, fat: serving.fat };
    return [{ candidate: { id: food.id, name, kind, unit, counts }, food, serving, units }];
  });
  return cache;
}

export const PANTRY_SIZE = PANTRY.length;
