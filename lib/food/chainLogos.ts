import type { ImageSourcePropType } from 'react-native';

/**
 * The chains the app features, in the order they're shown, and their logos.
 * Logos live in assets/logos as 256 px white tiles. A chain without one
 * falls back to a monogram tile (see components/food/ChainLogo.tsx).
 */

const LOGOS: Record<string, ImageSourcePropType> = {
  "McDonald's": require('@/assets/logos/mcdonalds.png'),
  'Chick-fil-A': require('@/assets/logos/chick-fil-a.png'),
  'Chipotle Mexican Grill': require('@/assets/logos/chipotle.png'),
  Starbucks: require('@/assets/logos/starbucks.png'),
  'Taco Bell': require('@/assets/logos/taco-bell.png'),
  "Dunkin'": require('@/assets/logos/dunkin.png'),
  "Wendy's": require('@/assets/logos/wendys.png'),
  'Burger King': require('@/assets/logos/burger-king.png'),
  Subway: require('@/assets/logos/subway.png'),
  'Panda Express': require('@/assets/logos/panda-express.png'),
  "Domino's": require('@/assets/logos/dominos.png'),
  'Panera Bread': require('@/assets/logos/panera-bread.png'),
  Popeyes: require('@/assets/logos/popeyes.png'),
  KFC: require('@/assets/logos/kfc.png'),
  'Sonic Drive-In': require('@/assets/logos/sonic.png'),
  'Pizza Hut': require('@/assets/logos/pizza-hut.png'),
  'Dairy Queen': require('@/assets/logos/dairy-queen.png'),
  Wingstop: require('@/assets/logos/wingstop.png'),
  "Arby's": require('@/assets/logos/arbys.png'),
  'Little Caesars': require('@/assets/logos/little-caesars.png'),
  "Papa John's": require('@/assets/logos/papa-johns.png'),
  Jamba: require('@/assets/logos/jamba.png'),
  'Insomnia Cookies': require('@/assets/logos/insomnia-cookies.png'),
  Freshens: require('@/assets/logos/freshens.png'),
  "Hangry Joe's": require('@/assets/logos/hangry-joes.png'),
  "Jersey Mike's": require('@/assets/logos/jersey-mikes.png'),
  "Raising Cane's": require('@/assets/logos/raising-canes.png'),
  "Auntie Anne's": require('@/assets/logos/auntie-annes.png'),
  "Applebee's": require('@/assets/logos/applebees.png'),
  '7-Eleven': require('@/assets/logos/7-eleven.png'),
  Wawa: require('@/assets/logos/wawa.png'),
  '7 Brew': require('@/assets/logos/7-brew.png'),
};

/** Browse order: the biggest chains first, campus favourites last. */
export const FEATURED_CHAINS: readonly string[] = [
  "McDonald's",
  'Chick-fil-A',
  'Chipotle Mexican Grill',
  'Starbucks',
  'Taco Bell',
  "Dunkin'",
  "Wendy's",
  'Burger King',
  'Subway',
  'Panda Express',
  "Domino's",
  'Panera Bread',
  'Popeyes',
  "Raising Cane's",
  'KFC',
  "Jersey Mike's",
  'Sonic Drive-In',
  'Pizza Hut',
  'Dairy Queen',
  'Wingstop',
  "Arby's",
  'Little Caesars',
  "Papa John's",
  'Jamba',
  'Insomnia Cookies',
  'Freshens',
  "Hangry Joe's",
  'Wawa',
  '7 Brew',
  '7-Eleven',
  "Applebee's",
  "Auntie Anne's",
];

/**
 * Whether chains show their trademarked logos or a monogram tile. Off for
 * the App Store build until permission to use the logos is in hand; flip
 * to true to bring the logos back everywhere at once.
 */
export const SHOW_CHAIN_LOGOS = false;

export function chainLogo(chain: string | null | undefined): ImageSourcePropType | null {
  return SHOW_CHAIN_LOGOS && chain ? (LOGOS[chain] ?? null) : null;
}

/** Short display names for tight spaces: "Chipotle" rather than "Chipotle Mexican Grill". */
const SHORT_NAMES: Record<string, string> = {
  'Chipotle Mexican Grill': 'Chipotle',
  'Sonic Drive-In': 'Sonic',
  'Panera Bread': 'Panera',
};

export function shortChainName(chain: string): string {
  return SHORT_NAMES[chain] ?? chain;
}
