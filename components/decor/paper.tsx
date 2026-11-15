import React, { useMemo } from 'react';
import Svg, { G, Line, Path, Rect } from 'react-native-svg';

import { useAppTheme } from '@/contexts/ThemeContext';
import { round, seeded } from './random';

/** Paper ephemera tying the collage to food: barcodes and torn grocery receipts. */

const hidden = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const;

/** Bar positions and widths for a barcode `width` wide. */
export function barcodeBars(width: number, seed: number): { x: number; w: number }[] {
  const next = seeded(seed);
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  while (x < width) {
    const w = 1 + Math.floor(next() * 3);
    if (x + w > width) break;
    bars.push({ x: round(x), w });
    x += w + 1 + Math.floor(next() * 2.4);
  }
  return bars;
}

export function Barcode({ width = 72, height = 26, color, opacity = 1, seed = 4 }: { width?: number; height?: number; color?: string; opacity?: number; seed?: number }) {
  const { colors } = useAppTheme();
  const bars = useMemo(() => barcodeBars(width, seed), [width, seed]);
  return (
    <Svg width={width} height={height} opacity={opacity} {...hidden}>
      {bars.map((bar) => (
        <Rect key={bar.x} x={bar.x} y={0} width={bar.w} height={height} fill={color ?? colors.ink} />
      ))}
    </Svg>
  );
}

/**
 * A scrap torn from a till receipt: ragged at the top and bottom, a few
 * printed lines, a barcode at the foot. `paper` and `print` default to the
 * theme, so it is white paper on black and dark paper on parchment.
 */
export function ReceiptScrap({ width = 96, height = 124, paper, print, opacity = 1, seed = 2, tilt = -6 }: { width?: number; height?: number; paper?: string; print?: string; opacity?: number; seed?: number; tilt?: number }) {
  const { colors } = useAppTheme();
  const sheet = paper ?? colors.ink;
  const inkOnPaper = print ?? colors.background;
  const { outline, lines, bars } = useMemo(() => {
    const next = seeded(seed);
    const tooth = 6;
    let top = `M0 ${round(4 + next() * 3)}`;
    for (let x = tooth; x <= width; x += tooth) top += ` L${x} ${round(1 + next() * 6)}`;
    let bottom = '';
    for (let x = width; x >= 0; x -= tooth) bottom += ` L${x} ${round(height - 1 - next() * 6)}`;
    const rows = Array.from({ length: 5 }, (_, index) => ({ y: 20 + index * 13, w: round(width * (0.45 + next() * 0.4)) }));
    return { outline: `${top} L${width} ${height - 4}${bottom} Z`, lines: rows, bars: barcodeBars(width - 28, seed + 9) };
  }, [height, seed, width]);

  return (
    <Svg width={width} height={height} opacity={opacity} style={{ transform: [{ rotate: `${tilt}deg` }] }} {...hidden}>
      <Path d={outline} fill={sheet} />
      {lines.map((line) => (
        <G key={line.y}>
          <Line x1={10} x2={10 + line.w * 0.6} y1={line.y} y2={line.y} stroke={inkOnPaper} strokeWidth={1.4} opacity={0.55} />
          <Line x1={width - 24} x2={width - 10} y1={line.y} y2={line.y} stroke={inkOnPaper} strokeWidth={1.4} opacity={0.55} />
        </G>
      ))}
      <G x={14} y={height - 34}>
        {bars.map((bar) => (
          <Rect key={bar.x} x={bar.x} y={0} width={bar.w} height={18} fill={inkOnPaper} opacity={0.8} />
        ))}
      </G>
    </Svg>
  );
}
