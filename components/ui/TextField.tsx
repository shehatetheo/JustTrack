import React, { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { HAIRLINE, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { FocusLine } from './FocusLine';
import { ThemedText } from './ThemedText';

interface TextFieldProps extends TextInputProps {
  label: string;
  suffix?: string;
  error?: string | null;
  ref?: React.Ref<TextInput>;
}

export function TextField({ label, suffix, error, style, onFocus, onBlur, ref, ...rest }: TextFieldProps) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <ThemedText variant="overline" color="tertiary" style={styles.label}>
        {label.toUpperCase()}
      </ThemedText>
      <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          {...rest}
          ref={ref}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.accent}
          style={[Typography.body, styles.input, { color: colors.text }, style]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {suffix ? (
          <ThemedText variant="body" color="secondary">
            {suffix}
          </ThemedText>
        ) : null}
        <FocusLine active={focused} error={Boolean(error)} />
      </View>
      {error ? (
        <ThemedText variant="footnote" style={{ color: colors.text }} accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs, flex: 1 },
  label: { marginLeft: Spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    borderWidth: HAIRLINE,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  // minWidth 0 lets the input shrink on web, where it otherwise keeps a default width and pushes the suffix out.
  input: { flex: 1, minWidth: 0, paddingVertical: Spacing.md, outlineWidth: 0 },
});
