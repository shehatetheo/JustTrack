import { finishAnalysis, matchRowToFood, resetReview, reviewStore, revertToEstimate, rowNutrition, startDescription, suggestionsFor } from '@/lib/scan/reviewStore';

describe('describing a meal', () => {
  beforeEach(() => resetReview());

  it('keeps the description and offers database matches next to each estimate', () => {
    startDescription('2 scrambled eggs and a banana');
    expect(reviewStore.getSnapshot()).toMatchObject({ status: 'analyzing', description: '2 scrambled eggs and a banana', photoUri: null });

    finishAnalysis({
      foods: [
        { name: 'Scrambled eggs', portionDescription: '2 eggs', estimatedGrams: 100, confidence: 0.95, chain: null, calories: 180, protein: 12, carbs: 2, fat: 14 },
        { name: 'Banana', portionDescription: '1 medium', estimatedGrams: 118, confidence: 0.95, chain: null, calories: 105, protein: 1.3, carbs: 27, fat: 0.3 },
      ],
      note: null,
    });
    const [eggs, banana] = reviewStore.getSnapshot().rows;
    expect(eggs.suggestions.length).toBeGreaterThan(0);
    expect(eggs.suggestions.every((food) => food.source === 'usda')).toBe(true);
    expect(banana.suggestions.some((food) => /banana/i.test(food.name))).toBe(true);
    expect(eggs.matchedFood).toBeNull();
    expect(eggs.estimate).toMatchObject({ grams: 100, name: 'Scrambled eggs', nutrition: { calories: 180 } });
  });

  it('switches a row to a database match and back to the estimate', () => {
    startDescription('a banana');
    finishAnalysis({ foods: [{ name: 'Banana', portionDescription: '1 medium', estimatedGrams: 118, confidence: 0.9, chain: null, calories: 105, protein: 1.3, carbs: 27, fat: 0.3 }], note: null });
    const row = reviewStore.getSnapshot().rows[0];
    const match = row.suggestions[0];

    matchRowToFood(row.id, match);
    const matched = reviewStore.getSnapshot().rows[0];
    expect(matched.matchedFood?.externalId).toBe(match.externalId);
    expect(matched.estimate.nutrition.calories).toBe(105);

    revertToEstimate(row.id);
    const reverted = reviewStore.getSnapshot().rows[0];
    expect(reverted.matchedFood).toBeNull();
    expect(reverted.name).toBe('Banana');
    expect(rowNutrition(reverted).calories).toBe(105);
  });

  it('prefers the named chain’s menu for suggestions', () => {
    startDescription('chipotle chicken bowl');
    finishAnalysis({ foods: [{ name: 'Chicken Burrito Bowl', portionDescription: '1 bowl', estimatedGrams: 500, confidence: 0.9, chain: 'Chipotle Mexican Grill', calories: 700, protein: 50, carbs: 60, fat: 25 }], note: null });
    const row = reviewStore.getSnapshot().rows[0];
    expect(suggestionsFor(row).some((food) => food.source === 'chain' && food.brand === 'Chipotle Mexican Grill')).toBe(true);
  });
});
