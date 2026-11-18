import React from 'react';
import { StyleSheet, View } from 'react-native';

import { FastTag } from '@/components/fast/FastTag';
import { FoodThumb } from '@/components/food/FoodThumb';
import { PressScale } from '@/components/motion';
import { ThemedText } from '@/components/ui/ThemedText';
import { HAIRLINE, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useFastConflict } from '@/hooks/useFast';
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
  /** Rounds the panel's corners on the first and last row of a group. */
  position?: 'first' | 'middle' | 'last' | 'only';
}

/** One result: the name, one quiet line of context, and the calories at the right. */
export function FoodSearchRow({ food, onPress, disambiguate = false, hideBrand = false, thumb = food.source !== 'chain', position = 'middle' }: FoodSearchRowProps) {
  const { colors } = useAppTheme();
  const serving = defaultServing(food);
  const name = food.source === 'chain' && food.brand ? displayItemName(food.brand, food.name) : food.name;
  const macros = `P ${formatNumber(serving.protein)} · C ${formatNumber(serving.carbs)} · F ${formatNumber(serving.fat)} g`;
  const detail = [hideBrand ? null : food.brand, food.detail, informativeServing(serving.description), disambiguate ? macros : null].filter(Boolean).join(' · ');
  const calories = formatNumber(serving.calories);
  // During a fast, a result that looks like something set aside says so before it is opened.
  const offFast = useFastConflict()(food.name, food.brand);
  const top = position === 'first' || position === 'only';
  const bottom = position === 'last' || position === 'only';

  return (
    <PressScale
      onPress={onPress}
      pressScale={0.985}
      haptic="tap"
      accessibilityRole="button"
      accessibilityLabel={[name, hideBrand ? null : food.brand, `${calories} calories per ${serving.description}`].filter(Boolean).join(', ')}
      accessibilityHint="Choose an amount and add it to your diary"
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border, borderTopWidth: top ? HAIRLINE : 0, borderBottomWidth: HAIRLINE },
        top && styles.top,
        bottom && styles.bottom,
      ]}
    >
      {thumb ? <FoodThumb name={food.name} hints={[food.category, food.brand]} imageUri={food.imageUrl} size={40} radius={Radii.md} /> : null}
      <View style={styles.text}>
        <ThemedText variant="body" numberOfLines={2}>
          {name}
        </ThemedText>
        {detail || offFast ? (
          <View style={styles.detailRow}>
            {offFast ? <FastTag word={offFast} /> : null}
            {detail ? (
              <ThemedText variant="footnote" color="secondary" numberOfLines={1} style={styles.detail}>
                {detail}
              </ThemedText>
            ) : null}
          </View>
        ) : null}
      </View>
      <View style={styles.calories}>
        <ThemedText variant="subheadEmphasized" style={styles.tabular}>
          {calories}
        </ThemedText>
        <ThemedText variant="caption2" color="secondary">
          cal
        </ThemedText>
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, minHeight: 60, borderLeftWidth: HAIRLINE, borderRightWidth: HAIRLINE },
  top: { borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl },
  bottom: { borderBottomLeftRadius: Radii.xl, borderBottomRightRadius: Radii.xl },
  text: { flex: 1, gap: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  detail: { flexShrink: 1 },
  calories: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  tabular: { fontVariant: ['tabular-nums'] },
});
