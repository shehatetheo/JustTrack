import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { seeded } from '@/components/space/Starfield';

/** Meteors fall down and to the left, the way a shower's radiant makes them all run parallel. */
const ANGLE_DEGREES = 142;

export interface MeteorPlan {
  /** Where the streak begins, as a fraction of the sky's width (can start past the right edge) and height. */
  startX: number;
  startY: number;
  /** Tail length in points. */
  length: number;
  /** Milliseconds to cross the sky. */
  flight: number;
  /** Wait before the first pass, and between passes. */
  delay: number;
  gap: number;
  brightness: number;
}

/** A shower of `count` meteors. `calm` stretches the gaps: 1 is a busy loading-screen sky, 6 is an occasional streak behind a header. */
export function planShower(count: number, seed: number, calm = 1): MeteorPlan[] {
  const next = seeded(seed);
  return Array.from({ length: count }, (_, index) => ({
    startX: 0.25 + next() * 0.95,
    startY: -0.12 + next() * 0.3,
    length: 70 + next() * 110,
    flight: 650 + next() * 650,
    delay: (index * 330 + next() * 500) * calm,
    gap: (900 + next() * 2200) * calm,
    brightness: 0.55 + next() * 0.45,
  }));
}

interface MeteorShowerProps {
  count?: number;
  seed?: number;
  calm?: number;
  style?: StyleProp<ViewStyle>;
}

/** Streaks of light crossing the sky on a loop. Nothing moves when the phone is set to reduce motion. */
export function MeteorShower({ count = 6, seed = 3, calm = 1, style }: MeteorShowerProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const still = useReducedMotion();
  const plans = useMemo(() => planShower(count, seed, calm), [count, seed, calm]);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip, style]} onLayout={(event) => setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
      {size.width > 0 && !still ? plans.map((plan, index) => <Meteor key={index} plan={plan} width={size.width} height={size.height} />) : null}
    </View>
  );
}

function Meteor({ plan, width, height }: { plan: MeteorPlan; width: number; height: number }) {
  // Far enough to leave the frame whichever edge it exits by.
  const distance = Math.hypot(width, height) * 1.15 + plan.length;
  const travel = useSharedValue(0);

  useEffect(() => {
    travel.set(withDelay(plan.delay, withRepeat(withSequence(withTiming(1, { duration: plan.flight, easing: Easing.in(Easing.quad) }), withTiming(1, { duration: plan.gap }), withTiming(0, { duration: 0 })), -1, false)));
  }, [plan, travel]);

  const style = useAnimatedStyle(() => {
    const t = travel.get();
    // Flare up as it enters, burn out before the end of the run.
    const glow = t < 0.12 ? t / 0.12 : t > 0.7 ? Math.max(0, (1 - t) / 0.3) : 1;
    return { opacity: glow * plan.brightness, transform: [{ rotate: `${ANGLE_DEGREES}deg` }, { translateX: t * distance }] };
  });

  return (
    <Animated.View style={[styles.meteor, { left: plan.startX * width - plan.length / 2, top: plan.startY * height, width: plan.length }, style]}>
      <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(176,160,255,0.55)', '#FFFFFF']} locations={[0, 0.7, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.tail} />
      <View style={styles.head} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  meteor: { position: 'absolute', height: 4, justifyContent: 'center' },
  tail: { height: 1.5, borderRadius: 1 },
  head: { position: 'absolute', right: -1, width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF', shadowColor: '#B9A8FF', shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
});
