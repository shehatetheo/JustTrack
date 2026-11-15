import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { Scribble } from '@/components/decor';
import { useMotion } from '@/components/motion';
import { OrnateFrame } from '@/components/ui/OrnateFrame';
import { ThemedText } from '@/components/ui/ThemedText';
import { Duration, Easings } from '@/constants/motion';
import { HAIRLINE, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

interface AnalyzingProps {
  /** What is being worked out, in order. They are read out one at a time. */
  steps: readonly string[];
  /** One plain line under the steps: how long this takes. */
  note: string;
}

const HEIGHT = 190;
const STEP_MS = 1700;

/**
 * While the plate is being read: an ornate frame with pen scribbles inside
 * it and a line of light passing up and down, and the step being worked on
 * named in italics underneath. With motion reduced the frame holds still
 * and only the words change.
 */
export function Analyzing({ steps, note }: AnalyzingProps) {
  const { colors } = useAppTheme();
  const { reduced } = useMotion();
  const [step, setStep] = useState(0);
  const sweep = useSharedValue(0);
  const words = useSharedValue(1);

  useEffect(() => {
    if (reduced) return;
    sweep.set(withRepeat(withSequence(withTiming(1, { duration: 1400, easing: Easings.inOut }), withTiming(0, { duration: 1400, easing: Easings.inOut })), -1, false));
  }, [reduced, sweep]);

  useEffect(() => {
    const timer = setInterval(() => {
      // The words dip out, change, and come back; the last step stays once it is reached.
      words.set(withSequence(withTiming(0, { duration: Duration.micro }), withTiming(1, { duration: Duration.standard })));
      setTimeout(() => setStep((current) => Math.min(current + 1, steps.length - 1)), Duration.micro);
    }, STEP_MS);
    return () => clearInterval(timer);
  }, [steps.length, words]);

  const line = useAnimatedStyle(() => ({ transform: [{ translateY: sweep.get() * (HEIGHT - 28) }] }));
  const label = useAnimatedStyle(() => ({ opacity: words.get() }));

  return (
    <View style={styles.root} accessibilityRole="progressbar" accessibilityLabel={`${steps[step]}. ${note}`} accessibilityLiveRegion="polite">
      <OrnateFrame variant="corners" corner={46} color={colors.accentText} replay={step} style={[styles.frame, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.scribbleA}>
          <Scribble width={210} height={70} color={colors.accent} opacity={0.6} seed={4} />
        </View>
        <View style={styles.scribbleB}>
          <Scribble width={170} height={60} color={colors.ink} opacity={0.35} seed={9} loops={5} />
        </View>
        {reduced ? null : (
          <Animated.View pointerEvents="none" style={[styles.sweep, line]}>
            <LinearGradient colors={['transparent', colors.accent, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.sweepLine} />
            <LinearGradient colors={[colors.glow, 'transparent']} style={styles.sweepGlow} />
          </Animated.View>
        )}
      </OrnateFrame>
      <Animated.View style={label}>
        <ThemedText variant="tagline" style={[styles.center, styles.step]}>
          {steps[step]}
        </ThemedText>
      </Animated.View>
      <ThemedText variant="footnote" color="secondary" style={styles.center}>
        {note}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'stretch', gap: Spacing.md, paddingVertical: Spacing.lg },
  frame: { height: HEIGHT, borderRadius: Radii.xl, borderWidth: HAIRLINE, overflow: 'hidden' },
  scribbleA: { position: 'absolute', left: 34, top: 36 },
  scribbleB: { position: 'absolute', right: 30, bottom: 30 },
  sweep: { position: 'absolute', left: 14, right: 14, top: 14 },
  sweepLine: { height: 2 },
  sweepGlow: { height: 22, opacity: 0.5 },
  center: { textAlign: 'center' },
  step: { fontSize: 20, lineHeight: 26 },
});
