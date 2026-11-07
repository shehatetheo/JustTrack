import { calculateNutrition } from '@/lib/nutrition/calculateNutrition';
import { metricServing } from '@/lib/nutrition/portion';
import { matchChainItem, searchChainFoods } from '@/lib/food/chainDatabase';
import { searchUsdaFoods } from '@/lib/food/usdaDatabase';
import type { EstimatedFood, FoodDetail, MealAnalysis, NutritionValues } from '@/types';

/**
 * The scan in progress: the picture or the typed description, what the
 * model found, and the user's edits before anything is logged. Lives in
 * memory only — a photo is analyzed and then forgotten.
 */

export interface ReviewRow {
  id: string;
  name: string;
  portionDescription: string;
  grams: number;
  confidence: number;
  /** Nutrition at `basis.grams`; everything else scales from it. */
  basis: { grams: number; nutrition: NutritionValues };
  /** Set once the user swaps in a database food. */
  matchedFood: { name: string; brand: string | null; source: FoodDetail['source']; externalId: string } | null;
  /** The chain the scanner recognized, whether or not a menu item matched. */
  chain: string | null;
  /** The model's own numbers, kept so the user can switch back after trying a database match. */
  estimate: { grams: number; nutrition: NutritionValues; name: string; portionDescription: string };
  /** Database foods that look like this item, offered as alternatives to the estimate. */
  suggestions: FoodDetail[];
}

export interface ReviewState {
  photoUri: string | null;
  /** What the user typed, when the meal was described rather than photographed. */
  description: string | null;
  /** A small copy of the photo that's saved with the entries, so meal cards show the plate. */
  thumbnailUri: string | null;
  status: 'idle' | 'analyzing' | 'ready' | 'error';
  error: string | null;
  errorCode: string | null;
  note: string | null;
  rows: ReviewRow[];
}

const EMPTY: ReviewState = { photoUri: null, description: null, thumbnailUri: null, status: 'idle', error: null, errorCode: null, note: null, rows: [] };

let state: ReviewState = EMPTY;
const listeners = new Set<() => void>();

function publish(next: ReviewState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export const reviewStore = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

let rowCounter = 0;

export function rowFromEstimate(food: EstimatedFood): ReviewRow {
  const grams = Math.max(1, Math.round(food.estimatedGrams));
  return {
    id: `row-${++rowCounter}`,
    name: food.name,
    portionDescription: food.portionDescription,
    grams,
    confidence: food.confidence,
    basis: { grams, nutrition: { calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat } },
    matchedFood: null,
    chain: food.chain,
    estimate: { grams, nutrition: { calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat }, name: food.name, portionDescription: food.portionDescription },
    suggestions: [],
  };
}

/** Up to three database foods that could be this item: the chain's menu when one is named, else everyday foods. */
export function suggestionsFor(row: ReviewRow, limit = 3): FoodDetail[] {
  const query = row.name.replace(/[(),]/g, ' ');
  const fromChain = row.chain ? searchChainFoods(`${row.chain} ${query}`, limit) : [];
  const fromUsda = fromChain.length >= limit ? [] : searchUsdaFoods(query, limit - fromChain.length);
  const seen = new Set<string>();
  return [...fromChain, ...fromUsda].filter((food) => (seen.has(food.id) ? false : (seen.add(food.id), true)));
}

/** Back to the model's own estimate after trying a database match. */
export function revertToEstimate(id: string): void {
  publish({
    ...state,
    rows: state.rows.map((row) => (row.id === id ? { ...row, name: row.estimate.name, portionDescription: row.estimate.portionDescription, grams: row.estimate.grams, basis: { grams: row.estimate.grams, nutrition: row.estimate.nutrition }, matchedFood: null } : row)),
  });
}

/** A recognized chain item snaps to its menu nutrition, so the row isn't an estimate anymore. */
function withMenuMatch(row: ReviewRow): ReviewRow {
  if (!row.chain) return row;
  const food = matchChainItem(row.chain, row.name, row.portionDescription);
  return (food && matchedRow(row, food)) ?? row;
}

function matchedRow(row: ReviewRow, food: FoodDetail): ReviewRow | null {
  const base = metricServing(food, 'g') ?? food.servings.find((serving) => serving.metricAmount) ?? food.servings.find((serving) => serving.isDefault) ?? null;
  if (!base) return null;
  // Menu items list nutrition per serving with no weight; the estimated grams stand in for one serving.
  const grams = base.metricAmount ?? row.grams;
  return {
    ...row,
    name: food.name,
    portionDescription: base.metricAmount ? row.portionDescription : base.description,
    basis: { grams, nutrition: { calories: base.calories, protein: base.protein, carbs: base.carbs, fat: base.fat } },
    matchedFood: { name: food.name, brand: food.brand, source: food.source, externalId: food.externalId },
  };
}

export function rowNutrition(row: ReviewRow): NutritionValues {
  return calculateNutrition({ referenceGrams: row.basis.grams, ...row.basis.nutrition }, row.grams);
}

export function startAnalysis(photoUri: string): void {
  publish({ ...EMPTY, photoUri, status: 'analyzing' });
}

export function startDescription(description: string): void {
  publish({ ...EMPTY, description, status: 'analyzing' });
}

export function setReviewThumbnail(thumbnailUri: string | null): void {
  publish({ ...state, thumbnailUri });
}

export function finishAnalysis(analysis: MealAnalysis): void {
  const rows = analysis.foods.map((food) => {
    const row = withMenuMatch(rowFromEstimate(food));
    return { ...row, suggestions: suggestionsFor(row) };
  });
  publish({ ...state, status: 'ready', note: analysis.note, rows });
}

export function failAnalysis(error: string, errorCode: string | null): void {
  publish({ ...state, status: 'error', error, errorCode });
}

export function setRowGrams(id: string, grams: number): void {
  publish({ ...state, rows: state.rows.map((row) => (row.id === id ? { ...row, grams: Math.max(1, Math.round(grams)) } : row)) });
}

export function removeRow(id: string): void {
  publish({ ...state, rows: state.rows.filter((row) => row.id !== id) });
}

/** Swaps the model's guess for a database food, keeping the estimated grams. */
export function matchRowToFood(id: string, food: FoodDetail): void {
  publish({ ...state, rows: state.rows.map((row) => (row.id === id ? (matchedRow(row, food) ?? row) : row)) });
}

export function resetReview(): void {
  publish(EMPTY);
}
