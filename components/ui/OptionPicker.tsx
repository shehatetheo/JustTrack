import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressScale } from '@/components/motion';
import { HAIRLINE, MIN_TAP, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { AppIcon } from './AppIcon';
import { ThemedText } from './ThemedText';

interface OptionPickerProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** A "Label ····· Current value ⌄" row that opens its choices in place, so picking one never leaves the screen. */
export function OptionPicker<T extends string>({ label, options, value, onChange }: OptionPickerProps<T>) {
  const { colors } = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const current = options.find((option) => option.value === value)?.label ?? '';

  return (
    <View>
      <PressScale
        onPress={() => setExpanded((isOpen) => !isOpen)}
        pressScale={0.99}
        haptic="select"
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current}`}
        accessibilityHint="Choose a different option"
        accessibilityState={{ expanded }}
        style={styles.row}
      >
        <ThemedText variant="body" color="secondary">
          {label}
        </ThemedText>
        <View style={styles.current}>
          <ThemedText variant="bodyEmphasized" numberOfLines={1} style={styles.currentText}>
            {current}
          </ThemedText>
          <AppIcon name={expanded ? 'chevronUp' : 'chevronDown'} size={13} color={colors.textSecondary} weight="semibold" />
        </View>
      </PressScale>

      {expanded ? (
        <View style={[styles.list, { borderTopColor: colors.border }]} accessibilityRole="radiogroup">
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <PressScale
                key={option.value}
                onPress={() => {
                  setExpanded(false);
                  if (!selected) onChange(option.value);
                }}
                pressScale={0.99}
                haptic="select"
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                style={styles.option}
              >
                <ThemedText variant="body" style={[styles.optionText, selected ? { color: colors.accentText } : null]}>
                  {option.label}
                </ThemedText>
                {selected ? <AppIcon name="check" size={16} color={colors.accentText} weight="semibold" /> : null}
              </PressScale>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md, minHeight: MIN_TAP },
  current: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexShrink: 1 },
  currentText: { flexShrink: 1, textAlign: 'right' },
  list: { borderTopWidth: HAIRLINE, marginTop: Spacing.xs },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md, minHeight: MIN_TAP },
  optionText: { flex: 1 },
});
