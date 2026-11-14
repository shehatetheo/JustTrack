import { DEFAULT_REMINDERS, DEFAULT_SETTINGS, parseSettings } from '../settingsStore';

describe('parseSettings', () => {
  it('falls back to defaults for anything missing or odd', () => {
    expect(parseSettings({})).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ calorieGoal: 'many', weightUnit: 'stone', macroGoals: { protein: -1 } })).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(42)).toBeNull();
  });

  it('keeps a sensible saved state and clamps the goal', () => {
    expect(parseSettings({ welcomed: true, displayName: '  Theo ', calorieGoal: 99999, macroGoals: { protein: 150, carbs: 250, fat: 70 }, weightUnit: 'kg', heightUnit: 'cm' })).toEqual({
      welcomed: true,
      displayName: 'Theo',
      calorieGoal: 6000,
      macroGoals: { protein: 150, carbs: 250, fat: 70 },
      weightUnit: 'kg',
      heightUnit: 'cm',
      reminders: DEFAULT_REMINDERS,
    });
    expect(parseSettings({ calorieGoal: 500 })?.calorieGoal).toBe(1200);
  });
});
