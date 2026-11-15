import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PressScale } from '@/components/motion';
import { Chip } from '@/components/ui/Chip';
import { ThemedText } from '@/components/ui/ThemedText';
import { MIN_TAP, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface FilterChipsProps<T extends string> {
  options: readonly ChipOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

/** A single-choice row of pills, like the "All / Restaurants / …" filter over results. */
export function FilterChips<T extends string>({ options, selected, onSelect }: FilterChipsProps<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroller} contentContainerStyle={styles.row} keyboardShouldPersistTaps="handled">
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label.toLowerCase()}
          detail={option.count !== undefined ? String(option.count) : undefined}
          selected={option.value === selected}
          onPress={() => onSelect(option.value)}
          accessibilityRole="radio"
          accessibilityLabel={option.count !== undefined ? `${option.label}, ${option.count}` : option.label}
        />
      ))}
    </ScrollView>
  );
}

interface TermChipsProps {
  title: string;
  terms: readonly string[];
  onPick: (term: string) => void;
  onClear?: () => void;
}

/** Tap-to-search terms: recents, or suggestions when there are none yet. */
export function TermChips({ title, terms, onPick, onClear }: TermChipsProps) {
  const { colors } = useAppTheme();
  if (terms.length === 0) return null;

  return (
    <View style={styles.block}>
      <View style={styles.titleRow}>
        <ThemedText variant="overline" color="tertiary">
          {title.toUpperCase()}
        </ThemedText>
        {onClear ? (
          <PressScale onPress={onClear} haptic="select" accessibilityRole="button" accessibilityLabel={`Clear ${title.toLowerCase()}`} hitSlop={12} style={styles.clear}>
            <ThemedText variant="footnote" style={[styles.strong, { color: colors.accentText }]}>
              clear
            </ThemedText>
          </PressScale>
        ) : null}
      </View>
      <View style={styles.wrap}>
        {terms.map((term) => (
          <Chip key={term} label={term} onPress={() => onPick(term)} accessibilityLabel={`Search ${term}`} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroller: { flexGrow: 0, flexShrink: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  block: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: MIN_TAP / 2 },
  clear: { justifyContent: 'center' },
  strong: { fontWeight: '600' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
