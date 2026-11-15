import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PressScale } from '@/components/motion';
import { HAIRLINE, MIN_TAP, Radii } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { ThemedText } from './ThemedText';

interface PillTabsProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

/** A segmented control: a dark track with a lavender plate on the chosen option. */
export function PillTabs<T extends string>({ options, value, onChange, accessibilityLabel }: PillTabsProps<T>) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.track, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <PressScale
            key={option.value}
            onPress={() => {
              if (!selected) onChange(option.value);
            }}
            haptic={selected ? null : 'select'}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.pill, selected && { backgroundColor: colors.accent }]}
          >
            <ThemedText variant="subheadEmphasized" style={{ color: selected ? colors.onAccent : colors.textSecondary }}>
              {option.label.toLowerCase()}
            </ThemedText>
          </PressScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 3, borderRadius: Radii.full, borderWidth: HAIRLINE },
  pill: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: Radii.full, minHeight: MIN_TAP - 8 },
});
