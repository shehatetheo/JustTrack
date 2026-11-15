import React from 'react';
import { Text, type TextProps } from 'react-native';

import { resolveFont } from '@/constants/fonts';
import { Typography, type TypographyVariant } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

interface ThemedTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse';
}

/**
 * The app's only Text component. Scales with the user's Dynamic Type
 * setting by default (never sets allowFontScaling=false), takes its face
 * from the type tokens and its colour from the active theme.
 */
export function ThemedText({ variant = 'body', color = 'primary', style, ...rest }: ThemedTextProps) {
  const { colors } = useAppTheme();

  const colorMap = {
    primary: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    inverse: colors.background,
  } as const;

  // A weight asked for in `style` becomes the matching face of the variant's family.
  return <Text style={resolveFont([Typography[variant], { color: colorMap[color] }, style])} {...rest} />;
}
