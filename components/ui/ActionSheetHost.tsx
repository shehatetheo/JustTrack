import * as Haptics from 'expo-haptics';
import React, { useSyncExternalStore } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { sheetStore, dismissSheet } from '@/utils/actionSheet';
import { AppIcon } from './AppIcon';
import { ThemedText } from './ThemedText';

/**
 * The bottom sheet behind showOptionSheet / showActionMenu everywhere iOS's
 * native action sheet isn't available (the web, Android). Rendered once, at
 * the root; it shows whatever the store currently holds.
 */
export function ActionSheetHost() {
  const sheet = useSyncExternalStore(sheetStore.subscribe, sheetStore.getSnapshot, sheetStore.getSnapshot);
  const { colors, shadows } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={sheet !== null} transparent animationType="fade" onRequestClose={dismissSheet}>
      <Pressable style={styles.backdrop} onPress={dismissSheet} accessibilityRole="button" accessibilityLabel="Dismiss" />
      {sheet ? (
        <View style={[styles.sheet, shadows.lg, { backgroundColor: colors.surface, paddingBottom: insets.bottom + Spacing.lg }]} accessibilityViewIsModal>
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />
          {sheet.title ? (
            <ThemedText variant="headline" style={styles.title} accessibilityRole="header">
              {sheet.title}
            </ThemedText>
          ) : null}
          {sheet.message ? (
            <ThemedText variant="footnote" color="secondary" style={styles.message}>
              {sheet.message}
            </ThemedText>
          ) : null}
          <View style={[styles.options, { backgroundColor: colors.surface }]}>
            {sheet.options.map((option, index) => (
              <Pressable
                key={`${option.label}-${index}`}
                onPress={() => {
                  Haptics.selectionAsync();
                  dismissSheet();
                  option.onPress();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: option.selected }}
                style={({ pressed }) => [
                  styles.option,
                  index < sheet.options.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                  pressed && { backgroundColor: colors.surfaceRaised },
                ]}
              >
                <ThemedText variant="body" style={{ color: option.destructive ? colors.text : colors.text }}>
                  {option.label}
                </ThemedText>
                {option.selected ? <AppIcon name="check" size={16} color={colors.accent} weight="semibold" /> : null}
              </Pressable>
            ))}
          </View>
          <Pressable onPress={dismissSheet} accessibilityRole="button" style={({ pressed }) => [styles.cancel, { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 }]}>
            <ThemedText variant="bodyEmphasized">Cancel</ThemedText>
          </Pressable>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(16,10,40,0.45)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: Radii['2xl'], borderTopRightRadius: Radii['2xl'], padding: Spacing.lg, gap: Spacing.sm, maxWidth: 480, alignSelf: 'center', width: '100%', marginHorizontal: 'auto' },
  grabber: { width: 40, height: 5, borderRadius: Radii.full, alignSelf: 'center', marginBottom: Spacing.xs },
  title: { textAlign: 'center' },
  message: { textAlign: 'center', marginBottom: Spacing.xs },
  options: { borderRadius: Radii.lg, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md + 2, paddingHorizontal: Spacing.lg, minHeight: 50 },
  cancel: { alignItems: 'center', justifyContent: 'center', borderRadius: Radii.lg, minHeight: 50, marginTop: Spacing.xs },
});
