import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FoodThumb } from '@/components/food/FoodThumb';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { displayItemName, informativeServing } from '@/lib/food/itemName';
import { defaultServing } from '@/lib/nutrition/portion';
import type { FoodDetail } from '@/types';
import { formatNumber } from '@/utils/format';

interface FoodSearchRowProps {
  food: FoodDetail;
  onPress: () => void;
  /** Other results share this name; show the macros so the user can tell them apart. */
  disambiguate?: boolean;
  /** On a chain's own menu page the brand is a given. */
  hideBrand?: boolean;
  /** Everyday and packaged foods get a picture; menu items are text, the chain is named once above. */
  thumb?: boolean;
  /** Rounds the card's corners on the first and last row of a group. */
  position?: 'first' | 'middle' | 'last' | 'only';
}

/** One result: the name, one quiet line of context, and the calories in a pill. */
export function FoodSearchRow({ food, onPress, disambiguate = false, hideBrand = false, thumb = food.source !== 'chain', position = 'middle' }: FoodSearchRowProps) {
  const { colors } = useAppTheme();
  const serving = defaultServing(food);
  const name = food.source === 'chain' && food.brand ? displayItemName(food.brand, food.name) : food.name;
  const macros = `P ${formatNumber(serving.protein)} · C ${formatNumber(serving.carbs)} · F ${formatNumber(serving.fat)} g`;
  const detail = [hideBrand ? null : food.brand, food.detail, informativeServing(serving.description), disambiguate ? macros : null].filter(Boolean).join(' · ');
  const calories = formatNumber(serving.calories);
  const rounded = {
    borderTopLeftRadius: position === 'first' || position === 'only' ? 20 : 0,
    borderTopRightRadius: position === 'first' || position === 'only' ? 20 : 0,
    borderBottomLeftRadius: position === 'last' || position === 'only' ? 20 : 0,
    borderBottomRightRadius: position === 'last' || position === 'only' ? 20 : 0,
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[name, hideBrand ? null : food.brand, `${calories} calories per ${serving.description}`].filter(Boolean).join(', ')}
      accessibilityHint="Choose an amount and add it to your diary"
      style={({ pressed }) => [styles.row, rounded, { backgroundColor: pressed ? colors.surfaceRaised : colors.surface }, position !== 'last' && position !== 'only' && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
    >
      {thumb ? <FoodThumb name={food.name} hints={[food.category, food.brand]} imageUri={food.imageUrl} size={40} radius={12} /> : null}
      <View style={styles.text}>
        <ThemedText variant="body" numberOfLines={2}>
          {name}
        </ThemedText>
        {detail ? (
          <ThemedText variant="footnote" color="secondary" numberOfLines={1}>
            {detail}
          </ThemedText>
        ) : null}
      </View>
      <View style={[styles.pill, { backgroundColor: colors.surface }]}>
        <ThemedText variant="subheadEmphasized" style={styles.tabular}>
          {calories}
        </ThemedText>
        <ThemedText variant="caption2" color="secondary">
          cal
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, minHeight: 60 },
  text: { flex: 1, gap: 2 },
  pill: { flexDirection: 'row', alignItems: 'baseline', gap: 3, paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.xs + 1, borderRadius: 999 },
  tabular: { fontVariant: ['tabular-nums'] },
});
