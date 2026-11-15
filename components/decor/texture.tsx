import React, { useMemo } from 'react';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useAppTheme } from '@/contexts/ThemeContext';
import { round, seeded } from './random';

/** Collage textures: grid, halftone, checker, scribble, splatter, slash. All decoration, all hidden from screen readers. */

const hidden = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const;

interface TextureProps {
  width: number;
  height: number;
  color?: string;
  opacity?: number;
}

/** A fine drafting grid that fades out toward its edges, as if printed on the dark. */
export function GridPatch({ width, height, color, opacity = 1, cell = 14 }: TextureProps & { cell?: number }) {
  const { colors } = useAppTheme();
  const ink = color ?? colors.inkFaint;
  const columns = Math.floor(width / cell);
  const rows = Math.floor(height / cell);
  return (
    <Svg width={width} height={height} opacity={opacity} {...hidden}>
      <Defs>
        <RadialGradient id="grid-fade" cx="50%" cy="50%" r="50%" fx="50%" fy="50%" gradientUnits="objectBoundingBox">
          <Stop offset="0" stopColor={colors.background} stopOpacity={0} />
          <Stop offset="0.7" stopColor={colors.background} stopOpacity={0.35} />
          <Stop offset="1" stopColor={colors.background} stopOpacity={1} />
        </RadialGradient>
      </Defs>
      {Array.from({ length: columns + 1 }, (_, index) => (
        <Line key={`v${index}`} x1={index * cell} x2={index * cell} y1={0} y2={height} stroke={ink} strokeWidth={0.6} />
      ))}
      {Array.from({ length: rows + 1 }, (_, index) => (
        <Line key={`h${index}`} x1={0} x2={width} y1={index * cell} y2={index * cell} stroke={ink} strokeWidth={0.6} />
      ))}
      <Rect x={0} y={0} width={width} height={height} fill="url(#grid-fade)" />
    </Svg>
  );
}

/** Halftone dots thinning out from one corner, like a cheap print fading. */
export function Halftone({ width, height, color, opacity = 1, step = 9 }: TextureProps & { step?: number }) {
  const { colors } = useAppTheme();
  const dots = useMemo(() => {
    const list: { x: number; y: number; r: number }[] = [];
    for (let row = 0; row * step < height; row++) {
      for (let column = 0; column * step < width; column++) {
        const x = column * step + (row % 2 ? step / 2 : 0);
        const y = row * step;
        const falloff = 1 - Math.hypot(x / width, y / height) / 1.2;
        if (falloff > 0.12) list.push({ x, y, r: round(falloff * step * 0.34) });
      }
    }
    return list;
  }, [height, step, width]);
  return (
    <Svg width={width} height={height} opacity={opacity} {...hidden}>
      {dots.map((dot, index) => (
        <Circle key={index} cx={dot.x} cy={dot.y} r={dot.r} fill={color ?? colors.inkFaint} />
      ))}
    </Svg>
  );
}

/** A strip of checkerboard, two squares deep. */
export function CheckerStrip({ width, color, opacity = 1, square = 6 }: Omit<TextureProps, 'height'> & { square?: number }) {
  const { colors } = useAppTheme();
  const count = Math.ceil(width / square);
  return (
    <Svg width={width} height={square * 2} opacity={opacity} {...hidden}>
      {Array.from({ length: count }, (_, index) => (
        <Rect key={index} x={index * square} y={index % 2 ? square : 0} width={square} height={square} fill={color ?? colors.ink} />
      ))}
    </Svg>
  );
}

/** A loose, looping pen scribble. A different `seed` gives a different tangle. */
export function scribblePath(width: number, height: number, seed: number, loops = 7): { d: string; length: number } {
  const next = seeded(seed);
  const cx = width / 2;
  const cy = height / 2;
  const phase = next() * Math.PI * 2;
  const wobble = 0.35 + next() * 0.4;
  const drift = 1 + Math.floor(next() * 3);
  const steps = loops * 18;
  let d = '';
  let length = 0;
  let px = 0;
  let py = 0;
  for (let index = 0; index <= steps; index++) {
    const t = (index / steps) * Math.PI * 2 * loops;
    const reach = 0.42 * (0.55 + 0.45 * Math.sin(t * wobble + phase));
    const x = round(cx + Math.cos(t + phase) * width * reach + Math.sin(t * drift * 0.31) * width * 0.06);
    const y = round(cy + Math.sin(t * 1.13) * height * reach + Math.cos(t * 0.47 + phase) * height * 0.06);
    d += index === 0 ? `M${x} ${y}` : ` L${x} ${y}`;
    if (index > 0) length += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return { d, length: Math.ceil(length) };
}

export function Scribble({ width, height, color, opacity = 1, seed = 1, loops = 7, strokeWidth = 0.8 }: TextureProps & { seed?: number; loops?: number; strokeWidth?: number }) {
  const { colors } = useAppTheme();
  const { d } = useMemo(() => scribblePath(width, height, seed, loops), [width, height, seed, loops]);
  return (
    <Svg width={width} height={height} opacity={opacity} {...hidden}>
      <Path d={d} stroke={color ?? colors.inkFaint} strokeWidth={strokeWidth} strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/** Flecks of ink thrown from one point. */
export function splatterDots(seed: number, count = 14): { x: number; y: number; r: number }[] {
  const next = seeded(seed);
  return Array.from({ length: count }, () => {
    const angle = next() * Math.PI * 2;
    const reach = next() ** 0.6 * 46;
    return { x: round(50 + Math.cos(angle) * reach), y: round(50 + Math.sin(angle) * reach), r: round(0.6 + (1 - reach / 46) * next() * 5.5) };
  });
}

export function Splatter({ size = 60, color, opacity = 1, seed = 1, count = 14 }: { size?: number; color?: string; opacity?: number; seed?: number; count?: number }) {
  const { colors } = useAppTheme();
  const dots = useMemo(() => splatterDots(seed, count), [seed, count]);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" opacity={opacity} {...hidden}>
      <G>
        {dots.map((dot, index) => (
          <Circle key={index} cx={dot.x} cy={dot.y} r={dot.r} fill={color ?? colors.accent} />
        ))}
      </G>
    </Svg>
  );
}

/** Thin tapered slivers of light on the diagonal, like claw marks of a pen. */
export function SlashStreak({ size = 90, color, opacity = 1, count = 2 }: { size?: number; color?: string; opacity?: number; count?: number }) {
  const { colors } = useAppTheme();
  const ink = color ?? colors.ink;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" opacity={opacity} {...hidden}>
      {Array.from({ length: count }, (_, index) => {
        const shift = index * 16;
        return <Path key={index} d={`M${4 + shift} ${96 - shift * 0.3} L${92 + shift * 0.2} ${6 + shift} L${94 + shift * 0.2} ${9 + shift} Z`} fill={ink} opacity={1 - index * 0.35} />;
      })}
    </Svg>
  );
}
