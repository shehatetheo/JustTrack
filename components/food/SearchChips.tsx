import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
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
  const { colors } = useAppTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroller} contentContainerStyle={styles.row} keyboardShouldPersistTaps="handled">
      {options.map((option) => {
        const active = option.value === selected;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(option.value);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.count !== undefined ? `${option.label}, ${option.count}` : option.label}
            style={({ pressed }) => [styles.chip, { backgroundColor: active ? colors.accent : colors.surfaceRaised, opacity: pressed ? 0.8 : 1 }]}
          >
            <ThemedText variant="subheadEmphasized" style={{ color: active ? colors.onAccent : colors.text }}>
              {option.label}
            </ThemedText>
            {option.count !== undefined ? (
              <ThemedText variant="caption1" style={{ color: active ? colors.onAccent : colors.textSecondary, opacity: 0.8 }}>
                {option.count}
              </ThemedText>
            ) : null}
          </Pressable>
        );
      })}
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
        <ThemedText variant="footnote" color="secondary" style={styles.title}>
          {title.toUpperCase()}
        </ThemedText>
        {onClear ? (
          <Pressable onPress={onClear} accessibilityRole="button" accessibilityLabel={`Clear ${title.toLowerCase()}`} hitSlop={8}>
            <ThemedText variant="footnote" style={{ color: colors.accent, fontWeight: '600' }}>
              Clear
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.wrap}>
        {terms.map((term) => (
          <Pressable
            key={term}
            onPress={() => {
              Haptics.selectionAsync();
              onPick(term);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Search ${term}`}
            style={({ pressed }) => [styles.term, { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 }]}
          >
            <ThemedText variant="subhead">{term}</ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroller: { flexGrow: 0, flexShrink: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingHorizontal: Spacing.md + 2, paddingVertical: Spacing.sm, borderRadius: 999 },
  block: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { letterSpacing: 0.5 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  term: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 999 },
});
