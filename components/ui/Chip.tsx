import React from 'react';
import { StyleSheet, View, type AccessibilityRole, type StyleProp, type ViewStyle } from 'react-native';

import { PressScale } from '@/components/motion';
import type { HapticName } from '@/constants/motion';
import { HAIRLINE, MIN_TAP, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { ThemedText } from './ThemedText';

interface ChipProps {
  label: string;
  /** A second, smaller line, or a count beside the label. */
  detail?: string;
  /** Put the detail under the label instead of beside it. */
  stacked?: boolean;
  selected?: boolean;
  onPress: () => void;
  haptic?: HapticName | null;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  /** For a checkbox or radio; a tab or plain button reads `selected`. */
  checked?: boolean;
  style?: StyleProp<ViewStyle>;
}

const HEIGHT = 38;

/** A pill you tap to choose something: outlined when idle, a lavender plate when chosen. */
export function Chip({ label, detail, stacked = false, selected = false, onPress, haptic = 'select', accessibilityRole = 'button', accessibilityLabel, checked, style }: ChipProps) {
  const { colors } = useAppTheme();
  const ink = selected ? colors.onAccent : colors.text;
  const quiet = selected ? colors.onAccent : colors.textSecondary;
  return (
    <PressScale
      onPress={onPress}
      haptic={haptic}
      hitSlop={(MIN_TAP - HEIGHT) / 2}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? (detail ? `${label}, ${detail}` : label)}
      accessibilityState={checked === undefined ? { selected } : { checked }}
      style={[styles.chip, stacked && styles.stacked, { backgroundColor: selected ? colors.accent : colors.surface, borderColor: selected ? colors.accent : colors.border }, style]}
    >
      <ThemedText variant={stacked ? 'footnoteEmphasized' : 'subhead'} numberOfLines={1} style={{ color: ink }}>
        {label}
      </ThemedText>
      {detail ? (
        <View>
          <ThemedText variant={stacked ? 'caption2' : 'caption1'} numberOfLines={1} style={{ color: quiet }}>
            {detail}
          </ThemedText>
        </View>
      ) : null}
    </PressScale>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs + 2, minHeight: HEIGHT, paddingHorizontal: Spacing.md + 2, borderRadius: Radii.full, borderWidth: HAIRLINE },
  stacked: { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 1, minHeight: MIN_TAP, paddingVertical: Spacing.xs + 2, borderRadius: Radii.lg },
});
