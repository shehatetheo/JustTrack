import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { useMotion } from '@/components/motion';
import { LOGO_PATHS, LOGO_RING, LOGO_STROKES, LOGO_VIEWBOX } from '@/constants/brand';
import { Duration, Easings } from '@/constants/motion';
import { useAppTheme } from '@/contexts/ThemeContext';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MonogramDrawProps {
  size?: number;
  /** The colour of whatever the mark sits on. The pen effect works by lifting a cover of this colour off the letters. */
  ground: string;
  color?: string;
  delay?: number;
  /** Called when the last stroke has landed. */
  onDrawn?: () => void;
}

/** How long each part of the mark takes, in order: the ring, the J, the T, then the star. */
const RING_MS = 360;
const LETTER_MS = 300;
const STAR_MS = 180;
export const MONOGRAM_DRAW_MS = RING_MS * 0.5 + LETTER_MS * 2 + STAR_MS;

/** A wide stroke in the ground colour lying over one letter, which retreats along the letter's spine like a pen moving forward. */
function Cover({ d, length, ground, progress }: { d: string; length: number; ground: string; progress: SharedValue<number> }) {
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: -length * progress.get() }));
  return <AnimatedPath d={d} stroke={ground} strokeWidth={250} strokeLinecap="butt" strokeLinejoin="round" fill="none" strokeDasharray={`${length} ${length}`} animatedProps={animatedProps} />;
}

/**
 * The monogram written on: the ring is drawn round, the J and the T appear
 * along the path a pen would take, and the star blinks in between them.
 * With motion reduced the finished mark fades in.
 */
export function MonogramDraw({ size = 160, ground, color, delay = 0, onDrawn }: MonogramDrawProps) {
  const { colors } = useAppTheme();
  const { reduced } = useMotion();
  const ink = color ?? colors.onHero;
  const ring = useSharedValue(0);
  const j = useSharedValue(0);
  const t = useSharedValue(0);
  const star = useSharedValue(0);
  const whole = useSharedValue(reduced ? 0 : 1);
  const circumference = 2 * Math.PI * LOGO_RING.r;

  useEffect(() => {
    if (reduced) {
      ring.set(1);
      j.set(1);
      t.set(1);
      star.set(1);
      whole.set(withDelay(delay, withTiming(1, { duration: Duration.standard })));
    } else {
      ring.set(withDelay(delay, withTiming(1, { duration: RING_MS, easing: Easings.draw })));
      j.set(withDelay(delay + RING_MS * 0.5, withTiming(1, { duration: LETTER_MS, easing: Easings.draw })));
      t.set(withDelay(delay + RING_MS * 0.5 + LETTER_MS, withTiming(1, { duration: LETTER_MS, easing: Easings.draw })));
      star.set(withDelay(delay + RING_MS * 0.5 + LETTER_MS * 2, withSequence(withTiming(1.5, { duration: STAR_MS * 0.6 }), withTiming(1, { duration: STAR_MS * 0.4 }))));
    }
    if (!onDrawn) return;
    const timer = setTimeout(onDrawn, delay + (reduced ? Duration.standard : MONOGRAM_DRAW_MS));
    return () => clearTimeout(timer);
    // Draws once, when it mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - ring.get()) }));
  const starStyle = useAnimatedStyle(() => ({ opacity: Math.min(star.get(), 1), transform: [{ scale: star.get() }] }));
  const wholeStyle = useAnimatedStyle(() => ({ opacity: whole.get() }));
  const box = `${LOGO_VIEWBOX.x} ${LOGO_VIEWBOX.y} ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}`;

  return (
    <Animated.View style={[{ width: size, height: size }, wholeStyle]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox={box}>
        <Path d={LOGO_PATHS.letters} fill={ink} fillRule="evenodd" />
        {/* The T's cover is drawn second so it also hides the part of the J it overlaps until the pen gets there. */}
        <Cover d={LOGO_STROKES.j.d} length={LOGO_STROKES.j.length} ground={ground} progress={j} />
        <Cover d={LOGO_STROKES.t.d} length={LOGO_STROKES.t.length} ground={ground} progress={t} />
        <AnimatedCircle cx={LOGO_RING.cx} cy={LOGO_RING.cy} r={LOGO_RING.r} stroke={ink} strokeWidth={LOGO_RING.width} fill="none" strokeDasharray={`${circumference} ${circumference}`} animatedProps={ringProps} transform={`rotate(-90 ${LOGO_RING.cx} ${LOGO_RING.cy})`} />
      </Svg>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, starStyle]}>
        <View style={StyleSheet.absoluteFill}>
          <Svg width={size} height={size} viewBox={box}>
            <Path d={LOGO_PATHS.star} fill={colors.accent} fillRule="evenodd" />
          </Svg>
        </View>
      </Animated.View>
    </Animated.View>
  );
}
