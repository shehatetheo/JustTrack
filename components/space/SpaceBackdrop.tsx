import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { MeteorShower } from '@/components/space/MeteorShower';
import { Starfield } from '@/components/space/Starfield';

interface SpaceBackdropProps {
  /** Meteors on screen at once, roughly. 0 for a still sky. */
  meteors?: number;
  calm?: number;
  stars?: number;
  seed?: number;
  /** A faint violet nebula, positioned as fractions of the frame. */
  nebula?: { x: number; y: number } | null;
}

/** Deep space, edge to edge: black, a wash of nebula, stars, and meteors passing through. Sits behind whatever is drawn after it. */
export function SpaceBackdrop({ meteors = 6, calm = 1, stars = 110, seed = 11, nebula = { x: 0.5, y: 0.42 } }: SpaceBackdropProps) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.space]}>
      {nebula ? (
        // Drawn on a 100 × 100 grid stretched to the frame; the ellipse's own box shapes the gradient, which renders the same everywhere.
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="space-nebula" cx="50%" cy="50%" r="50%" fx="50%" fy="50%" gradientUnits="objectBoundingBox">
              <Stop offset="0" stopColor="#6B4DFF" stopOpacity={0.36} />
              <Stop offset="0.5" stopColor="#6B4DFF" stopOpacity={0.11} />
              <Stop offset="1" stopColor="#6B4DFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={nebula.x * 100} cy={nebula.y * 100} rx={78} ry={40} fill="url(#space-nebula)" />
        </Svg>
      ) : null}
      <Starfield count={stars} seed={seed} twinkle={9} />
      {meteors > 0 ? <MeteorShower count={meteors} seed={seed + 5} calm={calm} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  space: { backgroundColor: '#000000' },
});
