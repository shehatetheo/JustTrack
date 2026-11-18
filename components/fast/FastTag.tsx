import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { HAIRLINE, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

/**
 * A small outlined label on a food that looks like something being given
 * up for the fast: "MEAT". It is a note, not a warning: the same quiet
 * outline as "ESTIMATED", and it never stops the food being logged.
 */
export function FastTag({ word }: { word: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.tag, { borderColor: colors.border }]} accessible accessibilityLabel={`Looks like ${word}, which you are fasting from`}>
      <ThemedText variant="caption2" color="secondary">
        {word.toUpperCase()}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { paddingHorizontal: Spacing.xs + 2, paddingVertical: 1, borderRadius: Radii.sm, borderWidth: HAIRLINE, borderStyle: 'dashed' },
});
