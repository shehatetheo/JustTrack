import { usePathname } from 'expo-router';
import React, { useRef, useState, useSyncExternalStore } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { PressScale, Stagger } from '@/components/motion';
import { HAIRLINE, MIN_TAP, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { dismissSheet, sheetStore, type DialogState, type OverlayState, type SheetState } from '@/utils/actionSheet';
import { AppIcon } from './AppIcon';
import { Button } from './Button';
import { BottomSheet, DialogCard } from './Sheet';
import { ThemedText } from './ThemedText';

/** The screens with nothing native on top of them: there the overlay can be drawn in place. */
const TAB_PATHS = new Set(['/', '/stats', '/scan', '/profile']);

/**
 * Draws whatever `sheetStore` holds: a sheet of options, or a dialog. One
 * instance, at the root. What the user picked runs only once the overlay
 * has left the screen, so an option is free to open another screen.
 */
export function ActionSheetHost() {
  const state = useSyncExternalStore(sheetStore.subscribe, sheetStore.getSnapshot, sheetStore.getSnapshot);
  const pathname = usePathname();
  // Keeps the content on screen while the overlay animates away.
  const [last, setLast] = useState<OverlayState | null>(state);
  if (state && state !== last) setLast(state);
  const after = useRef<(() => void) | null>(null);
  const inline = Platform.OS === 'web' || TAB_PATHS.has(pathname);

  const finish = (action: () => void) => {
    after.current = action;
    dismissSheet();
  };
  const closed = () => {
    const action = after.current;
    after.current = null;
    action?.();
  };

  const sheet: SheetState | null = last?.kind === 'sheet' ? last : null;
  const dialog: DialogState | null = last?.kind === 'dialog' ? last : null;

  return (
    <>
      <BottomSheet visible={state?.kind === 'sheet'} inline={inline} onClose={dismissSheet} onClosed={closed} title={sheet?.title} tagline={sheet?.tagline}>
        {sheet ? <Options key={`${sheet.title}-${sheet.options.length}`} sheet={sheet} onPick={finish} /> : null}
        <Button label="Cancel" variant="quiet" size="md" onPress={dismissSheet} />
      </BottomSheet>
      <DialogCard visible={state?.kind === 'dialog'} inline={inline} onClose={() => dialog && finish(dialog.onCancel)} onClosed={closed} title={dialog?.title} tagline={dialog?.message}>
        {dialog ? (
          <View style={styles.dialogActions}>
            <Button label={dialog.confirmLabel} onPress={() => finish(dialog.onConfirm)} />
            {dialog.cancelLabel ? <Button label={dialog.cancelLabel} variant="quiet" size="md" onPress={() => finish(dialog.onCancel)} /> : null}
          </View>
        ) : null}
      </DialogCard>
    </>
  );
}

function Options({ sheet, onPick }: { sheet: SheetState; onPick: (action: () => void) => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.options, { borderColor: colors.border, backgroundColor: colors.surfaceRaised }]} accessibilityRole="menu">
      {sheet.options.map((option, index) => (
        <Stagger key={`${option.label}-${index}`} index={index} delay={90}>
        <PressScale
          onPress={() => onPick(option.onPress)}
          pressScale={0.985}
          haptic="select"
          accessibilityRole="menuitem"
          accessibilityLabel={option.caption ? `${option.label}, ${option.caption}` : option.label}
          accessibilityState={{ selected: Boolean(option.selected) }}
          style={[styles.option, index > 0 && { borderTopWidth: HAIRLINE, borderTopColor: colors.border }]}
        >
          {option.icon ? (
            <View style={[styles.glyph, { borderColor: colors.borderAccent, backgroundColor: colors.surface }]}>
              <AppIcon name={option.icon} size={18} color={colors.accentText} weight="semibold" />
            </View>
          ) : null}
          <View style={styles.words}>
            <ThemedText variant="bodyEmphasized" style={option.destructive ? { color: colors.textSecondary } : null}>
              {option.label.toLowerCase()}
            </ThemedText>
            {option.caption ? (
              <ThemedText variant="footnote" color="secondary" numberOfLines={2}>
                {option.caption}
              </ThemedText>
            ) : null}
          </View>
          {option.selected ? <AppIcon name="check" size={16} color={colors.accentText} weight="semibold" /> : null}
        </PressScale>
        </Stagger>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  options: { borderRadius: Radii.xl, borderWidth: HAIRLINE, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, minHeight: MIN_TAP + 8 },
  glyph: { width: 38, height: 38, borderRadius: Radii.full, borderWidth: HAIRLINE, alignItems: 'center', justifyContent: 'center' },
  words: { flex: 1, gap: 1 },
  dialogActions: { gap: Spacing.xs, marginTop: Spacing.sm },
});
