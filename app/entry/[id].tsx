import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

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
import { usePortion } from '@/hooks/usePortion';
import { getChainFood } from '@/lib/food/chainDatabase';
import { getUsdaFood } from '@/lib/food/usdaDatabase';
import { amountLabel, createEntry, entryAsFood, rescaleEntry } from '@/lib/log/entries';
import { addEntries, logStore, removeEntry, updateEntry } from '@/lib/log/logStore';
import type { StoredPortion } from '@/lib/nutrition/portion';
import type { MealType } from '@/types';
import { confirmAsync } from '@/utils/actionSheet';
import { formatNumber } from '@/utils/format';
import { singleParam } from '@/utils/routeParams';

function samePortion(a: StoredPortion, b: StoredPortion): boolean {
  return a.servingId === b.servingId && a.amountUnit === b.amountUnit && Math.abs(a.servings - b.servings) < 0.0001;
}

/** Change the amount or meal of something already logged, log it again, or delete it. */
export default function EditEntryScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const entryId = singleParam(params.id);
  const entries = useSyncExternalStore(logStore.subscribe, logStore.getSnapshot, logStore.getSnapshot);
  const entry = entries.find((item) => item.id === entryId);

  // Built-in foods reopen with all their portions ("1 cup", grams…); anything else is rescaled from its own values.
  const databaseFood = useMemo(
    () => (entry?.externalFoodId && entry.externalServingId ? (entry.source === 'usda' ? getUsdaFood(entry.externalFoodId) : entry.source === 'chain' ? getChainFood(entry.externalFoodId) : null) : null),
    [entry]
  );
  const editAgainstDatabase = Boolean(databaseFood?.servings.some((serving) => serving.id === entry?.externalServingId));
  const food = (editAgainstDatabase ? databaseFood : entry && entryAsFood(entry)) ?? undefined;
  const initialPortion: StoredPortion | null = entry
    ? { servingId: editAgainstDatabase ? (entry.externalServingId ?? '') : 'entry', servings: entry.servings, amountUnit: entry.amountUnit }
    : null;
  const portion = usePortion(food, initialPortion);
  const [chosenMealType, setMealType] = useState<MealType | null>(null);
  const mealType = chosenMealType ?? entry?.mealType ?? 'snacks';

  const portionChanged = Boolean(portion.stored && initialPortion && !samePortion(portion.stored, initialPortion));
  const mealChanged = Boolean(entry && mealType !== entry.mealType);
  const canSave = Boolean(entry) && (mealChanged || (portionChanged && portion.stored !== null));

  const save = () => {
    if (!entry) return;
    updateEntry(entry.id, (current) => {
      const rescaled = portionChanged && food && portion.stored ? (rescaleEntry(current, food, portion.stored) ?? current) : current;
      return { ...rescaled, mealType };
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const logAgain = () => {
    if (!entry) return;
    const { id: _id, loggedAt: _loggedAt, ...rest } = entry;
    addEntries([createEntry({ ...rest, mealType }, new Date())]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const remove = async () => {
    if (!entry) return;
    const confirmed = await confirmAsync({ title: 'Delete this entry?', message: `${entry.foodName} will be removed from ${MEAL_TYPE_META[entry.mealType].label}.`, confirmLabel: 'Delete' });
    if (!confirmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeEntry(entry.id);
    router.back();
  };

  if (!entry) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <EmptyState icon="clock" title="This entry is gone" message="It was deleted or cleared." actionLabel="Close" onAction={() => router.back()} />
      </View>
    );
  }

  const nutrition = portion.nutrition ?? entry;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <FoodHero
        title={entry.foodName}
        subtitle={entry.brand ?? MEAL_TYPE_META[entry.mealType].label}
        amount={portion.description ?? amountLabel(entry)}
        amountCaption="portion"
        imageUri={entry.imageUri}
        tintHints={[databaseFood?.category, entry.brand]}
        badge={entry.isEstimate ? 'ESTIMATED' : 'EDIT'}
        onBack={() => router.back()}
      />

      <View style={styles.body}>
        <View>
          <ThemedText variant="largeTitle" style={styles.tabular}>
            {formatNumber(nutrition.calories)}
          </ThemedText>
          <ThemedText variant="footnote" color="secondary">
            kcal in this portion{entry.isEstimate ? ' · estimated from a photo' : ''}
          </ThemedText>
        </View>

        <NutritionColumns nutrition={nutrition} />
        {food ? <PortionEditor portion={portion} /> : null}

        <View style={styles.meal}>
          <ThemedText variant="footnote" color="secondary" style={styles.label}>
            MEAL
          </ThemedText>
          <MealTypePicker value={mealType} onChange={setMealType} />
        </View>

        <View style={styles.actions}>
          <Button label="Save changes" onPress={save} disabled={!canSave} />
          <Button label="Log it again" variant="secondary" onPress={logAgain} />
          <Button label="Delete entry" variant="ghostDestructive" onPress={() => void remove()} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: Spacing['5xl'] },
  body: { paddingHorizontal: Spacing.lg, gap: Spacing.lg, marginTop: -Spacing.sm },
  meal: { gap: Spacing.sm },
  label: { marginLeft: Spacing.xs, letterSpacing: 0.5 },
  actions: { gap: Spacing.sm },
  tabular: { fontVariant: ['tabular-nums'] },
});
