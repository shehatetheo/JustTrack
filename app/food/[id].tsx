import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FoodDataAttribution } from '@/components/food/FoodDataAttribution';
import { FoodHero } from '@/components/food/FoodHero';
import { LogButton } from '@/components/food/LogButton';
import { MealTypePicker } from '@/components/food/MealTypePicker';
import { NutritionColumns } from '@/components/food/NutritionColumns';
import { PortionEditor } from '@/components/food/PortionEditor';
import { SkeletonRows } from '@/components/food/SkeletonRows';
import { SheetHeader } from '@/components/layout/SheetHeader';
import { CountUp, InkReveal, Stagger } from '@/components/motion';
import { EmptyState } from '@/components/ui/EmptyState';
import { ThemedText } from '@/components/ui/ThemedText';
import { Duration } from '@/constants/motion';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { HAIRLINE, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useFood } from '@/hooks/useFood';
import { usePortion } from '@/hooks/usePortion';
import { createEntry, entryFromFood } from '@/lib/log/entries';
import { addEntries } from '@/lib/log/logStore';
import type { MealType } from '@/types';
import { formatNumber } from '@/utils/format';
import { defaultMealType } from '@/utils/mealTime';
import { mealTypeParam, singleParam } from '@/utils/routeParams';

const NO_NUTRITION = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/** One food: a photo or an ink drawing at the top, the calories and macros counting along with the portion, and one button to log it. */
export default function AddFoodScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string; mealType?: string }>();
  const { now } = useCurrentTime();

  const foodId = singleParam(params.id);
  const [mealType, setMealType] = useState<MealType>(() => mealTypeParam(params.mealType) ?? defaultMealType(now));
  const { food, error: loadError, retry } = useFood(foodId);
  const portion = usePortion(food);

  const closeFlow = () => {
    // Close the whole Add Food modal, not just this screen.
    const parent = navigation.getParent();
    if (parent?.canGoBack()) parent.goBack();
    else router.replace('/');
  };

  const add = () => {
    const item = food && portion.stored ? entryFromFood(food, portion.stored, mealType) : null;
    if (item) addEntries([createEntry(item, new Date())]);
  };
  const canGoBack = router.canGoBack();

  if (!food) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <SheetHeader title="Food" onBack={canGoBack ? () => router.back() : undefined} onClose={closeFlow} />
        {loadError ? <EmptyState title="lost it" message={loadError} actionLabel="Try again" onAction={retry} /> : <SkeletonRows count={5} />}
      </View>
    );
  }

  const nutrition = portion.nutrition ?? NO_NUTRITION;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <FoodHero
          title={food.name}
          subtitle={food.brand ?? food.category ?? null}
          amount={portion.description ?? null}
          amountCaption="portion"
          imageUri={food.imageUrl}
          tintHints={[food.category, food.brand]}
          badge={food.source === 'usda' ? 'USDA' : food.source === 'chain' ? 'MENU' : 'PACKAGED'}
          onBack={canGoBack ? () => router.back() : closeFlow}
          backIcon={canGoBack ? 'back' : 'close'}
          onClose={canGoBack ? closeFlow : undefined}
        />

        <View style={styles.body}>
          <InkReveal>
            <View style={styles.caloriesRow}>
              <CountUp value={nutrition.calories} durationMs={Duration.standard} format={(value) => formatNumber(value)} variant="figure" />
              <ThemedText variant="overline" color="secondary" style={styles.unit}>
                KCAL IN THIS PORTION
              </ThemedText>
            </View>
          </InkReveal>

          <Stagger index={1}>
            <NutritionColumns nutrition={nutrition} />
          </Stagger>
          <Stagger index={2}>
            <PortionEditor portion={portion} />
          </Stagger>

          <Stagger index={3} style={styles.meal}>
            <ThemedText variant="overline" color="tertiary">
              ADD TO
            </ThemedText>
            <MealTypePicker value={mealType} onChange={setMealType} />
          </Stagger>
          <FoodDataAttribution />
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + Spacing.md }]}>
        <LogButton label={`Add to ${MEAL_TYPE_META[mealType].label}`} onLog={add} onDone={closeFlow} disabled={!portion.stored} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: Spacing['3xl'] },
  body: { paddingHorizontal: Spacing.lg, gap: Spacing.lg, paddingTop: Spacing.lg },
  caloriesRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  unit: { flexShrink: 1 },
  meal: { gap: Spacing.sm },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: HAIRLINE },
});
