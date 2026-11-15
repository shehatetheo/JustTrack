import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { HAIRLINE, MIN_TAP, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { AppIcon } from './AppIcon';
import { FocusLine } from './FocusLine';

interface SearchFieldProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  loading?: boolean;
  ref?: React.Ref<TextInput>;
}

/** The search field: a dark well with a lavender line that draws across its foot on focus, a clear button, and a spinner while results load. */
export function SearchField({ value, onChangeText, loading = false, placeholder = 'search', ref, onFocus, onBlur, ...rest }: SearchFieldProps) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppIcon name="search" size={17} color={focused ? colors.accentText : colors.textSecondary} />
      <TextInput
        {...rest}
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.accent}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityRole="search"
        accessibilityLabel={rest.accessibilityLabel ?? placeholder}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[Typography.body, styles.input, { color: colors.text }]}
      />
      {loading ? <ActivityIndicator size="small" color={colors.accent} /> : null}
      {value.length > 0 && !loading ? (
        <Pressable onPress={() => onChangeText('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={12}>
          <AppIcon name="closeCircle" size={17} color={colors.textTertiary} />
        </Pressable>
      ) : null}
      <FocusLine active={focused} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radii.lg, borderWidth: HAIRLINE, paddingHorizontal: Spacing.md, minHeight: MIN_TAP + 4, overflow: 'hidden' },
  // No browser focus ring: the line at the foot is the focus mark.
  input: { flex: 1, paddingVertical: Spacing.sm, outlineWidth: 0 },
});
