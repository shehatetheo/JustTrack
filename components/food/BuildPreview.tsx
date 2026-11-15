import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useMotion } from '@/components/motion';
import { ThemedText } from '@/components/ui/ThemedText';
import { Duration, Springs } from '@/constants/motion';
import { HAIRLINE, INK, LAVENDER, LAVENDER_DEEP, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import type { Ingredient, Shape } from '@/lib/food/builders/visual';

interface BuildPreviewProps {
  shape: Shape;
  ingredients: Ingredient[];
  /** 0–1: how long a sub is. */
  length?: number;
}

const W = 240;
const H = 140;
const WHITE = '#FFFFFF';

/** Deterministic scatter so a topping lands in the same spots every render. */
function scatter(seed: string, n: number, box: Box): { x: number; y: number; r: number }[] {
  let state = 7;
  for (const char of seed) state = (state * 31 + char.charCodeAt(0)) >>> 0;
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  return Array.from({ length: n }, () => ({ x: box.x + next() * box.w, y: box.y + next() * box.h, r: next() }));
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function channels(hex: string): [number, number, number] {
  const full = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  const n = parseInt(full.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(from: string, to: string, amount: number): string {
  const a = channels(from);
  const b = channels(to);
  const blend = (index: number) => Math.round(a[index] + (b[index] - a[index]) * amount);
  return `#${((blend(0) << 16) | (blend(1) << 8) | blend(2)).toString(16).padStart(6, '0')}`;
}

/**
 * The drawing was made in full colour; the app is black, lavender and
 * white. This keeps how light or dark each colour is and throws the hue
 * away: strongly coloured things (greens, reds, sauces) become a shade of
 * lavender, everything else a shade between ink and white. The colours
 * written in this file are only ever inputs to this function.
 */
function mono(hex: string): string {
  const [r, g, b] = channels(hex);
  const light = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const max = Math.max(r, g, b);
  const vivid = max > 0 && (max - Math.min(r, g, b)) / max > 0.5;
  if (vivid) return light < 0.5 ? mix(mix(INK, LAVENDER_DEEP, 0.45), LAVENDER_DEEP, light * 2) : mix(LAVENDER_DEEP, LAVENDER, (light - 0.5) * 2);
  return mix(mix(INK, WHITE, 0.2), WHITE, Math.pow(light, 0.85));
}

/** Darken or lighten a hex color. */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const channel = (shift: number) => {
    const value = (n >> shift) & 255;
    const next = amount < 0 ? value * (1 + amount) : value + (255 - value) * amount;
    return Math.round(Math.max(0, Math.min(255, next)));
  };
  return `#${((channel(16) << 16) | (channel(8) << 8) | channel(0)).toString(16).padStart(6, '0')}`;
}

/** Where food sits and how it's clipped, per vessel. */
function fillArea(shape: Shape, length: number): { box: Box; clip: React.ReactNode } {
  switch (shape) {
    case 'bowl':
      return { box: { x: 34, y: 26, w: W - 68, h: 54 }, clip: <Ellipse cx={W / 2} cy={54} rx={92} ry={30} /> };
    case 'plate':
      return { box: { x: 44, y: 34, w: W - 88, h: 46 }, clip: <Ellipse cx={W / 2} cy={58} rx={82} ry={26} /> };
    case 'wrap':
      return { box: { x: 38, y: 50, w: 44, h: 44 }, clip: <Ellipse cx={60} cy={72} rx={23} ry={25} /> };
    case 'tacos':
      return { box: { x: 30, y: 38, w: W - 60, h: 34 }, clip: <Rect x={20} y={24} width={W - 40} height={52} rx={14} /> };
    default: {
      const span = W * length;
      return { box: { x: (W - span) / 2 + 10, y: 56, w: span - 20, h: 26 }, clip: <Rect x={(W - span) / 2 - 10} y={0} width={span + 20} height={94} /> };
    }
  }
}

/** One ingredient drawn in its style, inside the given area, as its own animated layer. */
function Layer({ ingredient, box, index, shape, clip }: { ingredient: Ingredient; box: Box; index: number; shape: Shape; clip: React.ReactNode }) {
  const { style, count, id } = ingredient;
  const color = mono(ingredient.color);
  const key = `g-${id}`;
  const { reduced } = useMotion();
  // Each ingredient pops into the dish as it is picked; a drizzle just fades in.
  const landed = useSharedValue(0);
  useEffect(() => {
    landed.set(withDelay(reduced ? 0 : index * 24, reduced || style === 'drizzle' ? withTiming(1, { duration: Duration.standard }) : withSpring(1, Springs.snappy)));
    // Pops once, when it mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const pop = useAnimatedStyle(() => ({ opacity: Math.min(landed.get() * 1.5, 1), transform: [{ scale: reduced || style === 'drizzle' ? 1 : 0.7 + landed.get() * 0.3 }] }));
  const lift = shape === 'sub' ? -index * 7 : -index * 1.5;
  const gradient = (
    <LinearGradient id={key} x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0" stopColor={shade(color, 0.22)} />
      <Stop offset="1" stopColor={shade(color, -0.22)} />
    </LinearGradient>
  );

  let body: React.ReactNode;
  if (shape === 'sub') {
    body = <SubBand ingredient={ingredient} box={box} index={index} gradientId={key} />;
  } else if (style === 'bed') {
    {
      const inset = 2 + index * 3;
      body = (
        <>
          <Ellipse cx={box.x + box.w / 2} cy={box.y + box.h / 2 + 2} rx={box.w / 2 - inset} ry={box.h / 2 - inset / 2} fill={`url(#${key})`} />
          {/* Grains / texture */}
          {scatter(`${id}-grain`, 18, { x: box.x + 14, y: box.y + 8, w: box.w - 28, h: box.h - 18 }).map((p, i) => (
            <Rect key={i} x={p.x} y={p.y} width={5} height={2.4} rx={1.2} fill={shade(color, i % 2 ? 0.35 : -0.18)} opacity={0.8} transform={`rotate(${(i * 47) % 180} ${p.x} ${p.y})`} />
          ))}
        </>
      );
    }
  } else if (style === 'drizzle') {
    const paths = scatter(`${id}-dz`, 3, { x: box.x + box.w * 0.15, y: box.y + box.h * 0.25, w: box.w * 0.55, h: box.h * 0.35 });
    body = paths.map((p, i) => {
      const span = Math.min(box.w * 0.42, 48 + i * 12);
      const d = `M${p.x} ${p.y} q${span * 0.25} ${-9 - i * 2} ${span * 0.5} 0 t${span * 0.5} ${4 + i}`;
      return (
        <G key={i}>
          <Path d={d} stroke={shade(color, -0.25)} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.6} />
          <Path d={d} stroke={color} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d={d} stroke={shade(color, 0.45)} strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.8} transform="translate(0 -1.2)" />
        </G>
      );
    });
  } else if (style === 'chunks') {
    const n = 5 * count;
    const points = scatter(`${id}-ch`, n, { x: box.x + box.w * 0.06, y: box.y + box.h * 0.1, w: box.w * 0.8, h: box.h * 0.55 });
    body = points.map((p, i) => {
      const w = 17 + (i % 3) * 4;
      const h = 12 + (i % 2) * 3;
      const rot = (i * 37) % 70 - 35;
      return (
        <G key={i} transform={`rotate(${rot} ${p.x + w / 2} ${p.y + h / 2})`}>
          <Rect x={p.x} y={p.y + 2} width={w} height={h} rx={5} fill={shade(color, -0.4)} opacity={0.5} />
          <Rect x={p.x} y={p.y} width={w} height={h} rx={5} fill={`url(#${key})`} stroke={shade(color, -0.3)} strokeWidth={0.8} />
          <Rect x={p.x + 3} y={p.y + 2} width={w * 0.5} height={3} rx={1.5} fill={shade(color, 0.5)} opacity={0.55} />
          {/* Char marks */}
          <Rect x={p.x + w * 0.55} y={p.y + h * 0.45} width={w * 0.3} height={1.6} rx={0.8} fill={shade(color, -0.55)} opacity={0.6} />
        </G>
      );
    });
  } else if (style === 'slices') {
    const points = scatter(`${id}-sl`, 5, { x: box.x + box.w * 0.08, y: box.y + box.h * 0.12, w: box.w * 0.78, h: box.h * 0.55 });
    body = points.map((p, i) => (
      <G key={i} transform={`rotate(${(i * 53) % 90 - 45} ${p.x} ${p.y})`}>
        <Ellipse cx={p.x} cy={p.y} rx={11} ry={4.2} fill={`url(#${key})`} stroke={shade(color, -0.3)} strokeWidth={0.7} />
        <Ellipse cx={p.x} cy={p.y - 0.6} rx={6} ry={1.4} fill={shade(color, 0.5)} opacity={0.55} />
      </G>
    ));
  } else if (style === 'shreds' || style === 'sheet') {
    const points = scatter(`${id}-sh`, 12, { x: box.x + box.w * 0.06, y: box.y + box.h * 0.08, w: box.w * 0.84, h: box.h * 0.6 });
    body = points.map((p, i) => (
      <G key={i} transform={`rotate(${(i * 41) % 140 - 70} ${p.x} ${p.y})`}>
        <Path d={`M${p.x - 8} ${p.y} q4 -3 8 0 t8 0`} stroke={shade(color, -0.25)} strokeWidth={3.4} fill="none" strokeLinecap="round" />
        <Path d={`M${p.x - 8} ${p.y} q4 -3 8 0 t8 0`} stroke={shade(color, 0.25)} strokeWidth={1.6} fill="none" strokeLinecap="round" transform="translate(0 -0.8)" />
      </G>
    ));
  } else {
    const points = scatter(`${id}-dt`, 9, { x: box.x + box.w * 0.08, y: box.y + box.h * 0.1, w: box.w * 0.8, h: box.h * 0.6 });
    body = points.map((p, i) => {
      const r = 3.6 + (i % 3) * 0.8;
      return (
        <G key={i}>
          <Circle cx={p.x} cy={p.y + 1} r={r} fill={shade(color, -0.45)} opacity={0.45} />
          <Circle cx={p.x} cy={p.y} r={r} fill={`url(#${key})`} />
          <Circle cx={p.x - r * 0.3} cy={p.y - r * 0.35} r={r * 0.32} fill={shade(color, 0.6)} opacity={0.7} />
        </G>
      );
    });
  }

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { top: lift }, pop]}>
      <Svg width={W} height={H}>
        <Defs>
          {gradient}
          <ClipPath id={`clip-${id}`}>{clip}</ClipPath>
        </Defs>
        <G clipPath={`url(#clip-${id})`}>{body}</G>
      </Svg>
    </Animated.View>
  );
}

/**
 * In a sandwich every ingredient is a full-width layer: meat folds in ribbons,
 * cheese drapes over the edges, lettuce ruffles, tomato and onion peek out in
 * a row, sauce runs along the top. Layers stack upward from the bottom roll.
 */
function SubBand({ ingredient, box, index, gradientId }: { ingredient: Ingredient; box: Box; index: number; gradientId: string }) {
  const { style, count } = ingredient;
  const color = mono(ingredient.color);
  const x0 = box.x;
  const x1 = box.x + box.w;
  const w = box.w;
  const y = box.y + box.h; // the layer's baseline, on top of the bottom roll
  const fill = `url(#${gradientId})`;
  const dark = shade(color, -0.3);
  const light = shade(color, 0.4);

  if (style === 'chunks') {
    // Folded ribbons of meat: a wavy strip, doubled when it's a double.
    const ribbons = count === 2 ? 3 : 2;
    return (
      <>
        {Array.from({ length: ribbons }, (_, r) => {
          const base = y - r * 4;
          const wave = Array.from({ length: 6 }, (_, k) => `q${w / 12} ${k % 2 ? 5 : -5} ${w / 6} 0`).join(' ');
          return (
            <G key={r}>
              <Path d={`M${x0 - 3} ${base} ${wave} v-9 M${x1 + 3} ${base - 9}`} fill="none" />
              <Path d={`M${x0 - 3} ${base} ${wave} v-9 ${Array.from({ length: 6 }, (_, k) => `q${-w / 12} ${k % 2 ? -5 : 5} ${-w / 6} 0`).join(' ')} Z`} fill={fill} stroke={dark} strokeWidth={0.8} />
              <Path d={`M${x0 + 4} ${base - 8} ${Array.from({ length: 6 }, (_, k) => `q${w / 12} ${k % 2 ? 4 : -4} ${w / 6 - 1.2} 0`).join(' ')}`} fill="none" stroke={light} strokeWidth={1.3} opacity={0.55} />
            </G>
          );
        })}
      </>
    );
  }
  if (style === 'sheet') {
    // A slice of cheese draped over the sides, corners hanging.
    return (
      <>
        <Path d={`M${x0 - 6} ${y - 2} L${x0 - 2} ${y + 9} L${x0 + 10} ${y + 1} H${x1 - 10} L${x1 + 2} ${y + 9} L${x1 + 6} ${y - 2} Z`} fill={shade(color, -0.2)} />
        <Path d={`M${x0 - 6} ${y - 2} H${x1 + 6} v-5 H${x0 - 6} Z`} fill={fill} />
        <Path d={`M${x0} ${y - 5.5} H${x1}`} stroke={light} strokeWidth={1.2} opacity={0.6} />
      </>
    );
  }
  if (style === 'shreds') {
    // Ruffled lettuce: overlapping leaf tips with a crinkle line in each, hanging past the edges.
    const n = Math.max(7, Math.round(w / 11));
    const step = (w + 10) / n;
    return (
      <>
        <Path d={`M${x0 - 4} ${y - 3} H${x1 + 4} v6 H${x0 - 4} Z`} fill={dark} />
        {Array.from({ length: n + 1 }, (_, k) => {
          const cx = x0 - 5 + k * step;
          const rx = 9 + (k % 3) * 1.5;
          const dy = (k % 2) * 3 - 1;
          return (
            <G key={k} transform={`rotate(${(k * 23) % 24 - 12} ${cx} ${y + dy})`}>
              <Ellipse cx={cx} cy={y + dy} rx={rx} ry={4.6} fill={k % 2 ? fill : shade(color, 0.12)} stroke={dark} strokeWidth={0.6} />
              <Path d={`M${cx - rx * 0.7} ${y + dy + 1} q${rx * 0.35} -4 ${rx * 0.7} -1 t${rx * 0.7} 0`} stroke={light} strokeWidth={1} fill="none" opacity={0.75} />
            </G>
          );
        })}
      </>
    );
  }
  if (style === 'slices' || (style === 'dots' && /tomato/i.test(ingredient.label))) {
    // A row of rounds peeking out between the layers.
    const n = Math.max(4, Math.round(w / 26));
    const step = w / n;
    const ring = /onion/i.test(ingredient.label);
    const flat = /bacon|pickle|pepper/i.test(ingredient.label);
    return (
      <>
        {Array.from({ length: n }, (_, k) => {
          const cx = x0 + step * (k + 0.5) + ((k % 2) - 0.5) * 4;
          const r = 8 + (k % 2) * 1.5;
          if (flat) {
            return (
              <G key={k} transform={`rotate(${(k * 29) % 30 - 15} ${cx} ${y})`}>
                <Rect x={cx - 11} y={y - 4} width={22} height={6} rx={3} fill={fill} stroke={dark} strokeWidth={0.7} />
                <Path d={`M${cx - 8} ${y - 1.5} q4 -2 8 0 t8 0`} stroke={light} strokeWidth={1.2} fill="none" opacity={0.7} />
              </G>
            );
          }
          return (
            <G key={k}>
              <Circle cx={cx} cy={y + 1} r={r} fill={ring ? 'none' : dark} stroke={ring ? dark : 'none'} strokeWidth={2.5} opacity={0.6} />
              <Circle cx={cx} cy={y - 1} r={r} fill={ring ? 'none' : fill} stroke={ring ? color : dark} strokeWidth={ring ? 2.6 : 0.7} />
              {ring ? null : <Circle cx={cx} cy={y - 1} r={r * 0.55} fill={light} opacity={0.55} />}
            </G>
          );
        })}
      </>
    );
  }
  if (style === 'drizzle') {
    const wave = Array.from({ length: 8 }, (_, k) => `q${w / 16} ${k % 2 ? 4 : -4} ${w / 8} 0`).join(' ');
    return (
      <>
        <Path d={`M${x0 + 2} ${y - 1} ${wave}`} stroke={dark} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.5} />
        <Path d={`M${x0 + 2} ${y - 2} ${wave}`} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
      </>
    );
  }
  if (style === 'dots') {
    const n = Math.max(6, Math.round(w / 14));
    return (
      <>
        {Array.from({ length: n }, (_, k) => {
          const cx = x0 + (w / n) * (k + 0.5);
          return <Circle key={k} cx={cx} cy={y - 2 + (k % 2) * 2} r={4} fill={fill} stroke={dark} strokeWidth={0.6} />;
        })}
      </>
    );
  }
  // bed: a spread along the roll
  return <Path d={`M${x0 - 2} ${y + 2} H${x1 + 2} v-6 Q${(x0 + x1) / 2} ${y - 9} ${x0 - 2} ${y - 4} Z`} fill={fill} />;
}

const BOWL = mono('#5B47D6');
const BREAD = mono('#E7B86B');

/** The dish before anything goes in: shadow and the body, with the opening dark and empty. */
function VesselBack({ shape, length }: { shape: Shape; length: number }) {
  const span = W * length;
  const x0 = (W - span) / 2;
  return (
    <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="v-bowl" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={shade(BOWL, 0.28)} />
          <Stop offset="0.55" stopColor={BOWL} />
          <Stop offset="1" stopColor={shade(BOWL, -0.38)} />
        </LinearGradient>
        <RadialGradient id="v-inside" cx="50%" cy="25%" rx="60%" ry="80%">
          <Stop offset="0" stopColor={shade(BOWL, -0.2)} />
          <Stop offset="1" stopColor={shade(BOWL, -0.62)} />
        </RadialGradient>
        <LinearGradient id="v-plate" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={mono('#FFFFFF')} />
          <Stop offset="1" stopColor={mono('#D8D1F2')} />
        </LinearGradient>
        <RadialGradient id="v-plate-well" cx="50%" cy="40%" rx="55%" ry="70%">
          <Stop offset="0" stopColor={mono('#FFFFFF')} />
          <Stop offset="1" stopColor={mono('#E6E1F8')} />
        </RadialGradient>
        <LinearGradient id="v-crust" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={shade(BREAD, 0.12)} />
          <Stop offset="1" stopColor={shade(BREAD, -0.32)} />
        </LinearGradient>
        <LinearGradient id="v-crumb" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={mono('#FBEFD6')} />
          <Stop offset="1" stopColor={mono('#F0DDB4')} />
        </LinearGradient>
        <LinearGradient id="v-tortilla" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={mono('#F6E2B8')} />
          <Stop offset="0.6" stopColor={mono('#E9C98F')} />
          <Stop offset="1" stopColor={mono('#C9A262')} />
        </LinearGradient>
        <LinearGradient id="v-shell" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={mono('#F3D27E')} />
          <Stop offset="1" stopColor={mono('#C9933A')} />
        </LinearGradient>
      </Defs>
      <Ellipse cx={W / 2} cy={H - 10} rx={shape === 'sub' ? span / 2 + 6 : 86} ry={8} fill={mono('#000000')} opacity={0.16} />

      {shape === 'bowl' ? (
        <>
          <Path d={`M26 54 C26 92 60 122 ${W / 2} 122 C${W - 60} 122 ${W - 26} 92 ${W - 26} 54 Z`} fill="url(#v-bowl)" />
          <Ellipse cx={W / 2} cy={54} rx={94} ry={28} fill="url(#v-inside)" />
          <Ellipse cx={W / 2} cy={54} rx={94} ry={28} fill="none" stroke={shade(BOWL, 0.45)} strokeWidth={2.5} opacity={0.6} />
        </>
      ) : null}

      {shape === 'plate' ? (
        <>
          <Ellipse cx={W / 2} cy={62} rx={110} ry={40} fill="url(#v-plate)" />
          <Ellipse cx={W / 2} cy={62} rx={110} ry={40} fill="none" stroke={mono('#B4A8E3')} strokeWidth={2} opacity={0.9} />
          <Ellipse cx={W / 2} cy={60} rx={84} ry={28} fill="url(#v-plate-well)" />
          <Ellipse cx={W / 2} cy={60} rx={84} ry={28} fill="none" stroke={mono('#D8D1F2')} strokeWidth={1.5} />
        </>
      ) : null}

      {shape === 'sub' ? (
        <>
          {/* Bottom half: crust, then the pale cut face the fillings sit on. */}
          <Path d={`M${x0 + 10} 84 H${x0 + span - 10} q12 0 12 14 q0 16 -14 16 H${x0 + 12} q-14 0 -14 -16 q0 -14 12 -14 Z`} fill="url(#v-crust)" />
          <Path d={`M${x0 + 8} 84 H${x0 + span - 8} q5 0 5 4 q0 4 -5 4 H${x0 + 8} q-5 0 -5 -4 q0 -4 5 -4 Z`} fill="url(#v-crumb)" />
          <Path d={`M${x0 + 16} 108 q${span / 2 - 16} 6 ${span - 32} 0`} stroke={mono('#FFFFFF')} strokeWidth={1.5} fill="none" opacity={0.18} strokeLinecap="round" />
        </>
      ) : null}

      {shape === 'wrap' ? (
        <>
          {/* Burrito on its side, cut end facing us. */}
          <Path d={`M60 46 H${W - 52} a28 28 0 0 1 0 52 H60 Z`} fill="url(#v-tortilla)" />
          <Path d={`M100 46 q10 26 0 52`} stroke={mono('#C9A262')} strokeWidth={2} fill="none" opacity={0.5} />
          <Path d={`M138 46 q-10 26 0 52`} stroke={mono('#C9A262')} strokeWidth={2} fill="none" opacity={0.5} />
          <Path d={`M172 48 q8 24 0 48`} stroke={mono('#C9A262')} strokeWidth={2} fill="none" opacity={0.4} />
          <Ellipse cx={60} cy={72} rx={26} ry={28} fill={mono('#F3DDB0')} />
          <Ellipse cx={60} cy={72} rx={23} ry={25} fill={mono('#D9B98A')} />
        </>
      ) : null}

      {shape === 'tacos'
        ? [0, 1, 2].map((i) => (
            <G key={i} transform={`translate(${44 + i * 56} 0) rotate(${-6 + i * 6} 28 70)`}>
              <Path d="M0 60 a28 28 0 0 1 56 0 V70 a28 36 0 0 1 -56 0 Z" fill="url(#v-shell)" opacity={0.55} />
            </G>
          ))
        : null}
    </Svg>
  );
}

/** The parts of the dish that sit in front of the food. */
function VesselFront({ shape, length, stack }: { shape: Shape; length: number; stack: number }) {
  const span = W * length;
  const x0 = (W - span) / 2;
  const rise = Math.min(stack * 7, 52);
  return (
    <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="f-rim" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={shade(BOWL, 0.35)} />
          <Stop offset="0.5" stopColor={shade(BOWL, 0.1)} />
          <Stop offset="1" stopColor={shade(BOWL, -0.3)} />
        </LinearGradient>
        <LinearGradient id="f-top" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={shade(BREAD, 0.25)} />
          <Stop offset="0.7" stopColor={BREAD} />
          <Stop offset="1" stopColor={shade(BREAD, -0.3)} />
        </LinearGradient>
        <LinearGradient id="f-shell" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={mono('#F3D27E')} />
          <Stop offset="1" stopColor={mono('#B97F2C')} />
        </LinearGradient>
      </Defs>

      {shape === 'bowl' ? (
        <>
          {/* Front rim: the lip of the bowl over the food, plus a glossy highlight on the body. */}
          <Path d={`M26 54 A94 28 0 0 0 ${W - 26} 54`} stroke="url(#f-rim)" strokeWidth={5} fill="none" strokeLinecap="round" />
          <Path d={`M44 78 C52 100 76 114 100 118`} stroke={mono('#FFFFFF')} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.18} />
        </>
      ) : null}

      {shape === 'plate' ? <Path d={`M${W / 2 - 84} 60 A84 28 0 0 0 ${W / 2 + 84} 60`} stroke={mono('#FFFFFF')} strokeWidth={2} fill="none" opacity={0.9} /> : null}

      {shape === 'sub' ? (
        <>
          {/* Top half: a domed roll with a score line, sheen and sesame. */}
          <G transform={`translate(0 ${-rise})`}>
            <Path d={`M${x0 + 6} 84 q-8 0 -8 -10 q0 -34 ${span / 2 + 2} -34 q${span / 2 + 2} 0 ${span / 2 + 2} 34 q0 10 -8 10 Z`} fill="url(#f-top)" />
            <Path d={`M${x0 + 2} 78 q4 6 ${span - 4} 0`} stroke={shade(BREAD, -0.45)} strokeWidth={2} fill="none" opacity={0.35} />
            <Path d={`M${x0 + 22} 56 q${span / 2 - 22} -16 ${span - 44} 0`} stroke={mono('#FFFFFF')} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.3} />
            {scatter('sesame', Math.round(span / 16), { x: x0 + 18, y: 44, w: span - 36, h: 20 }).map((p, i) => (
              <Ellipse key={i} cx={p.x} cy={p.y + Math.abs(p.x - W / 2) / 10} rx={2.2} ry={1.3} fill={mono('#FFF4D8')} transform={`rotate(${(i * 61) % 90 - 45} ${p.x} ${p.y})`} opacity={0.95} />
            ))}
          </G>
        </>
      ) : null}

      {shape === 'wrap' ? (
        <>
          <Path d={`M60 46 H${W - 52} a28 28 0 0 1 0 52 H60`} stroke={mono('#B8914E')} strokeWidth={1} fill="none" opacity={0.5} />
          <Path d={`M74 52 H${W - 70}`} stroke={mono('#FFFFFF')} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.28} />
          <Ellipse cx={60} cy={72} rx={26} ry={28} fill="none" stroke={mono('#C9A262')} strokeWidth={1.2} opacity={0.6} />
        </>
      ) : null}

      {shape === 'tacos'
        ? [0, 1, 2].map((i) => (
            <G key={i} transform={`translate(${44 + i * 56} 0) rotate(${-6 + i * 6} 28 70)`}>
              <Path d="M0 64 a28 40 0 0 0 56 0 V70 a28 36 0 0 1 -56 0 Z" fill="url(#f-shell)" />
              <Path d="M6 78 q22 16 44 0" stroke={mono('#FFFFFF')} strokeWidth={2} fill="none" opacity={0.25} strokeLinecap="round" />
            </G>
          ))
        : null}
    </Svg>
  );
}

/**
 * A picture of the order, drawn with shading so it reads as a real dish:
 * a ceramic bowl seen from above, a cut burrito, three shells, a sub with a
 * domed sesame roll, or a plate. Each ingredient is a layer that pops in;
 * double portions scatter more of it.
 */
export function BuildPreview({ shape, ingredients, length = 0.8 }: BuildPreviewProps) {
  const { colors } = useAppTheme();
  const { box, clip } = fillArea(shape, length);
  const label = ingredients.length === 0 ? 'pick something to start' : `${ingredients.filter((i) => i.count === 2).length ? 'double up · ' : ''}${ingredients.length} ${ingredients.length === 1 ? 'thing' : 'things'} in`;

  return (
    <View style={styles.stage} accessible accessibilityLabel={`Your order: ${ingredients.map((i) => (i.count === 2 ? `double ${i.label}` : i.label)).join(', ') || 'empty'}`}>
      {/* A dark plate in both themes, so the white and lavender ink reads the same on paper as on black. */}
      <View style={[styles.plate, { backgroundColor: colors.hero, borderColor: colors.border }]}>
        <View style={styles.canvas}>
          <VesselBack shape={shape} length={length} />
          {/* Everything that goes in is clipped to the opening, so nothing spills over the rim. */}
          {ingredients.map((ingredient, index) => (
            <Layer key={ingredient.id + ingredient.count} ingredient={ingredient} box={box} index={index} shape={shape} clip={clip} />
          ))}
          <VesselFront shape={shape} length={length} stack={ingredients.length} />
        </View>
      </View>
      <ThemedText variant="tagline" color="secondary" style={styles.caption}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'stretch', gap: Spacing.sm },
  plate: { alignItems: 'center', paddingVertical: Spacing.md, borderRadius: Radii.xl, borderWidth: HAIRLINE, overflow: 'hidden' },
  canvas: { width: W, height: H },
  caption: { textAlign: 'center' },
});
