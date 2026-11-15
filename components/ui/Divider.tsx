import React from 'react';
import { StyleSheet, View } from 'react-native';

import { HAIRLINE, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { ThemedText } from './ThemedText';

/** Hairline divider with an optional centered label ("or"). */
export function Divider({ label }: { label?: string }) {
  const { colors } = useAppTheme();
  const line = <View style={[styles.line, { backgroundColor: colors.border }]} />;

  if (!label) return line;

  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {line}
      <ThemedText variant="footnote" color="tertiary">
        {label}
      </ThemedText>
      {line}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  line: { flex: 1, height: HAIRLINE },
});
