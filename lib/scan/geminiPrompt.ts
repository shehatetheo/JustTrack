/**
 * What we ask Gemini, shared by the server function (api/analyze-meal.ts) and
 * the on-device path (lib/scan/geminiDirect.ts) so both get the same answers.
 * Keep this file free of imports: the server bundles it on its own.
 */

export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

export const SCAN_QUESTION = 'What food is in this photo, and roughly how much of each?';

export const SYSTEM_PROMPT = `You identify food in a photo for a calorie-tracking app used by college students.

List each distinct food you can actually see, largest portion first. For each, estimate the portion size as it appears (use plate, cutlery, and packaging for scale) and give nutrition for that portion using standard nutrition-database values for the most likely preparation. Combine components into the dish people would log ("Chicken burrito bowl") unless parts are clearly separate on the plate. Don't list foods that are hidden or merely plausible. If there's no food, return an empty list and say so in the note. Keep names short and specific.

Fast food: if a cup, wrapper, bag, box, or signature item shows which chain it's from, set "chain" to that chain and name the item the way its menu does (e.g. "Spicy Deluxe Sandwich", "Chicken Burrito Bowl", "Medium French Fries", "Grande Caramel Macchiato"), including size when visible. Chains to use exactly: McDonald's, Starbucks, Chick-fil-A, Taco Bell, Dunkin', Wendy's, Chipotle Mexican Grill, Burger King, Domino's, Subway, Panda Express, Panera Bread, Popeyes, Raising Cane's, Sonic Drive-In, Pizza Hut, Dairy Queen, Wingstop, KFC, Jersey Mike's, Arby's, Little Caesars, Papa John's, Jamba, Insomnia Cookies, Freshens, Hangry Joe's, Wawa, 7 Brew, 7-Eleven, Applebee's, Auntie Anne's. Don't guess a chain from the food alone.`;

/** The text path: the user types what they ate instead of photographing it. */
export const DESCRIBE_SYSTEM_PROMPT = `You turn a short description of what someone ate into a list of foods for a calorie-tracking app used by college students.

The user writes casually ("2 eggs and toast w butter, iced latte", "chipotle chicken bowl w guac", "half a large pepperoni pizza"). Split it into distinct foods, in the order written. For each, work out the portion: use any quantity the user gave (count, cups, ounces, "large", "half"); when none is given, assume the typical single serving a student would eat and say so in portionDescription (e.g. "1 medium banana", "about 1 cup", "1 slice"). Give the estimated weight in grams and the nutrition for that portion using standard nutrition data for that food as commonly prepared. Keep names short and specific ("Scrambled eggs", "Whole wheat toast with butter").

Fast food: if a restaurant chain is named or clearly implied, set "chain" to that chain (exactly as listed below) and name the item the way its menu does. Otherwise leave chain as an empty string.

Chains to use exactly: McDonald's, Starbucks, Chick-fil-A, Taco Bell, Dunkin', Wendy's, Chipotle Mexican Grill, Burger King, Domino's, Subway, Panda Express, Panera Bread, Popeyes, Raising Cane's, Sonic Drive-In, Pizza Hut, Dairy Queen, Wingstop, KFC, Jersey Mike's, Arby's, Little Caesars, Papa John's, Jamba, Insomnia Cookies, Freshens, Hangry Joe's, Wawa, 7 Brew, 7-Eleven, Applebee's, Auntie Anne's.

Put any assumption that changes the numbers in "note" in one short sentence (e.g. "Assumed a 16 oz latte with whole milk"). Ignore anything that is not food or drink. If nothing edible is described, return an empty list.`;

export const describeQuestion = (text: string) => `Here is what I ate: ${text}`;

/** Standard JSON Schema for the model's reply (no `$schema` marker: Gemini rejects it). */
export const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    foods: {
      type: 'array',
      maxItems: 12,
      description: 'Each distinct food visible, largest first. Empty if there is no food.',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Short, specific name as a person would say it, e.g. "Grilled chicken breast".' },
          portionDescription: { type: 'string', description: 'Plain-language portion, e.g. "about 1 cup" or "one slice".' },
          estimatedGrams: { type: 'number', description: 'Estimated weight of this portion in grams.' },
          confidence: { type: 'number', description: '0 to 1: how sure you are this food is what you think it is.' },
          chain: {
            type: 'string',
            description: 'The restaurant chain, exactly as listed in the instructions, when its branding, packaging, or a signature item is visible. Empty string otherwise.',
          },
          calories: { type: 'number', description: 'Calories in this portion.' },
          protein: { type: 'number', description: 'Grams of protein in this portion.' },
          carbs: { type: 'number', description: 'Grams of carbohydrate in this portion.' },
          fat: { type: 'number', description: 'Grams of fat in this portion.' },
        },
        required: ['name', 'portionDescription', 'estimatedGrams', 'confidence', 'chain', 'calories', 'protein', 'carbs', 'fat'],
        additionalProperties: false,
      },
    },
    note: { type: 'string', description: 'One short sentence the user should know, e.g. part of the plate is hidden. Empty string if nothing.' },
  },
  required: ['foods', 'note'],
  additionalProperties: false,
} as const;
