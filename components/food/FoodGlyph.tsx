import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

import { useAppTheme } from '@/contexts/ThemeContext';
import { foodEmojiFor } from '@/lib/food/foodEmoji';

/**
 * A food's picture when there is no photo: one of fourteen small ink
 * drawings, chosen by the kind of food. The app's existing food matcher
 * names each food with an emoji; this groups those into kinds and draws the
 * kind in the collage's own ink, so nothing off-palette reaches the screen.
 */
export type FoodKind = 'fruit' | 'vegetable' | 'grain' | 'bowl' | 'meat' | 'fish' | 'dairy' | 'drink' | 'hot' | 'sweet' | 'handheld' | 'nuts' | 'jar' | 'plate';

const KIND_FOR: [FoodKind, string][] = [
  ['fruit', '🍎🍐🍊🍋🍌🍉🍇🍓🍒🍑🍍🥭🥝🫐🥥'],
  ['vegetable', '🥦🥬🥒🥕🥔🧅🫑🌽🍆🍄🥑🫛🍠🍅'],
  ['grain', '🍞🥐🥯🥨🥞🍚🍘🍿'],
  ['bowl', '🥣🍲🍜🍝🍛🥗🥟'],
  ['meat', '🍗🥩🥓'],
  ['fish', '🐟🍣🍤🦀'],
  ['dairy', '🥛🧀🧈🍳🍼'],
  ['drink', '🥤💧🍺🍸🍷'],
  ['hot', '☕🍵'],
  ['sweet', '🍰🍪🍩🍦🍫🍬'],
  ['handheld', '🍔🥪🍕🌮🌯🌭🍟'],
  ['nuts', '🥜🫘'],
  ['jar', '🫙🍯'],
];

export function foodKindFor(...descriptions: (string | null | undefined)[]): FoodKind {
  const emoji = foodEmojiFor(...descriptions);
  return KIND_FOR.find(([, set]) => set.includes(emoji))?.[0] ?? 'plate';
}

/** Each drawing on a 24-unit grid, as open pen lines. */
const DRAWINGS: Record<Exclude<FoodKind, 'plate'>, string[]> = {
  fruit: ['M12 8.2C8.6 5.6 4.5 8 4.5 12.6C4.5 17 8 20.5 10 20.5C11 20.5 11.4 20 12 20C12.6 20 13 20.5 14 20.5C16 20.5 19.5 17 19.5 12.6C19.5 8 15.4 5.6 12 8.2Z', 'M12 8.2C12 6 13 4.6 14.6 3.6'],
  vegetable: ['M5 19C5 11 10 5 19 5C19 14 13 19 5 19Z', 'M5 19L14 10', 'M9.5 14.5V10.8', 'M9.5 14.5H13.2'],
  grain: ['M5 10C5 7.2 8 6 12 6C16 6 19 7.2 19 10C19 11.2 18.3 12 17.5 12.3V18H6.5V12.3C5.7 12 5 11.2 5 10Z', 'M10 9.5V12', 'M14 9.5V12'],
  bowl: ['M3.5 11H20.5C20.5 16 17 19.5 12 19.5C7 19.5 3.5 16 3.5 11Z', 'M9 4.5C8 6 10 6.5 9 8', 'M13.5 4.5C12.5 6 14.5 6.5 13.5 8'],
  meat: ['M14.5 4C18 4 20 6.5 20 9.5C20 13 17 15 14 15C12.8 15 12 14.7 11.2 14.2L8 17.4C8.6 18.6 7.6 20 6.3 19.7C5.6 20.6 4 20.2 4 18.9C4 18 4.8 17.6 5.2 17.5C5 16.4 6 15.6 7 16L10 12.8C9.4 11.9 9 10.8 9 9.5C9 6.5 11 4 14.5 4Z'],
  fish: ['M3 12C6 7.5 12 6.5 16 9L20.5 6.5V17.5L16 15C12 17.5 6 16.5 3 12Z', 'M7.4 11.3V11.4'],
  dairy: ['M12 4C15.5 4 18.5 9.5 18.5 13.5C18.5 17.5 15.6 20 12 20C8.4 20 5.5 17.5 5.5 13.5C5.5 9.5 8.5 4 12 4Z', 'M9.3 12.5C9.3 10.9 10.2 9.6 11.2 8.8'],
  drink: ['M7 8H17L16 20H8Z', 'M5.8 8H18.2', 'M13 8L14.4 3.2H17'],
  hot: ['M5 9H16V15.5C16 18 14 19.5 11.5 19.5H9.5C7 19.5 5 18 5 15.5Z', 'M16 10.5H17.5C19 10.5 20 11.5 20 13C20 14.5 19 15.5 17.5 15.5H16', 'M8.5 4C7.5 5.3 9.5 5.7 8.5 7', 'M12.5 4C11.5 5.3 13.5 5.7 12.5 7'],
  sweet: ['M7 12H17L15.5 20H8.5Z', 'M6.5 12C5 9.5 7 7.5 9 8C9.5 5.4 14.5 5.4 15 8C17 7.5 19 9.5 17.5 12', 'M10.5 12L11 20', 'M13.5 12L13 20'],
  handheld: ['M4.5 11C4.5 7 8 5 12 5C16 5 19.5 7 19.5 11Z', 'M4 14H20', 'M5 17H19C19 18.7 17.7 19.5 16.5 19.5H7.5C6.3 19.5 5 18.7 5 17Z'],
  nuts: ['M8 5C12 4 15 7 14 10C13.4 11.8 15 12.5 16.5 13C19.5 14 19.5 19 15 19.5C10 20 5 16 5 10.5C5 8 6 5.5 8 5Z', 'M8.5 8.5C8 11 9.5 14.5 12.5 16'],
  jar: ['M8 4H16V7H8Z', 'M7 7H17C18 8 18.5 9 18.5 10.5V18C18.5 19.1 17.6 20 16.5 20H7.5C6.4 20 5.5 19.1 5.5 18V10.5C5.5 9 6 8 7 7Z', 'M8.5 12.5H15.5V16H8.5Z'],
};

interface FoodGlyphProps {
  kind: FoodKind;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function FoodGlyph({ kind, size = 24, color, strokeWidth = 1.5 }: FoodGlyphProps) {
  const { colors } = useAppTheme();
  const ink = color ?? colors.ink;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {kind === 'plate' ? (
        <>
          <Circle cx={12} cy={12} r={8} stroke={ink} strokeWidth={strokeWidth} fill="none" />
          <Circle cx={12} cy={12} r={4.5} stroke={ink} strokeWidth={strokeWidth * 0.7} fill="none" />
        </>
      ) : (
        DRAWINGS[kind].map((d) => <Path key={d} d={d} stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />)
      )}
    </Svg>
  );
}
