import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { MeteorShower } from '@/components/space/MeteorShower';
import { Starfield } from '@/components/space/Starfield';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useLightStatusBar } from '@/lib/statusBar';

interface GradientHeaderProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Where the gradient has fully faded into the page background, 0–1 of the header's height. */
  fadeEnd?: number;
  /** Which sky to paint, so each screen gets its own stars. */
  seed?: number;
}

/**
 * The crown of every main screen: a patch of night sky. In dark mode it is
 * the black page itself with stars, a violet nebula behind the headline
 * number, and now and then a meteor; in light mode the same stars over a
 * violet dusk fading into white. Hairline rings orbit the number in both.
 */
export function GradientHeader({ children, style, fadeEnd = 1, seed = 7 }: GradientHeaderProps) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  useLightStatusBar();
  const padding = { paddingTop: insets.top + Spacing.md };

  if (isDark) {
    return (
      <View style={[styles.gradient, padding, { backgroundColor: colors.background }, style]}>
        <Glow color={colors.glow} />
        <Starfield count={54} seed={seed} twinkle={5} dim={0.8} />
        <MeteorShower count={2} seed={seed + 2} calm={6} />
        <Halo />
        {children}
      </View>
    );
  }

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]} locations={[0, Math.max(0.35, fadeEnd * 0.55), fadeEnd]} style={[styles.gradient, padding, style]}>
      <Starfield count={40} seed={seed} twinkle={4} dim={0.7} />
      <MeteorShower count={1} seed={seed + 2} calm={8} />
      <Halo />
      {children}
    </LinearGradient>
  );
}

/** Light pooling behind the headline, falling off to black well before the edges. */
function Glow({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="header-glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={color} stopOpacity={1} />
            <Stop offset="0.55" stopColor={color} stopOpacity={0.28} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={50} cy={46} rx={78} ry={46} fill="url(#header-glow)" />
      </Svg>
    </View>
  );
}

/** Faint concentric rings behind the headline number, like ripples. */
function Halo() {
  const { colors, isDark } = useAppTheme();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {[520, 400, 280].map((size) => (
        <View
          key={size}
          style={[styles.ring, { width: size, height: size, borderRadius: size / 2, marginLeft: -size / 2, marginTop: -size / 2 + 150, borderColor: colors.onGradient, opacity: isDark ? 0.08 : 0.12 }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { paddingHorizontal: Spacing.lg, overflow: 'hidden' },
  ring: { position: 'absolute', left: '50%', top: 0, borderWidth: 1 },
});
