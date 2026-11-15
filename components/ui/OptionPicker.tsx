import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { showOptionSheet } from '@/utils/actionSheet';
import { AppIcon } from './AppIcon';
import { ThemedText } from './ThemedText';

interface OptionPickerProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * A "Label ····· Current value ⌄" row for picking one option. iOS opens the
 * native action sheet; elsewhere (web, Android) it expands an inline list.
 */
export function OptionPicker<T extends string>({ label, options, value, onChange }: OptionPickerProps<T>) {
  const { colors } = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const current = options.find((option) => option.value === value)?.label ?? '';
  const inline = Platform.OS !== 'ios';

  const open = () => {
    if (inline) {
      setExpanded((isOpen) => !isOpen);
      return;
    }
    showOptionSheet({ title: label, options, selected: value, onSelect: onChange });
  };

  return (
    <View>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current}`}
        accessibilityHint="Choose a different option"
        accessibilityState={inline ? { expanded } : undefined}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      >
        <ThemedText variant="body" color="secondary">
          {label}
        </ThemedText>
        <View style={styles.current}>
          <ThemedText variant="bodyEmphasized" numberOfLines={1} style={styles.currentText}>
            {current}
          </ThemedText>
          <AppIcon name="chevronDown" size={13} color={colors.textSecondary} weight="semibold" />
        </View>
      </Pressable>

      {inline && expanded ? (
        <View style={[styles.list, { borderColor: colors.border }]} accessibilityRole="radiogroup">
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  Haptics.selectionAsync();
                  setExpanded(false);
                  if (!selected) onChange(option.value);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.surfaceRaised }]}
              >
                <ThemedText variant="body" style={styles.optionText}>
                  {option.label}
                </ThemedText>
                {selected ? <AppIcon name="check" size={16} color={colors.accent} weight="semibold" /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    minHeight: 44,
  },
  current: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexShrink: 1 },
  currentText: { flexShrink: 1, textAlign: 'right' },
  list: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: Spacing.xs },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    minHeight: 44,
  },
  optionText: { flex: 1 },
});
