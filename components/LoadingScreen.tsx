import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { SpaceBackdrop } from '@/components/space/SpaceBackdrop';
import { Logo } from '@/components/ui/Logo';
import { ThemedText } from '@/components/ui/ThemedText';
import { APP_NAME } from '@/constants/brand';

/**
 * What the app opens on: deep space with a meteor shower crossing it, and
 * the mark holding steady in the middle. Shown on every launch, and again
 * when the app comes back after a long spell in the background.
 */
export function LoadingScreen() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.set(withRepeat(withSequence(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.quad) })), -1, false));
  }, [pulse]);

  const halo = useAnimatedStyle(() => ({ transform: [{ scale: 0.9 + pulse.get() * 0.22 }], opacity: 0.55 + pulse.get() * 0.45 }));

  return (
    <View style={styles.root} accessibilityRole="progressbar" accessibilityLabel={`${APP_NAME} is loading`}>
      <SpaceBackdrop meteors={7} calm={0.75} stars={130} />
      <Animated.View entering={FadeIn.duration(350)} style={styles.center}>
        <View style={styles.markWrap}>
          <Animated.View style={[styles.halo, halo]}>
            <Svg width={HALO} height={HALO}>
              <Defs>
                <RadialGradient id="mark-halo" cx="50%" cy="50%" fx="50%" fy="50%" rx="50%" ry="50%" gradientUnits="objectBoundingBox">
                  <Stop offset="0" stopColor="#8468FF" stopOpacity={0.75} />
                  <Stop offset="0.55" stopColor="#8468FF" stopOpacity={0.2} />
                  <Stop offset="1" stopColor="#8468FF" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={HALO / 2} cy={HALO / 2} r={HALO / 2} fill="url(#mark-halo)" />
            </Svg>
          </Animated.View>
          <Logo width={84} color="#FFFFFF" />
        </View>
        <ThemedText variant="overline" style={styles.name}>
          {APP_NAME.toUpperCase()}
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const MARK = 150;
const HALO = 260;

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000' },
  center: { alignItems: 'center', gap: 6 },
  markWrap: { width: MARK, height: MARK, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: HALO, height: HALO },
  name: { color: '#FFFFFF', letterSpacing: 6, fontSize: 12, opacity: 0.85 },
});
