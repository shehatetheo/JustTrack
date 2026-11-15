import React from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { useAppTheme } from '@/contexts/ThemeContext';

/**
 * Line ornaments drawn in collage ink: the wrought-iron and copperplate
 * vocabulary of the app. Each takes a size and an optional colour (the
 * theme's ink by default) and is hidden from screen readers.
 */

interface OrnamentProps {
  size?: number;
  color?: string;
  opacity?: number;
  strokeWidth?: number;
}

const hidden = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const;

/** The curled corner of a wrought-iron frame, for the top-left; rotate it for the others. */
export const FILIGREE_PATHS = [
  // The two rails meeting at a spike.
  'M3 62 V20 C3 10 10 3 20 3 H62',
  // The inner scroll, curling back on itself at both ends.
  'M10 54 C10 30 30 10 54 10 C61 10 62 19 56 20 C52 21 50 16 54 15',
  'M10 54 C10 61 19 62 20 56 C21 52 16 50 15 54',
  // A leaf springing from the scroll, and its vein.
  'M20 32 C22 24 26 21 33 19 C31 26 28 30 20 32 Z',
  'M21 31 L32 20',
  // The barb at the very corner.
  'M3 3 L13 7 L7 13 Z',
  // A diamond stud.
  'M36 36 L40 30 L44 36 L40 42 Z',
];

export function FiligreeCorner({ size = 56, color, opacity = 1, strokeWidth = 1.25 }: OrnamentProps) {
  const { colors } = useAppTheme();
  const ink = color ?? colors.ink;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" opacity={opacity} {...hidden}>
      {FILIGREE_PATHS.map((d, index) => (
        <Path key={index} d={d} stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={d.endsWith('Z') ? ink : 'none'} fillOpacity={0.9} />
      ))}
    </Svg>
  );
}

/** A copperplate flourish: one long pen stroke with a loop and a tail, as under a signature. */
export const FLOURISH_PATH = 'M4 30 C22 6 46 4 58 18 C68 30 54 44 44 36 C36 30 44 18 58 20 C84 24 96 44 128 40 C150 37 160 22 176 14 C168 26 160 40 150 46';
export const FLOURISH_LENGTH = 330;

export function Flourish({ size = 180, color, opacity = 1, strokeWidth = 1.2 }: OrnamentProps) {
  const { colors } = useAppTheme();
  return (
    <Svg width={size} height={(size * 52) / 180} viewBox="0 0 180 52" opacity={opacity} {...hidden}>
      <Path d={FLOURISH_PATH} stroke={color ?? colors.ink} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

/** A thorned stem, running left to right. */
export function ThornVine({ size = 200, color, opacity = 1, strokeWidth = 1.2 }: OrnamentProps) {
  const { colors } = useAppTheme();
  const ink = color ?? colors.ink;
  const thorns = [18, 44, 70, 96, 122, 148, 174];
  return (
    <Svg width={size} height={(size * 28) / 200} viewBox="0 0 200 28" opacity={opacity} {...hidden}>
      <Path d="M2 16 C22 4 38 24 60 14 C82 4 98 24 120 14 C142 4 158 24 198 12" stroke={ink} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
      {thorns.map((x, index) => (
        <Path key={x} d={index % 2 === 0 ? `M${x} 12 l3 -8 l3 9 Z` : `M${x} 17 l3 8 l3 -9 Z`} fill={ink} />
      ))}
    </Svg>
  );
}

/** A waning crescent. */
export const CRESCENT_PATH = 'M40 4 C20 6 6 22 6 40 C6 60 22 76 42 76 C52 76 61 72 67 65 C50 68 32 56 30 38 C28 24 34 10 40 4 Z';

export function Crescent({ size = 40, color, opacity = 1 }: OrnamentProps) {
  const { colors } = useAppTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80" opacity={opacity} {...hidden}>
      <Path d={CRESCENT_PATH} fill={color ?? colors.ink} />
    </Svg>
  );
}

/** A rose window: a ring of petals around a hub, as in a cathedral front. */
export function RoseWindow({ size = 64, color, opacity = 1, strokeWidth = 1.2, petals = 12 }: OrnamentProps & { petals?: number }) {
  const { colors } = useAppTheme();
  const ink = color ?? colors.ink;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" opacity={opacity} {...hidden}>
      <Circle cx={50} cy={50} r={47} stroke={ink} strokeWidth={strokeWidth * 1.4} fill="none" />
      <Circle cx={50} cy={50} r={41} stroke={ink} strokeWidth={strokeWidth * 0.8} fill="none" />
      <G>
        {Array.from({ length: petals }, (_, index) => (
          <Path key={index} d="M50 38 C44 28 44 16 50 10 C56 16 56 28 50 38 Z" stroke={ink} strokeWidth={strokeWidth} fill="none" transform={`rotate(${(360 / petals) * index} 50 50)`} />
        ))}
      </G>
      <Circle cx={50} cy={50} r={11} stroke={ink} strokeWidth={strokeWidth} fill="none" />
      <Circle cx={50} cy={50} r={4} fill={ink} />
    </Svg>
  );
}

/**
 * A pointed cathedral arch that frames whatever sits beneath it: two ribs
 * rising to a finial, with a trefoil in the peak. Drawn for the given width
 * and height, so it can be the hero's frame at any size.
 */
export function archPaths(width: number, height: number, inset = 0): { outer: string; inner: string; finial: string; length: number } {
  const rib = (pad: number) => {
    const left = pad;
    const right = width - pad;
    const spring = height * 0.52 + pad * 0.2;
    const top = pad + 14;
    return `M${left} ${height} V${spring} C${left} ${spring * 0.5} ${width * 0.3} ${top + height * 0.06} ${width / 2} ${top} C${width * 0.7} ${top + height * 0.06} ${right} ${spring * 0.5} ${right} ${spring} V${height}`;
  };
  const cx = width / 2;
  return {
    outer: rib(inset + 1),
    inner: rib(inset + 9),
    finial: `M${cx} ${inset + 14} L${cx - 4} ${inset + 7} L${cx} ${inset} L${cx + 4} ${inset + 7} Z`,
    length: height * 2 + width * 1.6,
  };
}
