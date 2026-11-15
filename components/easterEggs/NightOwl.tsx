import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { Crescent } from '@/components/decor';
import { PressScale, useMotion } from '@/components/motion';
import { Stamp } from '@/components/ui/Stamp';
import { Duration, Haptic } from '@/constants/motion';
import { MIN_TAP, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { countTaps, EASTER_EGGS_ENABLED } from '@/lib/easterEggs/eggs';
import { discover } from './found';

const TAPS = 7;
const WINDOW_MS = 4000;
const FLIGHT_MS = 2200;
const STAY_MS = 4200;

/** How many times the owl has been woken this session; the flight replays on each. */
let flights = 0;
const listeners = new Set<() => void>();
const owlStore = {
  getSnapshot: () => flights,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** An owl seen from below, wings spread: a silhouette and nothing more. */
const OWL = 'M30 14 C24 6 12 2 0 6 C8 8 13 12 16 18 C12 18 8 19 5 22 C12 22 18 24 22 28 C24 34 27 38 30 40 C33 38 36 34 38 28 C42 24 48 22 55 22 C52 19 48 18 44 18 C47 12 52 8 60 6 C48 2 36 6 30 14 Z M26 15 L28 11 L30 14 L32 11 L34 15 Z';

/**
 * The small moon beside Home's greeting. Tap it seven times and the moon
 * fills: the cue for the owl (see OwlFlight). To a screen reader it is
 * decoration and isn't there.
 */
export function NightOwl() {
  const { colors } = useAppTheme();
  const { reduced } = useMotion();
  const taps = useRef<number[]>([]);
  const woken = useSyncExternalStore(owlStore.subscribe, owlStore.getSnapshot, owlStore.getSnapshot);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (woken === 0) return;
    glow.set(withSequence(withTiming(1, { duration: reduced ? Duration.micro : Duration.hero }), withDelay(STAY_MS - 900, withTiming(0, { duration: Duration.hero }))));
  }, [glow, reduced, woken]);

  const full = useAnimatedStyle(() => ({ opacity: glow.get(), transform: [{ scale: reduced ? 1 : 0.8 + glow.get() * 0.2 }] }));
  if (!EASTER_EGGS_ENABLED) return null;

  const tap = () => {
    taps.current = countTaps(taps.current, Date.now(), TAPS, WINDOW_MS);
    if (taps.current.length < TAPS) return;
    taps.current = [];
    discover('night-owl');
    Haptic.stamp();
    flights += 1;
    listeners.forEach((listener) => listener());
  };

  return (
    <View style={styles.moon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <PressScale onPress={tap} haptic={null} pressScale={0.9} accessible={false} style={styles.target}>
        <Crescent size={16} color={colors.accent} />
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center, full]}>
          <Svg width={30} height={30} viewBox="0 0 30 30">
            <Circle cx={15} cy={15} r={13} fill={colors.glow} />
            <Circle cx={15} cy={15} r={8} fill={colors.accent} />
          </Svg>
        </Animated.View>
      </PressScale>
    </View>
  );
}

/**
 * What waking the moon does: an owl glides across the top of Home, once,
 * and a "night owl" stamp lands and fades. Lies over the hero and takes no
 * touches. With motion reduced only the stamp appears.
 */
export function OwlFlight() {
  const { colors } = useAppTheme();
  const { reduced } = useMotion();
  const { width } = useWindowDimensions();
  const woken = useSyncExternalStore(owlStore.subscribe, owlStore.getSnapshot, owlStore.getSnapshot);
  const flight = useSharedValue(0);
  const stamp = useSharedValue(0);

  useEffect(() => {
    if (woken === 0) return;
    if (!reduced) {
      flight.set(0);
      flight.set(withTiming(1, { duration: FLIGHT_MS, easing: Easing.inOut(Easing.sin) }));
    }
    stamp.set(withSequence(withDelay(reduced ? 0 : FLIGHT_MS * 0.55, withTiming(1, { duration: Duration.micro })), withDelay(STAY_MS - FLIGHT_MS * 0.55 - 600, withTiming(0, { duration: Duration.hero }))));
  }, [flight, reduced, stamp, woken]);

  const span = Math.min(width, 480) + 80;
  const owl = useAnimatedStyle(() => {
    const t = flight.get();
    return { opacity: t > 0 && t < 1 ? 1 : 0, transform: [{ translateX: -70 + t * span }, { translateY: 70 - Math.sin(t * Math.PI) * 46 }, { rotate: `${(t - 0.5) * 10}deg` }] };
  });
  const landed = useAnimatedStyle(() => ({ opacity: stamp.get() }));
  if (!EASTER_EGGS_ENABLED || woken === 0) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {reduced ? null : (
        <Animated.View style={[styles.owl, owl]}>
          <Svg width={60} height={42} viewBox="0 0 60 42">
            <Path d={OWL} fill={colors.onHero} />
          </Svg>
        </Animated.View>
      )}
      <Animated.View style={[styles.stamp, landed]}>
        <Stamp key={woken} label="night owl" size={74} accent thump delay={reduced ? 0 : FLIGHT_MS * 0.55} tilt={8} seed={7} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  moon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  // The moon is small; the place you can tap is not.
  target: { width: MIN_TAP, height: MIN_TAP, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  owl: { position: 'absolute', left: 0, top: 40 },
  stamp: { position: 'absolute', right: Spacing.xl, top: 150 },
});
