import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

import { APP_NAME, LOGO_LETTERS_BOX, LOGO_PATHS, LOGO_RING, LOGO_VIEWBOX } from '@/constants/brand';
import { useAppTheme } from '@/contexts/ThemeContext';

interface LogoProps {
  width?: number;
  /** The letters and ring. Defaults to the theme's ink: white on black, black on parchment. */
  color?: string;
  /** The star between the letters. Defaults to the theme's lavender. */
  starColor?: string;
  /** Draw the thin ring around the letters. Without it the letters fill the width. */
  ring?: boolean;
  /** Decorative uses pass false so screen readers skip it. */
  labelled?: boolean;
}

/** The JT monogram: blackletter J and T, the lavender star between them, and (by default) the ring. */
export function Logo({ width = 56, color, starColor, ring = true, labelled = true }: LogoProps) {
  const { colors } = useAppTheme();
  const ink = color ?? colors.text;
  const box = ring ? LOGO_VIEWBOX : LOGO_LETTERS_BOX;

  return (
    <Svg
      width={width}
      height={(width * box.height) / box.width}
      viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
      accessibilityRole={labelled ? 'image' : undefined}
      accessibilityLabel={labelled ? APP_NAME : undefined}
      accessibilityElementsHidden={!labelled}
      importantForAccessibility={labelled ? 'yes' : 'no-hide-descendants'}
    >
      {ring ? <Circle cx={LOGO_RING.cx} cy={LOGO_RING.cy} r={LOGO_RING.r} stroke={ink} strokeWidth={LOGO_RING.width} fill="none" /> : null}
      <Path d={LOGO_PATHS.letters} fill={ink} fillRule="evenodd" />
      <Path d={LOGO_PATHS.star} fill={starColor ?? colors.accent} fillRule="evenodd" />
    </Svg>
  );
}
