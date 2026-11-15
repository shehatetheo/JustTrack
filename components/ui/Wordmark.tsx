import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { APP_NAME } from '@/constants/brand';
import { useAppTheme } from '@/contexts/ThemeContext';
import { ThemedText } from './ThemedText';

interface WordmarkProps {
  size?: number;
  /** Defaults to the theme's text colour: white on black, black on parchment. */
  color?: string;
  style?: StyleProp<TextStyle>;
}

/** The name, exactly "JustTrack", always in Helvetica: never the serif, never the blackletter. */
export function Wordmark({ size = 20, color, style }: WordmarkProps) {
  const { colors } = useAppTheme();
  return (
    <ThemedText variant="wordmark" style={[{ fontSize: size, lineHeight: Math.round(size * 1.2), fontWeight: '700', color: color ?? colors.text }, style]} accessibilityRole="text">
      {APP_NAME}
    </ThemedText>
  );
}
