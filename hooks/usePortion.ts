import { useState } from 'react';

import {
  choiceKey,
  defaultAmount,
  defaultServing,
  describePortion,
  fromStoredPortion,
  maxAmount,
  portionNutrition,
  portionOptions,
  toStoredPortion,
  type PortionChoice,
  type StoredPortion,
} from '@/lib/nutrition/portion';
import type { FoodDetail } from '@/types';
import { formatQuantity, parseQuantity } from '@/utils/quantity';

interface PortionState {
  foodId: string;
  choice: PortionChoice;
  amountText: string;
}

function initialState(food: FoodDetail, initial?: StoredPortion | null): PortionState {
  if (initial) {
    const { choice, amount } = fromStoredPortion(food, initial);
    return { foodId: food.id, choice, amountText: formatQuantity(amount) };
  }
  const choice: PortionChoice = { kind: 'serving', servingId: defaultServing(food).id };
  return { foodId: food.id, choice, amountText: formatQuantity(defaultAmount(food, choice)) };
}

/**
 * Editor state for "how much did you eat": the chosen serving or unit, the
 * typed amount, and everything derived from them — what gets stored, the
 * nutrition it works out to, and any validation message.
 */
export function usePortion(food: FoodDetail | undefined, initial?: StoredPortion | null) {
  const [state, setState] = useState<PortionState | null>(null);

  // Initialize (or re-initialize) once the food is known — during render, so there's no empty first frame.
  let current = state;
  if (food && current?.foodId !== food.id) {
    current = initialState(food, initial);
    setState(current);
  }

  const options = food ? portionOptions(food) : [];
  const choice = current?.choice ?? null;
  const amount = current ? parseQuantity(current.amountText) : null;
  const limit = choice ? maxAmount(choice) : 0;
  const stored = food && choice && amount !== null && amount <= limit ? toStoredPortion(food, choice, amount) : null;
  const serving = stored && food ? food.servings.find((candidate) => candidate.id === stored.servingId) : undefined;

  let error: string | null = null;
  if (current && amount === null) error = 'Enter an amount, like 1 or 1.5.';
  else if (amount !== null && amount > limit) error = `That’s more than ${formatQuantity(limit)} — check the amount.`;

  const setAmountText = (text: string) => {
    setState((previous) => (previous ? { ...previous, amountText: text.replace(/[^0-9.,/ ]/g, '') } : previous));
  };

  const selectChoice = (key: string) => {
    if (!food || !current) return;
    const next = options.find((option) => choiceKey(option.choice) === key)?.choice;
    if (!next) return;
    // Switching to grams keeps the same amount of food; picking a serving starts at one of it.
    let nextAmount = defaultAmount(food, next);
    if (next.kind === 'metric' && serving?.metricUnit === next.unit && serving.metricAmount && stored) {
      nextAmount = Math.round(serving.metricAmount * stored.servings);
    }
    setState({ foodId: food.id, choice: next, amountText: formatQuantity(nextAmount) });
  };

  const step = (direction: 1 | -1) => {
    if (!choice) return;
    const size = choice.kind === 'serving' ? 0.5 : 10;
    const base = amount ?? 0;
    const next = Math.min(Math.max(Math.round((base + direction * size) * 100) / 100, size), limit);
    // The stepper button gives the tap; the hook only changes the number.
    setAmountText(formatQuantity(next));
  };

  return {
    options: options.map((option) => ({ value: choiceKey(option.choice), label: option.label })),
    selectedKey: choice ? choiceKey(choice) : '',
    choice,
    amountText: current?.amountText ?? '',
    amountSuffix: choice?.kind === 'metric' ? choice.unit : amount === 1 ? 'serving' : 'servings',
    setAmountText,
    selectChoice,
    step,
    stored,
    nutrition: serving && stored ? portionNutrition(serving, stored.servings) : null,
    description: serving && stored ? describePortion(serving, stored.servings, stored.amountUnit) : null,
    error,
  };
}

export type PortionController = ReturnType<typeof usePortion>;
