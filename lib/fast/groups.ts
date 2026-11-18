/**
 * The kinds of food a fast can set aside, and how a food's name is matched
 * to them. This is a reading of the name, nothing more: it can miss a food
 * or flag one wrongly, so the app only ever says "this looks like…" and
 * never stops anything being logged.
 */

export type FastGroup = 'meat' | 'fish' | 'dairy' | 'eggs' | 'sweets' | 'alcohol';

export const FAST_GROUPS: readonly { id: FastGroup; label: string; detail: string }[] = [
  { id: 'meat', label: 'Meat', detail: 'beef, chicken, pork, turkey, lamb' },
  { id: 'fish', label: 'Fish & seafood', detail: 'fish, shrimp, tuna, sushi' },
  { id: 'dairy', label: 'Dairy', detail: 'milk, cheese, yogurt, butter' },
  { id: 'eggs', label: 'Eggs', detail: 'eggs, omelets' },
  { id: 'sweets', label: 'Sweets', detail: 'candy, dessert, soda' },
  { id: 'alcohol', label: 'Alcohol', detail: 'beer, wine, spirits' },
];

export function isFastGroup(value: unknown): value is FastGroup {
  return FAST_GROUPS.some((group) => group.id === value);
}

export function groupLabel(group: FastGroup): string {
  return FAST_GROUPS.find((item) => item.id === group)?.label ?? group;
}

const words = (list: string): RegExp => new RegExp(`\\b(${list})\\b`, 'i');

/** A word that means the whole food is not in the group after all: a "veggie burger" is not meat. */
const CLEARS: Partial<Record<FastGroup, RegExp>> = {
  meat: words('veggie|vegetarian|vegan|plant[- ]based|meatless|meat[- ]free|impossible|beyond|tofu|tempeh|seitan|bean burgers?|chicken[- ]?less'),
  fish: words('vegan|fish[- ]free'),
  dairy: words('vegan|dairy[- ]free|non[- ]?dairy'),
  eggs: words('vegan|egg[- ]free|eggless'),
  sweets: words('sugar[- ]free|unsweetened'),
  alcohol: words('non[- ]?alcoholic|alcohol[- ]free'),
};

/** Phrases that contain a group's word without being the thing: taken out before looking. */
const LOOKALIKES: Partial<Record<FastGroup, RegExp>> = {
  meat: /\b(beefsteak tomato(es)?|steak fries|steak sauce|chicken of the woods|(hamburger|hot dog|burger) buns?|turkey tail|duck sauce)\b/gi,
  fish: /\b(goldfish|swedish fish)\b/gi,
  dairy: /\b((almond|oat|soy|coconut|rice|cashew|pea|hemp|macadamia) ?milk|(peanut|almond|cashew|sunflower|nut|apple|cocoa|seed|cookie) butter|butter ?(lettuce|beans?|squash)|butternut|buttercup|coconut cream|cream of (wheat|tartar)|cream soda|milk of magnesia)\b/gi,
  eggs: /\b(eggplants?|egg ?noodles?)\b/gi,
  sweets: /\b(sweet potato(es)?|sweet (corn|peppers?|onions?|peas)|club soda|soda water|baking soda|(rice|crab|fish|pan)[ -]?cakes?|pot ?pies?|shepherd'?s pie|pizza pie)\b/gi,
  alcohol: /\b(root beer|ginger (beer|ale)|beer[- ]batter(ed)?|wine vinegar|rum raisin|vodka sauce|gin(ger|seng))\b/gi,
};

const IS: Record<FastGroup, RegExp> = {
  meat: words(
    'meat|meats|meatballs?|meatloaf|beef|steaks?|sirloin|ribeye|brisket|barbacoa|carne asada|carnitas|al pastor|chorizo|burgers?|cheeseburgers?|hamburgers?|big mac|whopper|quarter pounder|chicken|pollo|nuggets?|mcnuggets?|tenders?|wings?|drumsticks?|turkey|pork|bacon|ham|prosciutto|pancetta|sausages?|bratwurst|kielbasa|hot ?dogs?|pepperoni|salami|bologna|pastrami|corned beef|jerky|lamb|mutton|gyros?|veal|duck|venison|bison|goat|ribs|rib|pulled pork|cheesesteaks?|philly steak|roast beef|cold cuts?|deli meat|spam|liver|oxtail|shawarma|kebabs?|kabobs?|souvlaki|teriyaki chicken|orange chicken|blt|club sandwich|italian sub|meat lovers'
  ),
  fish: words('fish|seafood|salmon|tuna|cod|tilapia|halibut|trout|mahi|catfish|sardines?|anchov(y|ies)|mackerel|herring|shrimp|prawns?|crab|lobster|crawfish|clams?|oysters?|mussels?|scallops?|calamari|squid|octopus|sushi|sashimi|poke|ceviche|caviar|lox|filet[- ]o[- ]fish|fish sticks?'),
  dairy: words('milk|milkshakes?|cheese|cheddar|mozzarella|parmesan|provolone|swiss|feta|ricotta|brie|gouda|queso|paneer|yogurt|yoghurt|kefir|butter|ghee|cream|creamer|ice cream|gelato|custard|whey|casein|latte|cappuccino|mocha|frappuccino|alfredo|mac and cheese|mac & cheese|cheesecake|pizza|quesadillas?|sour cream|cottage cheese|half and half'),
  eggs: words('eggs?|omelets?|omelettes?|frittata|quiche|scramble|mayonnaise|mayo|meringue|egg salad|eggnog|french toast|deviled'),
  sweets: words('candy|candies|chocolates?|cookies?|cakes?|cupcakes?|brownies?|donuts?|doughnuts?|pastry|pastries|pie|pies|ice cream|gelato|sundaes?|milkshakes?|frosting|fudge|caramel|gummies|gummy|lollipops?|marshmallows?|syrup|soda|cola|coke|pepsi|sprite|mountain dew|dr pepper|sweets?|dessert|churros?|cinnamon rolls?|pop[- ]?tarts?|skittles|m&ms?|snickers|twix|oreos?|kit ?kat'),
  alcohol: words('beer|lager|ale|ipa|stout|wine|champagne|prosecco|sake|vodka|whiskey|whisky|bourbon|rum|gin|tequila|mezcal|brandy|cognac|liqueur|cocktails?|margaritas?|mojitos?|martinis?|sangria|hard seltzer|white claw|truly|cider|mimosas?|spritz'),
};

/** Whether a food's name reads as belonging to a group. */
export function nameInGroup(name: string, group: FastGroup): boolean {
  if (CLEARS[group]?.test(name)) return false;
  const lookalikes = LOOKALIKES[group];
  return IS[group].test(lookalikes ? name.replace(lookalikes, ' ') : name);
}
