import type { ErrorBoundaryProps } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { Colors, MIN_TAP, Radii, Spacing, Typography } from '@/constants/theme';

/**
 * Route-level error fallback. Rendered in place of a crashed layout, which
 * may be outside ThemeProvider — so it reads the color scheme directly
 * instead of using useAppTheme().
 */
export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[Typography.title2, { color: colors.text }]}>something went wrong</Text>
      <Text style={[Typography.body, styles.message, { color: colors.textSecondary }]}>
        JustTrack hit an unexpected error. Please try again.
      </Text>
      {__DEV__ ? (
        <Text selectable style={[Typography.footnote, styles.detail, { color: colors.text }]}>
          {error.message}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={retry}
        style={({ pressed }) => [styles.button, { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={[Typography.bodyEmphasized, { color: colors.onAccent }]}>try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'], gap: Spacing.md },
  message: { textAlign: 'center' },
  detail: { textAlign: 'center' },
  button: { marginTop: Spacing.lg, paddingVertical: Spacing.md, paddingHorizontal: Spacing['2xl'], borderRadius: Radii.full, minHeight: MIN_TAP, justifyContent: 'center' },
});
