import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Shimmer } from '@/components/motion';
import { HAIRLINE, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

/** Placeholder rows while foods load: dark blocks with a slow band of lavender light crossing them. */
export function SkeletonRows({ count = 3 }: { count?: number }) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityLabel="Loading foods" accessible>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={[styles.row, index < count - 1 && { borderBottomWidth: HAIRLINE, borderBottomColor: colors.border }]}>
          <Shimmer style={styles.thumb} />
          <View style={styles.lines}>
            <Shimmer style={[styles.line, styles.long]} />
            <Shimmer style={[styles.line, styles.short]} />
          </View>
          <Shimmer style={styles.pill} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: Spacing.lg, borderRadius: Radii.lg, borderWidth: HAIRLINE, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, minHeight: 60 },
  thumb: { width: 40, height: 40, borderRadius: Radii.md },
  lines: { flex: 1, gap: Spacing.sm },
  line: { height: 12, borderRadius: Radii.sm },
  long: { width: '62%' },
  short: { width: '38%' },
  pill: { width: 56, height: 24, borderRadius: Radii.full },
});
