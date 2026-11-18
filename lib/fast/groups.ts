/**
 * The kinds of food a fast can set aside, and how a food's name is matched
 * to them. This is a reading of the name, nothing more: it can miss a food
 * or flag one wrongly, so the app only ever says "this looks like…" and
 * never stops anything being logged.
 */

export type FastGroup = 'soda' | 'candy' | 'chips' | 'snacks' | 'sweets' | 'meat' | 'fish' | 'dairy' | 'eggs' | 'alcohol';

/** `word` is what the label on a matching food says. The order here is the order they are checked in. */
export const FAST_GROUPS: readonly { id: FastGroup; label: string; detail: string; word: string }[] = [
  { id: 'soda', label: 'Soda', detail: 'cola, sprite, energy drinks', word: 'soda' },
  { id: 'candy', label: 'Candy', detail: 'candy bars, gummies, chocolate', word: 'candy' },
  { id: 'chips', label: 'Chips', detail: 'potato and tortilla chips, doritos', word: 'chips' },
  { id: 'snacks', label: 'Snack foods', detail: 'crackers, popcorn, cookies, pretzels', word: 'snack' },
  { id: 'sweets', label: 'Desserts', detail: 'cake, ice cream, donuts, pie', word: 'dessert' },
  { id: 'meat', label: 'Meat', detail: 'beef, chicken, pork, turkey, lamb', word: 'meat' },
  { id: 'fish', label: 'Fish & seafood', detail: 'fish, shrimp, tuna, sushi', word: 'fish' },
  { id: 'dairy', label: 'Dairy', detail: 'milk, cheese, yogurt, butter', word: 'dairy' },
  { id: 'eggs', label: 'Eggs', detail: 'eggs, omelets', word: 'eggs' },
  { id: 'alcohol', label: 'Alcohol', detail: 'beer, wine, spirits', word: 'alcohol' },
];

export function isFastGroup(value: unknown): value is FastGroup {
  return FAST_GROUPS.some((group) => group.id === value);
}

export function groupLabel(group: FastGroup): string {
  return FAST_GROUPS.find((item) => item.id === group)?.label ?? group;
}

/** The one word that names a group on a label or in a sentence: "soda", "snack", "meat". */
export function groupWord(group: FastGroup): string {
  return FAST_GROUPS.find((item) => item.id === group)?.word ?? group;
}

const words = (list: string): RegExp => new RegExp(`\\b(${list})\\b`, 'i');

/** A word that means the whole food is not in the group after all: a "veggie burger" is not meat. */
const CLEARS: Partial<Record<FastGroup, RegExp>> = {
  meat: words('veggie|vegetarian|vegan|plant[- ]based|meatless|meat[- ]free|impossible|beyond|tofu|tempeh|seitan|bean burgers?|chicken[- ]?less'),
  fish: words('vegan|fish[- ]free'),
  dairy: words('vegan|dairy[- ]free|non[- ]?dairy'),
  eggs: words('vegan|egg[- ]free|eggless'),
  alcohol: words('non[- ]?alcoholic|alcohol[- ]free'),
};

/** Phrases that contain a group's word without being the thing: taken out before looking. */
const LOOKALIKES: Partial<Record<FastGroup, RegExp>> = {
  meat: /\b(beefsteak tomato(es)?|steak fries|steak sauce|chicken of the woods|(hamburger|hot dog|burger) buns?|turkey tail|duck sauce)\b/gi,
  fish: /\b(goldfish|swedish fish)\b/gi,
  dairy: /\b((almond|oat|soy|coconut|rice|cashew|pea|hemp|macadamia) ?milk|(peanut|almond|cashew|sunflower|nut|apple|cocoa|seed|cookie) butter|butter ?(lettuce|beans?|squash)|butternut|buttercup|coconut cream|cream of (wheat|tartar)|cream soda|milk of magnesia)\b/gi,
  eggs: /\b(eggplants?|egg ?noodles?)\b/gi,
  soda: /\b(club soda|soda water|baking soda|soda bread|soda crackers?|coke oven)\b/gi,
  candy: /\b(candied (yams?|sweet potato(es)?|nuts?|pecans?|walnuts?|ginger)|cotton candy grapes?|hershey'?s (syrup|cocoa)|reese'?s puffs)\b/gi,
  chips: /\b(chocolate chips?|(chocolate|butterscotch|peanut butter|cinnamon|mint) chips|chips ahoy|fish (and|&|n|'n') chips|chipped beef|(pickles?|carrot|apple|kale|cucumber|zucchini) chips|\d+ chips|doritos (locos|cheesy gordita)[a-z ]*|doritos [a-z ]*sauce)\b/gi,
  snacks: /\b((graham )?cracker crust|cracker barrel|cookie (dough|butter)|cookies (and|&|n|'n') cream|popcorn (chicken|shrimp|cauliflower|tofu))\b/gi,
  sweets: /\b(sweet potato(es)?|(rice|crab|fish|pan|oat|corn|potato)[ -]?cakes?|pot ?pies?|shepherd'?s pie|pizza pie|cottage pie|pie crust|ice cream cones?, plain)\b/gi,
  alcohol: /\b(root beer|ginger (beer|ale)|beer[- ]batter(ed)?|wine vinegar|rum raisin|vodka sauce|gin(ger|seng))\b/gi,
};

const IS: Record<FastGroup, RegExp> = {
  meat: words(
    'meat|meats|meatballs?|meatloaf|beef|steaks?|sirloin|ribeye|brisket|barbacoa|carne asada|carnitas|al pastor|chorizo|burgers?|cheeseburgers?|hamburgers?|big mac|whopper|quarter pounder|chicken|pollo|nuggets?|mcnuggets?|tenders?|wings?|drumsticks?|turkey|pork|bacon|ham|prosciutto|pancetta|sausages?|bratwurst|kielbasa|hot ?dogs?|pepperoni|salami|bologna|pastrami|corned beef|jerky|lamb|mutton|gyros?|veal|duck|venison|bison|goat|ribs|rib|pulled pork|cheesesteaks?|philly steak|roast beef|cold cuts?|deli meat|spam|liver|oxtail|shawarma|kebabs?|kabobs?|souvlaki|teriyaki chicken|orange chicken|blt|club sandwich|italian sub|meat lovers'
  ),
  fish: words('fish|seafood|salmon|tuna|cod|tilapia|halibut|trout|mahi|catfish|sardines?|anchov(y|ies)|mackerel|herring|shrimp|prawns?|crab|lobster|crawfish|clams?|oysters?|mussels?|scallops?|calamari|squid|octopus|sushi|sashimi|poke|ceviche|caviar|lox|filet[- ]o[- ]fish|fish sticks?'),
  dairy: words('milk|milkshakes?|cheese|cheddar|mozzarella|parmesan|provolone|swiss|feta|ricotta|brie|gouda|queso|paneer|yogurt|yoghurt|kefir|butter|ghee|cream|creamer|ice cream|gelato|custard|whey|casein|latte|cappuccino|mocha|frappuccino|alfredo|mac and cheese|mac & cheese|cheesecake|pizza|quesadillas?|sour cream|cottage cheese|half and half'),
  eggs: words('eggs?|omelets?|omelettes?|frittata|quiche|scramble|mayonnaise|mayo|meringue|egg salad|eggnog|french toast|deviled'),
  soda: words("soda|sodas|soda pop|soft drinks?|cola|colas|coke|coca[- ]?cola|pepsi|sprite|fanta|mountain dew|mtn dew|dr\\.? ?pepper|7[- ]?up|root beer|ginger ale|cream soda|orange crush|sunkist|starry|sierra mist|mello yello|barq'?s|a&w|fresca|squirt|energy drinks?|red bull|monster energy|rockstar energy|celsius energy|bang energy"),
  candy: words("candy|candies|candy bars?|chocolate bars?|chocolates|(dark|milk|white|sweet|semisweet) chocolate|chocolate, (dark|milk|white|sweet|semisweet)|chocolate (candy|candies|truffles?|squares?)|chocolate[- ]covered|gummies|gummy|gummi|lollipops?|suckers?|jelly ?beans?|skittles|m&m'?s?|snickers|twix|kit ?kat|reese'?s|milky way|starburst|sour patch|haribo|twizzlers|jolly ranchers?|butterfinger|hershey'?s?|airheads|swedish fish|licorice|taffy|caramel (candy|candies|chews?|squares?)|chocolate truffles?|peanut butter cups?|candy corn|cotton candy|tootsie|life ?savers|mentos|ring pops?|laffy taffy|3 musketeers|almond joy|payday|baby ruth|mike and ike|hi[- ]chew|toffee (bars?|candy|bits)|bon ?bons?|marshmallows?|peeps|nerds|ferrero|lindt|ghirardelli|toblerone|kinder|dove chocolate|junior mints|whoppers|milk duds|sweet ?tarts|smarties|warheads|gum ?drops?|rock candy|peppermint (candy|candies|patty|patties)|york peppermint|heath bar"),
  chips: words("chips|doritos|cheetos|lay'?s|pringles|fritos|tostitos|ruffles|takis|sun ?chips|funyuns|cheese (puffs|curls|doodles)|pork rinds|veggie straws|pirate'?s booty|bugles|munchos|hot fries|corn nuts|nachos"),
  snacks: words("crackers?|popcorn|pretzels?|cookies?|oreos?|chips ahoy|cheez[- ]?its?|goldfish|ritz|triscuits?|wheat thins|fruit snacks|fruit roll[- ]?ups?|gushers|pop[- ]?tarts?|rice krispies treats?|snack (cakes?|mix|bars?|packs?)|twinkies?|little debbie|hostess|chex mix|trail mix|party mix|granola bars?|cereal bars?|nutri[- ]?grain bars?|animal crackers|teddy grahams|nilla wafers|combos|slim jims?|lunchables"),
  sweets: words('cakes?|cupcakes?|cheesecakes?|brownies?|blondies?|donuts?|doughnuts?|pastry|pastries|danish|pie|pies|cobbler|ice cream|gelato|sorbet|sherbet|froyo|frozen yogurt|sundaes?|milkshakes?|shakes|frosting|icing|churros?|cinnamon rolls?|pudding|custard|tiramisu|macarons?|eclairs?|cannoli|baklava|dessert|desserts|sweets|mcflurry|frosty|blizzard|funnel cake|popsicles?|ice pops?'),
  alcohol: words('beer|lager|ale|ipa|stout|wine|champagne|prosecco|sake|vodka|whiskey|whisky|bourbon|rum|gin|tequila|mezcal|brandy|cognac|liqueur|cocktails?|margaritas?|mojitos?|martinis?|sangria|hard seltzer|white claw|truly|cider|mimosas?|spritz'),
};

/** Whether a food's name reads as belonging to a group. */
export function nameInGroup(name: string, group: FastGroup): boolean {
  if (CLEARS[group]?.test(name)) return false;
  const lookalikes = LOOKALIKES[group];
  return IS[group].test(lookalikes ? name.replace(lookalikes, ' ') : name);
}
