import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FoodHero } from '@/components/food/FoodHero';
import { MealTypePicker } from '@/components/food/MealTypePicker';
import { NutritionColumns } from '@/components/food/NutritionColumns';
import { PortionEditor } from '@/components/food/PortionEditor';
import { SheetFrame } from '@/components/layout/SheetFrame';
import { SheetHeader } from '@/components/layout/SheetHeader';
import { CountUp, InkReveal, Stagger } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ThemedText } from '@/components/ui/ThemedText';
import { Duration, Haptic } from '@/constants/motion';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { HAIRLINE, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { removeWithUndo } from '@/hooks/useEntryActions';
import { usePortion } from '@/hooks/usePortion';
import { getChainFood } from '@/lib/food/chainDatabase';
import { getUsdaFood } from '@/lib/food/usdaDatabase';
import { amountLabel, createEntry, entryAsFood, rescaleEntry } from '@/lib/log/entries';
import { addEntries, logStore, updateEntry } from '@/lib/log/logStore';
import type { StoredPortion } from '@/lib/nutrition/portion';
import type { MealType } from '@/types';
import { formatNumber } from '@/utils/format';
import { singleParam } from '@/utils/routeParams';

function samePortion(a: StoredPortion, b: StoredPortion): boolean {
  return a.servingId === b.servingId && a.amountUnit === b.amountUnit && Math.abs(a.servings - b.servings) < 0.0001;
}

/** Change the amount or meal of something already logged, log it again, or delete it. */
export default function EditEntryScreen() {
  return (
    <SheetFrame>
      <EditEntry />
    </SheetFrame>
  );
}

function EditEntry() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
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
    Haptic.success();
    router.back();
  };

  const logAgain = () => {
    if (!entry) return;
    const { id: _id, loggedAt: _loggedAt, ...rest } = entry;
    addEntries([createEntry({ ...rest, mealType }, new Date())]);
    Haptic.log();
    router.back();
  };

  // No question first: the entry goes, the sheet closes, and Home offers to put it back.
  const remove = () => {
    if (!entry) return;
    Haptic.tap();
    removeWithUndo(entry);
    router.back();
  };

  if (!entry) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <SheetHeader title="Entry" onClose={() => router.back()} />
        <EmptyState title="gone" message="It was deleted or cleared." actionLabel="Close" onAction={() => router.back()} />
      </View>
    );
  }

  const nutrition = portion.nutrition ?? entry;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <FoodHero
          title={entry.foodName}
          subtitle={entry.brand ?? MEAL_TYPE_META[entry.mealType].label.toLowerCase()}
          amount={portion.description ?? amountLabel(entry)}
          amountCaption="portion"
          imageUri={entry.imageUri}
          tintHints={[databaseFood?.category, entry.brand]}
          badge={entry.isEstimate ? 'ESTIMATED' : 'EDIT'}
          onBack={() => router.back()}
        />

        <View style={styles.body}>
          <InkReveal>
            <View style={styles.caloriesRow}>
              <CountUp value={nutrition.calories} durationMs={Duration.standard} format={(value) => formatNumber(value)} variant="figure" />
              <ThemedText variant="overline" color="secondary" style={styles.unit}>
                KCAL IN THIS PORTION{entry.isEstimate ? ' · ESTIMATED' : ''}
              </ThemedText>
            </View>
          </InkReveal>

          <Stagger index={1}>
            <NutritionColumns nutrition={nutrition} />
          </Stagger>
          {food ? (
            <Stagger index={2}>
              <PortionEditor portion={portion} />
            </Stagger>
          ) : null}

          <Stagger index={3} style={styles.meal}>
            <ThemedText variant="overline" color="tertiary">
              MEAL
            </ThemedText>
            <MealTypePicker value={mealType} onChange={setMealType} />
          </Stagger>

          <Stagger index={4} style={styles.actions}>
            <Button label="Log it again" variant="secondary" onPress={logAgain} />
            <Button label="Delete entry" variant="quiet" onPress={remove} />
          </Stagger>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + Spacing.md }]}>
        <Button label="Save changes" onPress={save} disabled={!canSave} />
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
  actions: { gap: Spacing.sm },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: HAIRLINE },
});
