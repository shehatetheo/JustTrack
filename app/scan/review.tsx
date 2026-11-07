import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState, useSyncExternalStore } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { FoodHero } from '@/components/food/FoodHero';
import { MealTypePicker } from '@/components/food/MealTypePicker';
import { NutritionColumns } from '@/components/food/NutritionColumns';
import { AppIcon } from '@/components/ui/AppIcon';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { createEntry, entryFromEstimate } from '@/lib/log/entries';
import { addEntries } from '@/lib/log/logStore';
import { sumNutrition } from '@/lib/nutrition/calculateNutrition';
import { matchRowToFood, removeRow, resetReview, revertToEstimate, reviewStore, rowNutrition, setRowGrams, type ReviewRow } from '@/lib/scan/reviewStore';
import type { FoodDetail, MealType } from '@/types';
import { formatCalories, formatNumber } from '@/utils/format';
import { defaultMealType } from '@/utils/mealTime';

function GramsStepper({ row }: { row: ReviewRow }) {
  const { colors } = useAppTheme();
  const [text, setText] = useState(String(row.grams));
  // Follow outside changes (a stepper tap, a database match) without clobbering what's being typed.
  const [synced, setSynced] = useState(row.grams);
  if (synced !== row.grams) {
    setSynced(row.grams);
    setText(String(row.grams));
  }

  const commit = (value: string) => {
    const grams = Number(value.replace(/[^0-9.]/g, ''));
    if (Number.isFinite(grams) && grams > 0) setRowGrams(row.id, grams);
    else setText(String(row.grams));
  };
  const step = (delta: number) => {
    Haptics.selectionAsync();
    setRowGrams(row.id, Math.max(5, row.grams + delta));
  };

  return (
    <View style={[styles.stepper, { backgroundColor: colors.surface }]}>
      <Pressable onPress={() => step(-10)} accessibilityRole="button" accessibilityLabel="10 grams less" hitSlop={6} style={styles.stepButton}>
        <AppIcon name="minus" size={16} color={colors.text} weight="semibold" />
      </Pressable>
      <TextInput
        value={text}
        onChangeText={setText}
        onBlur={() => commit(text)}
        onSubmitEditing={() => commit(text)}
        keyboardType="number-pad"
        returnKeyType="done"
        selectTextOnFocus
        accessibilityLabel="Grams"
        style={[Typography.subheadEmphasized, styles.stepInput, { color: colors.text }]}
      />
      <ThemedText variant="footnote" color="secondary">
        g
      </ThemedText>
      <Pressable onPress={() => step(10)} accessibilityRole="button" accessibilityLabel="10 grams more" hitSlop={6} style={styles.stepButton}>
        <AppIcon name="plus" size={16} color={colors.text} weight="semibold" />
      </Pressable>
    </View>
  );
}

const SOURCE_LABEL: Record<FoodDetail['source'], string> = { usda: 'USDA', openfoodfacts: 'Open Food Facts', chain: 'menu' };

/** Where a row's numbers come from: the model's estimate, or one of the database foods that look like it. */
function SourceOptions({ row }: { row: ReviewRow }) {
  const { colors } = useAppTheme();
  const choose = (action: () => void) => {
    Haptics.selectionAsync();
    action();
  };
  const chip = (key: string, selected: boolean, title: string, detail: string, onPress: () => void) => (
    <Pressable
      key={key}
      onPress={() => choose(onPress)}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${title}, ${detail}`}
      style={({ pressed }) => [styles.option, { backgroundColor: selected ? colors.fab : colors.surface, opacity: pressed ? 0.8 : 1 }]}
    >
      <ThemedText variant="caption1" numberOfLines={1} style={{ color: selected ? colors.fabIcon : colors.text, fontWeight: '600' }}>
        {title}
      </ThemedText>
      <ThemedText variant="caption2" numberOfLines={1} style={{ color: selected ? colors.fabIcon : colors.textSecondary, opacity: selected ? 0.8 : 1 }}>
        {detail}
      </ThemedText>
    </Pressable>
  );
  if (row.suggestions.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.options} accessibilityRole="radiogroup" style={styles.optionsScroller}>
      {chip('estimate', row.matchedFood === null, 'AI estimate', `${formatCalories(row.estimate.nutrition.calories)} · ${row.estimate.portionDescription}`, () => revertToEstimate(row.id))}
      {row.suggestions.map((food) =>
        chip(food.id, row.matchedFood?.externalId === food.externalId, food.name, food.source === 'chain' ? `${food.brand} menu` : `${SOURCE_LABEL[food.source]}${food.brand ? ` · ${food.brand}` : ''}`, () => matchRowToFood(row.id, food))
      )}
    </ScrollView>
  );
}

/** What the scanner found, as editable rows, before anything is logged. */
export default function ReviewScreen() {
  const router = useRouter();
  const { colors, shadows } = useAppTheme();
  const { now } = useCurrentTime();
  const state = useSyncExternalStore(reviewStore.subscribe, reviewStore.getSnapshot, reviewStore.getSnapshot);
  const [mealType, setMealType] = useState<MealType>(() => defaultMealType(now));
  const rows = state.rows;
  const totals = sumNutrition(rows.map(rowNutrition));

  const close = () => {
    resetReview();
    router.back();
  };

  const logAll = () => {
    const entries = rows.map((row) =>
      createEntry(
        {
          ...entryFromEstimate({ name: row.name, portionDescription: row.portionDescription, estimatedGrams: row.grams, confidence: row.confidence, chain: row.chain, ...rowNutrition(row) }, mealType),
          imageUri: state.thumbnailUri,
          ...(row.matchedFood ? { source: row.matchedFood.source, externalFoodId: row.matchedFood.externalId, brand: row.matchedFood.brand, isEstimate: row.matchedFood.source !== 'chain' } : {}),
        },
        new Date()
      )
    );
    addEntries(entries);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetReview();
    router.replace('/');
  };

  const pickMatch = (row: ReviewRow) => router.push({ pathname: '/food/search', params: { pick: row.id, q: row.name } });
  const described = state.description !== null;
  const editDescription = () => {
    const text = state.description ?? '';
    resetReview();
    router.replace({ pathname: '/scan/describe', params: { text } });
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <FoodHero
        title={state.status === 'ready' && rows.length > 0 ? (described ? 'What you ate' : 'Your plate') : state.status === 'error' ? (described ? 'Couldn’t work it out' : 'Couldn’t scan') : described ? 'Working out what you ate…' : 'Looking at your plate…'}
        subtitle={described ? state.description : state.status === 'ready' ? `${rows.length} ${rows.length === 1 ? 'food' : 'foods'} found` : null}
        tintHints={rows.map((row) => row.name)}
        amount={state.status === 'ready' && rows.length > 0 ? formatNumber(totals.calories) : null}
        amountCaption={state.status === 'ready' && rows.length > 0 ? 'kcal, estimated' : null}
        imageUri={state.photoUri}
        badge={state.status === 'error' ? null : 'ESTIMATED'}
        onBack={close}
      />

      <View style={styles.body}>
        {state.status === 'analyzing' ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} />
            <ThemedText variant="subhead" color="secondary">
              {described ? 'Splitting it into foods and sizing each one. This takes a few seconds.' : 'Naming the food and sizing the portions. This takes a few seconds.'}
            </ThemedText>
          </View>
        ) : null}

        {state.status === 'error' ? (
          <View style={styles.center}>
            <Banner tone={state.errorCode === 'not_configured' ? 'warning' : 'error'} message={state.error ?? 'Something went wrong.'} />
            {described ? <Button label="Edit description" onPress={editDescription} /> : <Button label="Try another photo" onPress={close} />}
            <Button label="Search by name instead" variant="secondary" onPress={() => { resetReview(); router.replace('/food/search'); }} />
          </View>
        ) : null}

        {state.status === 'ready' ? (
          <>
            {state.note ? <Banner tone="info" message={state.note} /> : null}
            {rows.length === 0 ? (
              <View style={styles.center}>
                <ThemedText variant="headline">No food found</ThemedText>
                <ThemedText variant="subhead" color="secondary" style={styles.centerText}>
                  {described ? 'Name the foods plainly, like “2 eggs and toast”.' : 'Try a closer shot with the whole plate in view.'}
                </ThemedText>
                {described ? <Button label="Edit description" onPress={editDescription} /> : <Button label="Try another photo" onPress={close} />}
              </View>
            ) : (
              <>
                <NutritionColumns nutrition={totals} />

                <View style={styles.rows}>
                  {rows.map((row) => {
                    const nutrition = rowNutrition(row);
                    return (
                      <View key={row.id} style={[styles.row, shadows.sm, { backgroundColor: colors.surfaceTint, borderColor: colors.border }]}>
                        <View style={styles.rowHeader}>
                          <View style={styles.rowTitle}>
                            <ThemedText variant="headline" numberOfLines={2}>
                              {row.name}
                            </ThemedText>
                            <ThemedText variant="footnote" color="secondary" numberOfLines={1}>
                              {row.matchedFood ? (row.matchedFood.source === 'chain' ? `${row.matchedFood.brand} menu · ${row.portionDescription}` : `Matched to ${row.matchedFood.source === 'usda' ? 'USDA' : 'Open Food Facts'}`) : row.portionDescription}
                              {row.confidence < 0.5 && !row.matchedFood ? ' · not sure about this one' : ''}
                            </ThemedText>
                          </View>
                          <Pressable onPress={() => removeRow(row.id)} accessibilityRole="button" accessibilityLabel={`Remove ${row.name}`} hitSlop={8}>
                            <AppIcon name="closeCircle" size={22} color={colors.textTertiary} />
                          </Pressable>
                        </View>
                        <SourceOptions row={row} />
                        <View style={styles.rowControls}>
                          <GramsStepper row={row} />
                          <ThemedText variant="headline" style={styles.tabular}>
                            {formatCalories(nutrition.calories)}
                          </ThemedText>
                        </View>
                        <Pressable onPress={() => pickMatch(row)} accessibilityRole="button" hitSlop={6} style={styles.matchLink}>
                          <AppIcon name="search" size={13} color={colors.accent} />
                          <ThemedText variant="footnote" style={{ color: colors.accent, fontWeight: '600' }}>
                            {row.matchedFood ? 'Change match' : row.suggestions.length > 0 ? 'Search the database' : 'Not quite right? Find it in the database'}
                          </ThemedText>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.meal}>
                  <ThemedText variant="footnote" color="secondary" style={styles.label}>
                    ADD TO
                  </ThemedText>
                  <MealTypePicker value={mealType} onChange={setMealType} />
                </View>
                <Button label={`Add ${rows.length === 1 ? 'it' : `${rows.length} items`} to ${MEAL_TYPE_META[mealType].label}`} icon="plus" onPress={logAll} />
                <ThemedText variant="caption1" color="tertiary" style={styles.centerText}>
                  {described ? 'Estimated from your description. Pick a database match for exact label numbers, and adjust anything that looks off.' : 'Estimated nutrition. A photo can’t weigh your food — adjust anything that looks off.'}
                </ThemedText>
              </>
            )}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  optionsScroller: { flexGrow: 0, flexShrink: 0, marginHorizontal: -Spacing.xs },
  options: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xs },
  option: { maxWidth: 190, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radii.lg, gap: 1 },
  content: { paddingBottom: Spacing['5xl'] },
  body: { paddingHorizontal: Spacing.lg, gap: Spacing.lg, marginTop: -Spacing.sm },
  center: { alignItems: 'center', gap: Spacing.lg, paddingVertical: Spacing['3xl'] },
  centerText: { textAlign: 'center' },
  rows: { gap: Spacing.md },
  row: { borderRadius: Radii.xl, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.lg, gap: Spacing.md },
  rowHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md },
  rowTitle: { flex: 1, gap: 2 },
  rowControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: Radii.full, paddingHorizontal: Spacing.xs, height: 40, flexShrink: 0 },
  stepButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  stepInput: { width: 56, minWidth: 0, textAlign: 'center', paddingVertical: 0 },
  matchLink: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  meal: { gap: Spacing.sm },
  label: { marginLeft: Spacing.xs, letterSpacing: 0.5 },
  tabular: { fontVariant: ['tabular-nums'] },
});
