import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseButton } from '@/components/ui/CloseButton';
import { ThemedText } from '@/components/ui/ThemedText';
import { HAIRLINE, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

interface SheetHeaderProps {
  title: string;
  /** One italic line under the title. */
  tagline?: string;
  /** Shows a chevron on the left: this screen was pushed from another one in the same sheet. */
  onBack?: () => void;
  /** Shows an X on the right: leaves the whole sheet. */
  onClose?: () => void;
  /** Replaces the X, for the rare screen with its own action there. */
  accessory?: React.ReactNode;
  /** Floats over a photo or the camera: white ink, no rule. */
  onPhoto?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SLOT = 44;

/**
 * The header of every screen that isn't a tab: back on the left, the name in
 * spaced capitals with an italic line beneath, close on the right. One
 * pattern, so leaving a screen is always in the same place.
 */
export function SheetHeader({ title, tagline, onBack, onClose, accessory, onPhoto = false, style }: SheetHeaderProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + Spacing.md, borderBottomColor: onPhoto ? 'transparent' : colors.border }, style]}>
      <View style={styles.slot}>{onBack ? <CloseButton back onPress={onBack} onPhoto={onPhoto} /> : null}</View>
      <View style={styles.words}>
        <ThemedText variant="title3" numberOfLines={1} style={[styles.center, onPhoto ? { color: colors.onHero } : null]} accessibilityRole="header">
          {title.toLowerCase()}
        </ThemedText>
        {tagline ? (
          <ThemedText variant="tagline" color="secondary" numberOfLines={1} style={[styles.center, onPhoto ? { color: colors.onHeroMuted } : null]}>
            {tagline}
          </ThemedText>
        ) : null}
      </View>
      <View style={[styles.slot, styles.right]}>{accessory ?? (onClose ? <CloseButton onPress={onClose} onPhoto={onPhoto} /> : null)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: HAIRLINE },
  slot: { width: SLOT, minHeight: SLOT, justifyContent: 'center', alignItems: 'flex-start' },
  right: { alignItems: 'flex-end' },
  words: { flex: 1, alignItems: 'center', gap: Spacing.xxs },
  center: { textAlign: 'center' },
});
