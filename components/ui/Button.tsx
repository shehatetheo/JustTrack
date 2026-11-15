import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View, type PressableProps } from 'react-native';

import { PressScale } from '@/components/motion';
import type { HapticName } from '@/constants/motion';
import { Gloss, HAIRLINE, MIN_TAP, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { ThemedText } from './ThemedText';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  /**
   * primary: the glossy lavender capsule. One per screen.
   * secondary: an outlined capsule.
   * ghost: words only.
   * quiet: an outlined capsule in gray, for "remove", "delete", "not now".
   */
  variant?: 'primary' | 'secondary' | 'ghost' | 'quiet';
  size?: 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  /** Defaults to a light tap; the log button passes "log". */
  haptic?: HapticName | null;
}

/**
 * The app's button. The primary is a capsule of lavender glass: a bright
 * lip, a darker foot, and a gloss that shifts when it is pressed. Labels
 * are set in lowercase, the house voice, whatever case they arrive in.
 */
export function Button({ label, variant = 'primary', size = 'lg', loading = false, fullWidth = true, disabled, haptic = 'tap', onPressIn, onPressOut, accessibilityLabel, ...rest }: ButtonProps) {
  const { colors } = useAppTheme();
  const [pressed, setPressed] = useState(false);
  const inactive = disabled || loading;
  const ink = variant === 'primary' ? colors.onAccent : variant === 'secondary' ? colors.accentText : variant === 'quiet' ? colors.textSecondary : colors.text;

  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(inactive), busy: loading }}
      disabled={inactive}
      haptic={haptic}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      style={[
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        fullWidth && styles.fullWidth,
        variant === 'secondary' && { borderWidth: HAIRLINE, borderColor: colors.accentText },
        variant === 'quiet' && { borderWidth: HAIRLINE, borderColor: colors.border },
        { opacity: inactive && !loading ? 0.4 : 1 },
      ]}
      {...rest}
    >
      {variant === 'primary' ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip]}>
          <LinearGradient colors={pressed ? Gloss.capsulePressed : Gloss.capsule} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
          {/* The gloss: a highlight across the top half that slides down a little under a thumb. */}
          <LinearGradient colors={Gloss.highlight} style={[styles.gloss, pressed && styles.glossPressed]} />
        </View>
      ) : null}
      {loading ? (
        <ActivityIndicator color={ink} />
      ) : (
        <ThemedText variant={size === 'lg' ? 'bodyEmphasized' : 'subheadEmphasized'} style={[styles.label, { color: ink }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {label.toLowerCase()}
        </ThemedText>
      )}
    </PressScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderRadius: Radii.full, flexDirection: 'row', paddingHorizontal: Spacing.xl },
  md: { minHeight: MIN_TAP, paddingVertical: Spacing.sm },
  lg: { minHeight: 52, paddingVertical: Spacing.md },
  fullWidth: { alignSelf: 'stretch' },
  clip: { borderRadius: Radii.full, overflow: 'hidden' },
  gloss: { position: 'absolute', top: 1, left: Spacing.md, right: Spacing.md, height: '46%', borderRadius: Radii.full },
  glossPressed: { top: 4, opacity: 0.55 },
  label: { letterSpacing: 0.2 },
});
