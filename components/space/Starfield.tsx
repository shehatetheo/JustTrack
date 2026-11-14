import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

/** A small repeatable random source, so the same seed always paints the same sky. */
export function seeded(seed: number): () => number {
  let state = (seed * 2654435761) >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export interface Star {
  /** Position as a fraction of the sky's width and height. */
  x: number;
  y: number;
  radius: number;
  opacity: number;
  color: string;
}

const STAR_TINTS = ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#D9D2FF', '#CFE3FF', '#FFF1D6'];

/** `count` stars for a seed: mostly faint pinpricks, a few brighter ones, the odd one tinted. */
export function makeStars(count: number, seed: number): Star[] {
  const next = seeded(seed);
  return Array.from({ length: count }, () => {
    const depth = next();
    return {
      x: next(),
      y: next(),
      radius: depth > 0.93 ? 1.5 : depth > 0.7 ? 1 : 0.6,
      opacity: 0.25 + depth * 0.65,
      color: STAR_TINTS[Math.floor(next() * STAR_TINTS.length)],
    };
  });
}

interface StarfieldProps {
  count?: number;
  seed?: number;
  /** How many of the stars shimmer. */
  twinkle?: number;
  /** Scales every star's brightness, for a sky that sits behind text. */
  dim?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A field of stars. The stars themselves are one static drawing; only a
 * handful shimmer, each on its own slow beat, so the sky feels alive without
 * costing anything to keep on screen.
 */
export function Starfield({ count = 60, seed = 7, twinkle = 6, dim = 1, style }: StarfieldProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const still = useReducedMotion();
  const stars = useMemo(() => makeStars(count, seed), [count, seed]);
  const shimmering = useMemo(() => makeStars(still ? 0 : twinkle, seed + 101), [still, twinkle, seed]);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]} onLayout={(event) => setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
      {size.width > 0 ? (
        <>
          <Svg width={size.width} height={size.height}>
            {stars.map((star, index) => (
              <Circle key={index} cx={star.x * size.width} cy={star.y * size.height} r={star.radius} fill={star.color} fillOpacity={star.opacity * dim} />
            ))}
          </Svg>
          {shimmering.map((star, index) => (
            <Twinkle key={index} left={star.x * size.width} top={star.y * size.height} delay={index * 430} beat={1700 + index * 260} peak={dim} />
          ))}
        </>
      ) : null}
    </View>
  );
}

function Twinkle({ left, top, delay, beat, peak }: { left: number; top: number; delay: number; beat: number; peak: number }) {
  const glow = useSharedValue(0.15);
  useEffect(() => {
    glow.set(withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: beat, easing: Easing.inOut(Easing.quad) }), withTiming(0.15, { duration: beat, easing: Easing.inOut(Easing.quad) })), -1, false)));
  }, [beat, delay, glow]);
  const style = useAnimatedStyle(() => ({ opacity: glow.get() * peak, transform: [{ scale: 0.7 + glow.get() * 0.5 }] }));
  return <Animated.View style={[styles.twinkle, { left: left - 1.5, top: top - 1.5 }, style]} />;
}

const styles = StyleSheet.create({
  twinkle: { position: 'absolute', width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF' },
});
