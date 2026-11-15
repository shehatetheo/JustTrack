import React, { useEffect, useRef, useState } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { Duration } from '@/constants/motion';
import type { TypographyVariant } from '@/constants/theme';
import { useMotion } from './useMotion';

/** Rolls a displayed number toward `target`, easing out, like a counter settling. Jumps straight there with motion reduced. */
export function useCountUp(target: number, durationMs: number = Duration.hero): number {
  const { reduced } = useMotion();
  const [shown, setShown] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const start = from.current;
    if (start === target) return;
    // With motion reduced the same loop runs for a single frame and lands on the value.
    const span = reduced ? 0 : durationMs;
    const began = Date.now();
    let frame = 0;
    const tick = () => {
      const t = span === 0 ? 1 : Math.min((Date.now() - began) / span, 1);
      const value = start + (target - start) * (1 - (1 - t) ** 3);
      from.current = value;
      setShown(value);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, reduced, target]);

  return shown;
}

interface CountUpProps {
  value: number;
  /** Turns the in-between value into text. Defaults to a whole number with thousands separators. */
  format?: (value: number) => string;
  /** How long the count takes; shorter for numbers that change as you adjust something. */
  durationMs?: number;
  variant?: TypographyVariant;
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse';
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
}

const whole = (value: number) => Math.round(value).toLocaleString('en-US');

/** A number that counts to its new value instead of jumping. Screen readers get the final value, not every step. */
export function CountUp({ value, format = whole, durationMs, variant = 'body', color, style, ...rest }: CountUpProps) {
  const shown = useCountUp(value, durationMs);
  return (
    <ThemedText variant={variant} color={color} style={[{ fontVariant: ['tabular-nums'] }, style]} accessibilityLabel={format(value)} {...rest}>
      {format(shown)}
    </ThemedText>
  );
}
