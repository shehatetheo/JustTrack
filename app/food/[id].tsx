import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { FoodDataAttribution } from '@/components/food/FoodDataAttribution';
import { FoodHero } from '@/components/food/FoodHero';
import { MealTypePicker } from '@/components/food/MealTypePicker';
import { NutritionColumns } from '@/components/food/NutritionColumns';
import { PortionEditor } from '@/components/food/PortionEditor';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ThemedText } from '@/components/ui/ThemedText';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { Spacing } from '@/constants/theme';
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

/** One food: a photo or tinted hero, the macro columns, the portion, and one button to log it. */
export default function AddFoodScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
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
    if (!item) return;
    addEntries([createEntry(item, new Date())]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeFlow();
  };

  if (!food) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        {loadError ? (
          <EmptyState icon="wifiOff" title="Couldn’t load this food" message={loadError} actionLabel="Try Again" onAction={retry} />
        ) : (
          <ActivityIndicator color={colors.textSecondary} />
        )}
      </View>
    );
  }

  const nutrition = portion.nutrition ?? NO_NUTRITION;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <FoodHero
        title={food.name}
        subtitle={food.brand ?? food.category ?? null}
        amount={portion.description ?? null}
        amountCaption="portion"
        imageUri={food.imageUrl}
        tintHints={[food.category, food.brand]}
        badge={food.source === 'usda' ? 'USDA' : food.source === 'chain' ? 'MENU' : 'PACKAGED'}
        onBack={() => (router.canGoBack() ? router.back() : closeFlow())}
        backIcon={router.canGoBack() ? 'back' : 'close'}
      />

      <View style={styles.body}>
        <View style={styles.caloriesRow}>
          <View>
            <ThemedText variant="largeTitle" style={styles.tabular}>
              {formatNumber(nutrition.calories)}
            </ThemedText>
            <ThemedText variant="footnote" color="secondary">
              kcal in this portion
            </ThemedText>
          </View>
        </View>

        <NutritionColumns nutrition={nutrition} />
        <PortionEditor portion={portion} />

        <View style={styles.meal}>
          <ThemedText variant="footnote" color="secondary" style={styles.label}>
            ADD TO
          </ThemedText>
          <MealTypePicker value={mealType} onChange={setMealType} />
        </View>

        <Button label={`Add to ${MEAL_TYPE_META[mealType].label}`} onPress={add} disabled={!portion.stored} />
        <FoodDataAttribution />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: Spacing['5xl'] },
  body: { paddingHorizontal: Spacing.lg, gap: Spacing.lg, marginTop: -Spacing.sm },
  caloriesRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  meal: { gap: Spacing.sm },
  label: { marginLeft: Spacing.xs, letterSpacing: 0.5 },
  tabular: { fontVariant: ['tabular-nums'] },
});
