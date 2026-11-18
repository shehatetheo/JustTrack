import React, { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { FastTag } from '@/components/fast/FastTag';
import { FoodThumb } from '@/components/food/FoodThumb';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { ThemedText } from '@/components/ui/ThemedText';
import { HAIRLINE, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useFastConflict } from '@/hooks/useFast';
import { amountLabel } from '@/lib/log/entries';
import type { LogEntry } from '@/types';
import { formatCalories, formatNumber } from '@/utils/format';

interface EntryRowProps {
  entry: LogEntry;
  isLast: boolean;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMore: () => void;
}

const ACCESSIBILITY_ACTIONS = [
  { name: 'activate', label: 'Edit' },
  { name: 'duplicate', label: 'Duplicate' },
  { name: 'delete', label: 'Delete' },
];

export function describeEntry(entry: LogEntry): string {
  const estimate = entry.isEstimate ? 'Estimated: ' : '';
  return `${entry.foodName}, ${amountLabel(entry)}. ${estimate}${formatCalories(entry.calories)}, ${formatNumber(entry.protein)} grams protein.`;
}

/** A swipe action: lavender for "again", an outlined gray for "delete". The words and icons carry the meaning, not a warning colour. */
function SwipeAction({ icon, label, quiet = false, onPress }: { icon: AppIconName; label: string; quiet?: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  const ink = quiet ? colors.text : colors.onAccent;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={[styles.action, { backgroundColor: quiet ? colors.surfaceRaised : colors.accent }]}>
      <AppIcon name={icon} size={18} color={ink} weight="semibold" />
      <ThemedText variant="caption2" style={{ color: ink }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/** One logged food: tap to edit, swipe left for Duplicate / Delete, long-press for the menu. */
export function EntryRow({ entry, isLast, onOpen, onDuplicate, onDelete, onMore }: EntryRowProps) {
  const { colors } = useAppTheme();
  const swipeable = useRef<SwipeableMethods>(null);
  const run = (action: () => void) => () => {
    swipeable.current?.close();
    action();
  };
  const detail = [entry.brand, amountLabel(entry)].filter(Boolean).join(' · ');
  const offFast = useFastConflict()(entry.foodName, entry.brand, entry.mealType);

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <View style={styles.actions}>
          <SwipeAction icon="duplicate" label="again" onPress={run(onDuplicate)} />
          <SwipeAction icon="trash" label="delete" quiet onPress={run(onDelete)} />
        </View>
      )}
    >
      <Pressable
        onPress={onOpen}
        onLongPress={onMore}
        accessibilityRole="button"
        accessibilityLabel={describeEntry(entry)}
        accessibilityActions={ACCESSIBILITY_ACTIONS}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'activate') onOpen();
          if (event.nativeEvent.actionName === 'duplicate') onDuplicate();
          if (event.nativeEvent.actionName === 'delete') onDelete();
        }}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: pressed ? colors.surfaceRaised : colors.surface },
          !isLast && { borderBottomWidth: HAIRLINE, borderBottomColor: colors.border },
        ]}
      >
        <FoodThumb name={entry.foodName} hints={[entry.brand]} imageUri={entry.imageUri} size={44} />
        <View style={styles.details}>
          <ThemedText variant="subheadEmphasized" numberOfLines={1}>
            {entry.foodName}
          </ThemedText>
          <View style={styles.detailRow}>
            {entry.isEstimate ? (
              <View style={[styles.badge, { borderColor: colors.borderAccent }]}>
                <ThemedText variant="caption2" style={{ color: colors.accentText }}>
                  ESTIMATED
                </ThemedText>
              </View>
            ) : null}
            {offFast ? <FastTag word={offFast} /> : null}
            <ThemedText variant="footnote" color="secondary" numberOfLines={1} style={styles.detailText}>
              {detail}
            </ThemedText>
          </View>
        </View>
        <ThemedText variant="subheadEmphasized" style={styles.tabular}>
          {formatCalories(entry.calories)}
        </ThemedText>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, minHeight: 56 },
  details: { flex: 1, gap: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  detailText: { flexShrink: 1 },
  badge: { paddingHorizontal: Spacing.xs + 2, paddingVertical: 1, borderRadius: Radii.sm, borderWidth: HAIRLINE },
  tabular: { fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row' },
  action: { width: 76, alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
});
