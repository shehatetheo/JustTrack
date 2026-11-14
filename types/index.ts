export type ISODateString = string;

export type ThemePreference = 'light' | 'dark' | 'system';
export type WeightUnit = 'lb' | 'kg';
export type HeightUnit = 'ft_in' | 'cm';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type WeightGoal = 'lose' | 'maintain' | 'gain';
/** Only used for the calorie estimate; "unspecified" is always an option. */
export type Sex = 'male' | 'female' | 'unspecified';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';
/** usda: the bundled USDA database · openfoodfacts: packaged foods · chain: a restaurant's menu · custom: typed in by hand · ai_estimate: the photo scanner. */
export type FoodSource = 'usda' | 'openfoodfacts' | 'chain' | 'custom' | 'ai_estimate';
/** How an amount was entered: a count of servings, or a metric weight/volume. */
export type AmountUnit = 'serving' | 'g' | 'ml';
export type MetricUnit = 'g' | 'ml';

export interface NutritionValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Nutrition anchored to the gram weight it was measured for (100 g, or one serving's grams). */
export interface NutritionBasis extends NutritionValues {
  referenceGrams: number;
}

// ---------------------------------------------------------------------------
// Foods
// ---------------------------------------------------------------------------

/** One way to measure a food, with the nutrition for exactly one of it. */
export interface FoodServing extends NutritionValues {
  id: string;
  /** e.g. "1 cup (248 g)", "100 g", "1 serving (30 g)". */
  description: string;
  /** Grams (or ml) in one serving, when known. */
  metricAmount: number | null;
  metricUnit: MetricUnit | null;
  isDefault: boolean;
}

/** A food from the bundled USDA database or Open Food Facts, ready to log. */
export interface FoodDetail {
  /** "usda:2705483" or "off:0894700010137". */
  id: string;
  source: 'usda' | 'openfoodfacts' | 'chain';
  /** The USDA FDC ID, the product barcode, or the menu item's id. */
  externalId: string;
  name: string;
  brand: string | null;
  /** A broad category used to tint the food's hero, e.g. "Fruits" or "Pizza". */
  category?: string | null;
  /** A product photo, when Open Food Facts has one. */
  imageUrl?: string | null;
  /** Pack size or variant that tells near-identical products apart, e.g. "150 g" or "5.3 oz cup". */
  detail?: string | null;
  servings: FoodServing[];
}

// ---------------------------------------------------------------------------
// The log
// ---------------------------------------------------------------------------

/**
 * One thing eaten. Entries live only on this device, and each carries
 * everything needed to show it — nothing is looked up later.
 */
export interface LogEntry extends NutritionValues {
  id: string;
  loggedAt: ISODateString;
  mealType: MealType;
  source: FoodSource;
  /** USDA FDC ID or barcode, when the food came from a database. */
  externalFoodId: string | null;
  /** Which of the food's servings the amount was measured in, so editing can reopen it. */
  externalServingId: string | null;
  foodName: string;
  brand: string | null;
  /** Servings eaten; gram entries are a fraction of a metric serving (1.5 × 100 g). */
  servings: number;
  amountUnit: AmountUnit;
  grams: number;
  /** Portion and nutrition came from the photo scanner, so the UI says "Estimated". */
  isEstimate: boolean;
  /** A small picture of this food: the user's own meal photo (as a data URL) or a product photo. */
  imageUri: string | null;
}

export type NewLogEntry = Omit<LogEntry, 'id' | 'loggedAt'>;

/** What the photo scanner found on the plate, before the user reviews it. */
export interface EstimatedFood extends NutritionValues {
  name: string;
  /** e.g. "about 1 cup", "half a plate". */
  portionDescription: string;
  estimatedGrams: number;
  /** 0–1, the model's own confidence in the identification. */
  confidence: number;
  /** The restaurant chain, when branding or a signature item made it recognizable. */
  chain: string | null;
}

export interface MealAnalysis {
  foods: EstimatedFood[];
  /** Anything worth telling the user, e.g. that part of the plate was hidden. */
  note: string | null;
}

// ---------------------------------------------------------------------------
// Settings (also local-only)
// ---------------------------------------------------------------------------

export interface MacroGoals {
  protein: number;
  carbs: number;
  fat: number;
}

/** interval: every 90 minutes through the day · meals: only at the mealtimes that are switched on. */
export type ReminderMode = 'interval' | 'meals';
export type ReminderMeal = 'breakfast' | 'lunch' | 'dinner';

/** "Log your food" nudges, scheduled on the device itself; nothing is sent from a server. */
export interface ReminderSettings {
  enabled: boolean;
  /** True once the user has answered the "want reminders?" prompt, so it stops asking on launch. */
  asked: boolean;
  mode: ReminderMode;
  /** Hour of the first nudge of the day in interval mode (24h clock). */
  startHour: number;
  meals: Record<ReminderMeal, boolean>;
}

export interface Settings {
  /** Shown after the first launch's welcome screen has been dismissed. */
  welcomed: boolean;
  displayName: string | null;
  calorieGoal: number;
  /** Gram targets; null means "show calorie shares only". */
  macroGoals: MacroGoals | null;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  reminders: ReminderSettings;
  /** The weight the user is working toward, if they set one. */
  goalWeightKg: number | null;
  /** When the welcome screen was finished; the fallback "last active" date before anything is logged. */
  welcomedAt: ISODateString | null;
  /** When the welcome-back slides were last shown, so one lapse gets one showing. */
  welcomeBackAt: ISODateString | null;
}

/** One weigh-in. There is at most one per calendar day; weighing again replaces it. */
export interface WeightEntry {
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  kg: number;
}
