import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EntryRow } from '@/components/food/EntryRow';
import { FoodThumbStack } from '@/components/food/FoodThumb';
import { AppIcon } from '@/components/ui/AppIcon';
import { ThemedText } from '@/components/ui/ThemedText';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useEntryActions } from '@/hooks/useEntryActions';
import { macroShares, type MealSection } from '@/lib/log/entries';
import { formatNumber } from '@/utils/format';

interface MealCardProps {
  section: MealSection;
  onAdd: () => void;
}

/**
 * One meal: name, calories, the macro split as little pills, a + button,
 * and whatever's been logged to it. When a meal has a photo, the photo is
 * the card.
 */
export function MealCard({ section, onAdd }: MealCardProps) {
  const { colors } = useAppTheme();
  const actions = useEntryActions();
  const meta = MEAL_TYPE_META[section.mealType];
  const hasEntries = section.entries.length > 0;
  const cover = section.entries.find((entry) => entry.imageUri)?.imageUri ?? null;
  const onCover = Boolean(cover);
  const textColor = onCover ? '#FFFFFF' : colors.text;
  const mutedColor = onCover ? 'rgba(255,255,255,0.8)' : colors.textSecondary;
  const shares = macroShares(section.totals);
  const pills = [
    { label: 'Protein', value: shares.protein },
    { label: 'Carbs', value: shares.carbs },
    { label: 'Fat', value: shares.fat },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceTint, borderColor: colors.border }]}>
      <View style={[styles.top, onCover && styles.topCover]}>
        {cover ? (
          <>
            <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} accessibilityIgnoresInvertColors />
            <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.72)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
          </>
        ) : null}
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <ThemedText variant="headline" style={{ color: textColor }} accessibilityRole="header">
              {meta.label}
            </ThemedText>
            <ThemedText variant="footnote" style={[styles.tabular, { color: mutedColor }]}>
              {hasEntries ? `${formatNumber(section.totals.calories)} kcal` : 'Nothing yet'}
            </ThemedText>
          </View>
          {hasEntries && !cover ? <FoodThumbStack items={section.entries.map((entry) => ({ name: entry.foodName, imageUri: entry.imageUri, hints: [entry.brand] }))} /> : null}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onAdd();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Add food to ${meta.label}`}
            hitSlop={6}
            style={({ pressed }) => [styles.addButton, { backgroundColor: onCover ? '#FFFFFF' : colors.surfaceTintStrong, borderColor: onCover ? 'transparent' : colors.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <AppIcon name="plus" size={18} color={onCover ? '#0A0A0B' : colors.text} weight="semibold" />
          </Pressable>
        </View>

        {hasEntries ? (
          <ThemedText variant="caption1" style={[styles.macroLine, styles.tabular, { color: mutedColor }]} accessibilityLabel={pills.map((pill) => `${pill.label} ${Math.round(pill.value * 100)} percent`).join(', ')}>
            {pills.map((pill) => `${pill.label.charAt(0)} ${Math.round(pill.value * 100)}%`).join('   ·   ')}
          </ThemedText>
        ) : null}
      </View>

      {hasEntries ? (
        <View style={[styles.entries, { borderTopColor: colors.border }]}>
          {section.entries.map((entry, index) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              isLast={index === section.entries.length - 1}
              onOpen={() => actions.open(entry)}
              onDuplicate={() => actions.duplicate(entry)}
              onDelete={() => actions.remove(entry)}
              onMore={() => actions.more(entry)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radii.xl, borderWidth: StyleSheet.hairlineWidth * 2, overflow: 'hidden' },
  top: { overflow: 'hidden' },
  topCover: { minHeight: 132, justifyContent: 'flex-end' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md, padding: Spacing.lg, paddingBottom: Spacing.md },
  titleBlock: { flex: 1, gap: 2 },
  addButton: { width: 40, height: 40, borderRadius: Radii.md, borderWidth: StyleSheet.hairlineWidth * 2, alignItems: 'center', justifyContent: 'center' },
  macroLine: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, letterSpacing: 0.2 },
  entries: { borderTopWidth: StyleSheet.hairlineWidth },
  tabular: { fontVariant: ['tabular-nums'] },
});
