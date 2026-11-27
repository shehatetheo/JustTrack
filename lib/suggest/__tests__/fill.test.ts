import { bestPortion, fit, leadingMacro, macroTargets, MIN_ROOM, remainingFor, suggestFoods, suggestPlate, type Candidate } from '../fill';
import { amountLabel, pantryFoods, PANTRY_SIZE } from '../pantry';

const none = { calories: 0, protein: 0, carbs: 0, fat: 0 };
const pantry = () => pantryFoods().map((item) => item.candidate);

describe('what is left of the day', () => {
  it('uses the user’s own macro targets when they are set', () => {
    expect(macroTargets(2000, { protein: 150, carbs: 180, fat: 60 })).toEqual({ protein: 150, carbs: 180, fat: 60 });
  });

  it('falls back to a balanced split of the calorie goal', () => {
    expect(macroTargets(2000, null)).toEqual({ protein: 100, carbs: 250, fat: 67 });
  });

  it('never goes below zero', () => {
    expect(remainingFor(2000, null, { calories: 2300, protein: 140, carbs: 100, fat: 90 })).toEqual({ calories: 0, protein: 0, carbs: 150, fat: 0 });
  });
});

describe('the pantry', () => {
  it('finds every food and portion in the built-in database', () => {
    expect(pantryFoods()).toHaveLength(PANTRY_SIZE);
  });

  it('holds only foods with calories and at least one amount', () => {
    for (const { candidate } of pantryFoods()) {
      expect(candidate.unit.calories).toBeGreaterThan(0);
      expect(candidate.counts.length).toBeGreaterThan(0);
    }
  });
});

describe('amounts', () => {
  it('reads the way someone would say it', () => {
    expect(amountLabel(['egg', 'eggs'], 2)).toBe('2 eggs');
    expect(amountLabel(['egg', 'eggs'], 1)).toBe('1 egg');
    expect(amountLabel(['avocado', 'avocados'], 0.5)).toBe('½ avocado');
    expect(amountLabel(['cup, cooked', 'cups, cooked'], 1.5)).toBe('1½ cups, cooked');
    expect(amountLabel(['almond', 'almonds'], 20)).toBe('20 almonds');
  });
});

describe('fit', () => {
  it('rates a protein food above a starch when only protein is missing', () => {
    const left = { calories: 300, protein: 50, carbs: 5, fat: 3 };
    const chicken = { calories: 150, protein: 29, carbs: 0, fat: 4 };
    const rice = { calories: 200, protein: 4, carbs: 44, fat: 0.5 };
    expect(fit(chicken, left)).toBeGreaterThan(fit(rice, left));
    expect(fit(rice, left)).toBeLessThan(0.2);
  });

  it('names the macro a food is mostly made of', () => {
    expect(leadingMacro({ calories: 150, protein: 29, carbs: 0, fat: 4 })).toBe('protein');
    expect(leadingMacro({ calories: 200, protein: 4, carbs: 44, fat: 0.5 })).toBe('carbs');
    expect(leadingMacro({ calories: 240, protein: 3, carbs: 13, fat: 22 })).toBe('fat');
    expect(leadingMacro({ calories: 240, protein: 20, carbs: 22, fat: 8 })).toBe('balanced');
  });
});

describe('one food', () => {
  const eggs: Candidate = { id: 'eggs', name: 'Eggs', kind: 'protein', unit: { calories: 72, protein: 6.2, carbs: 0.5, fat: 5 }, counts: [2, 1, 3] };

  it('keeps the usual amount unless another is clearly better', () => {
    expect(bestPortion(eggs, { calories: 900, protein: 60, carbs: 100, fat: 30 })?.count).toBe(2);
  });

  it('drops to a smaller amount when the usual one does not fit', () => {
    expect(bestPortion(eggs, { calories: 100, protein: 20, carbs: 0, fat: 5 })?.count).toBe(1);
  });

  it('gives nothing when no amount fits', () => {
    expect(bestPortion(eggs, { calories: 30, protein: 20, carbs: 0, fat: 5 })).toBeNull();
  });
});

describe('suggestions', () => {
  it('offers nothing once the day is nearly full', () => {
    expect(suggestFoods(pantry(), { calories: MIN_ROOM - 1, protein: 40, carbs: 0, fat: 0 })).toEqual([]);
    expect(suggestFoods(pantry(), none)).toEqual([]);
  });

  it('never runs more than a few calories past what is left', () => {
    for (const calories of [120, 300, 650, 1400]) {
      const left = { calories, protein: 40, carbs: 80, fat: 20 };
      for (const pick of suggestFoods(pantry(), left, 6)) expect(pick.nutrition.calories).toBeLessThanOrEqual(calories + 25);
    }
  });

  it('leads with protein foods when protein is what is missing', () => {
    const picks = suggestFoods(pantry(), { calories: 400, protein: 70, carbs: 8, fat: 4 });
    expect(picks.length).toBeGreaterThan(0);
    expect(picks.slice(0, 2).every((pick) => pick.leads === 'protein')).toBe(true);
  });

  it('leads with carbs when carbs are what is missing', () => {
    const picks = suggestFoods(pantry(), { calories: 500, protein: 3, carbs: 110, fat: 3 });
    expect(picks[0].leads).toBe('carbs');
  });

  it('shows no more than two foods led by the same macro', () => {
    const picks = suggestFoods(pantry(), { calories: 1500, protein: 80, carbs: 190, fat: 50 }, 4);
    for (const lead of ['protein', 'carbs', 'fat', 'balanced']) expect(picks.filter((pick) => pick.leads === lead).length).toBeLessThanOrEqual(2);
  });

  it('shows no more than two foods of a kind', () => {
    const picks = suggestFoods(pantry(), { calories: 600, protein: 90, carbs: 10, fat: 10 }, 4);
    const kinds = picks.map((pick) => pick.candidate.kind);
    for (const kind of new Set(kinds)) expect(kinds.filter((item) => item === kind).length).toBeLessThanOrEqual(2);
  });

  it('moves on to different foods when shuffled', () => {
    const left = { calories: 900, protein: 60, carbs: 110, fat: 30 };
    const first = suggestFoods(pantry(), left, 4, 0).map((pick) => pick.candidate.id);
    const second = suggestFoods(pantry(), left, 4, 1).map((pick) => pick.candidate.id);
    expect(second).toHaveLength(4);
    expect(second.some((id) => first.includes(id))).toBe(false);
  });
});

describe('a plate', () => {
  it('puts a few different foods together within what is left', () => {
    const left = { calories: 700, protein: 50, carbs: 80, fat: 20 };
    const plate = suggestPlate(pantry(), left);
    expect(plate).not.toBeNull();
    expect(plate!.picks.length).toBeGreaterThanOrEqual(2);
    expect(new Set(plate!.picks.map((pick) => pick.candidate.id)).size).toBe(plate!.picks.length);
    expect(plate!.total.calories).toBeLessThanOrEqual(left.calories + 25);
    expect(plate!.total.calories).toBeGreaterThan(left.calories * 0.6);
    expect(plate!.picks[0].candidate.kind === 'protein' || plate!.picks[0].candidate.kind === 'legume').toBe(true);
  });

  it('stays the size of a meal when the whole day is still open', () => {
    const plate = suggestPlate(pantry(), { calories: 2000, protein: 100, carbs: 250, fat: 67 });
    expect(plate!.total.calories).toBeLessThanOrEqual(725);
    expect(plate!.total.calories).toBeGreaterThan(450);
  });

  it('is not offered when there is little room', () => {
    expect(suggestPlate(pantry(), { calories: 200, protein: 30, carbs: 10, fat: 5 })).toBeNull();
  });

  it('changes when shuffled', () => {
    const left = { calories: 800, protein: 60, carbs: 90, fat: 25 };
    expect(suggestPlate(pantry(), left, 0)!.picks[0].candidate.id).not.toBe(suggestPlate(pantry(), left, 1)!.picks[0].candidate.id);
  });
});
