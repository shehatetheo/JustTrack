import * as Haptics from 'expo-haptics';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { ThemedText } from './ThemedText';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'ghostDestructive';
  size?: 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  loading = false,
  fullWidth = true,
  disabled,
  onPress,
  ...rest
}: ButtonProps) {
  const { colors } = useAppTheme();

  const palette = {
    primary: { bg: colors.text, fg: colors.textInverse, border: 'transparent' },
    secondary: { bg: colors.surfaceTint, fg: colors.text, border: colors.border },
    ghost: { bg: 'transparent', fg: colors.text, border: 'transparent' },
    destructive: { bg: colors.danger, fg: colors.textInverse, border: 'transparent' },
    ghostDestructive: { bg: 'transparent', fg: colors.danger, border: 'transparent' },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={(event) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(event);
      }}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: pressed ? 0.85 : disabled ? 0.4 : 1 },
        fullWidth && styles.fullWidth,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <ThemedText variant="bodyEmphasized" style={[styles.label, { color: palette.fg }]} numberOfLines={1}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md + 2,
    borderWidth: StyleSheet.hairlineWidth * 2,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  md: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, minHeight: 54 },
  fullWidth: { alignSelf: 'stretch' },
  label: { fontWeight: '700', letterSpacing: -0.1 },
});
