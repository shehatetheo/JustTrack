import { useRouter } from 'expo-router';
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FoodHero } from '@/components/food/FoodHero';
import { LogButton } from '@/components/food/LogButton';
import { MealTypePicker } from '@/components/food/MealTypePicker';
import { NutritionColumns } from '@/components/food/NutritionColumns';
import { SheetFrame } from '@/components/layout/SheetFrame';
import { CountUp, Deal, InkReveal, PressScale, TearAway, useMotion } from '@/components/motion';
import { Analyzing } from '@/components/scan/Analyzing';
import { AppIcon } from '@/components/ui/AppIcon';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glass } from '@/components/ui/Glass';
import { StepperButton, StepperTick } from '@/components/ui/Stepper';
import { ThemedText } from '@/components/ui/ThemedText';
import { Duration } from '@/constants/motion';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { HAIRLINE, MIN_TAP, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { createEntry, entryFromEstimate } from '@/lib/log/entries';
import { addEntries } from '@/lib/log/logStore';
import { sumNutrition } from '@/lib/nutrition/calculateNutrition';
import { matchRowToFood, removeRow, resetReview, revertToEstimate, reviewStore, rowNutrition, setRowGrams, type ReviewRow } from '@/lib/scan/reviewStore';
import type { FoodDetail, MealType } from '@/types';
import { formatCalories, formatNumber } from '@/utils/format';
import { defaultMealType } from '@/utils/mealTime';

/** Below this the model is guessing, and the row says so. */
const LOW_CONFIDENCE = 0.5;

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
  const step = (delta: number) => setRowGrams(row.id, Math.max(5, row.grams + delta));

  return (
    <View style={styles.stepper}>
      <StepperButton direction="less" accessibilityLabel="10 grams less" onPress={() => step(-10)} disabled={row.grams <= 5} />
      <StepperTick value={row.grams}>
        <View style={[styles.grams, { borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}>
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
        </View>
      </StepperTick>
      <StepperButton direction="more" accessibilityLabel="10 grams more" onPress={() => step(10)} />
    </View>
  );
}

const SOURCE_LABEL: Record<FoodDetail['source'], string> = { usda: 'USDA', openfoodfacts: 'Open Food Facts', chain: 'menu' };

/** Where a row's numbers come from: the model's estimate, or one of the database foods that look like it. */
function SourceOptions({ row }: { row: ReviewRow }) {
  if (row.suggestions.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.options} accessibilityRole="radiogroup" style={styles.optionsScroller}>
      <Chip stacked label="AI estimate" detail={`${formatCalories(row.estimate.nutrition.calories)} · ${row.estimate.portionDescription}`} selected={row.matchedFood === null} checked={row.matchedFood === null} accessibilityRole="radio" onPress={() => revertToEstimate(row.id)} style={styles.option} />
      {row.suggestions.map((food) => (
        <Chip
          key={food.id}
          stacked
          label={food.name}
          detail={food.source === 'chain' ? `${food.brand} menu` : `${SOURCE_LABEL[food.source]}${food.brand ? ` · ${food.brand}` : ''}`}
          selected={row.matchedFood?.externalId === food.externalId}
          checked={row.matchedFood?.externalId === food.externalId}
          accessibilityRole="radio"
          onPress={() => matchRowToFood(row.id, food)}
          style={styles.option}
        />
      ))}
    </ScrollView>
  );
}

/** A lavender edge that breathes on a row the model wasn't sure about. With motion reduced it is simply lit. */
function Pulse() {
  const { colors } = useAppTheme();
  const { reduced } = useMotion();
  const glow = useSharedValue(reduced ? 1 : 0.35);
  useEffect(() => {
    if (reduced) return;
    glow.set(withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0.35, { duration: 900 })), -1, false));
  }, [glow, reduced]);
  const style = useAnimatedStyle(() => ({ opacity: glow.get() }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.pulse, { borderColor: colors.accent }, style]} />;
}

function RowCard({ row, onRemove, onPickMatch }: { row: ReviewRow; onRemove: () => void; onPickMatch: () => void }) {
  const { colors } = useAppTheme();
  const nutrition = rowNutrition(row);
  const unsure = row.confidence < LOW_CONFIDENCE && !row.matchedFood;
  const fromMenu = row.matchedFood?.source === 'chain';
  const context = row.matchedFood ? (fromMenu ? `${row.matchedFood.brand} menu · ${row.portionDescription}` : `Matched to ${row.matchedFood.source === 'usda' ? 'USDA' : 'Open Food Facts'}`) : row.portionDescription;

  return (
    <Glass radius={Radii.xl} style={styles.row}>
      {unsure ? <Pulse /> : null}
      <View style={styles.rowHeader}>
        <View style={styles.rowTitle}>
          <ThemedText variant="headline" numberOfLines={2}>
            {row.name}
          </ThemedText>
          <View style={styles.contextRow}>
            <View style={[styles.badge, { borderColor: colors.borderAccent }]}>
              <ThemedText variant="caption2" style={{ color: colors.accentText }}>
                {fromMenu ? 'MENU' : 'ESTIMATED'}
              </ThemedText>
            </View>
            <ThemedText variant="footnote" color="secondary" numberOfLines={1} style={styles.context}>
              {context}
            </ThemedText>
          </View>
          {unsure ? (
            <ThemedText variant="tagline" style={{ color: colors.accentText }}>
              double-check this one
            </ThemedText>
          ) : null}
        </View>
        <PressScale onPress={onRemove} haptic="tap" accessibilityRole="button" accessibilityLabel={`Remove ${row.name}`} style={styles.remove}>
          <AppIcon name="close" size={14} color={colors.textSecondary} weight="semibold" />
        </PressScale>
      </View>
      <SourceOptions row={row} />
      <View style={styles.rowControls}>
        <GramsStepper row={row} />
        <CountUp value={nutrition.calories} durationMs={Duration.standard} format={formatCalories} variant="headline" />
      </View>
      <PressScale onPress={onPickMatch} haptic="select" accessibilityRole="button" style={styles.matchLink}>
        <AppIcon name="search" size={13} color={colors.accentText} />
        <ThemedText variant="footnoteEmphasized" style={{ color: colors.accentText }}>
          {row.matchedFood ? 'Change match' : row.suggestions.length > 0 ? 'Search the database' : 'Not quite right? Find it in the database'}
        </ThemedText>
      </PressScale>
    </Glass>
  );
}

const PHOTO_STEPS = ['looking at the plate…', 'naming what’s on it…', 'sizing each portion…', 'adding it up…'];
const TEXT_STEPS = ['reading what you wrote…', 'splitting it into foods…', 'sizing each portion…', 'adding it up…'];

/** What the scanner found, as editable cards, before anything is logged. */
export default function ReviewScreen() {
  return (
    <SheetFrame>
      <Review />
    </SheetFrame>
  );
}

function Review() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { now } = useCurrentTime();
  const state = useSyncExternalStore(reviewStore.subscribe, reviewStore.getSnapshot, reviewStore.getSnapshot);
  const [mealType, setMealType] = useState<MealType>(() => defaultMealType(now));
  const [tearing, setTearing] = useState<string | null>(null);
  const rows = state.rows;
  const totals = sumNutrition(rows.map(rowNutrition));
  const ready = state.status === 'ready' && rows.length > 0;

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
  };
  const finish = () => {
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
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FoodHero
          title={ready ? (described ? 'What you ate' : 'Your plate') : state.status === 'error' ? (described ? 'Couldn’t work it out' : 'Couldn’t scan') : state.status === 'ready' ? 'Nothing found' : described ? 'Working it out' : 'Reading your plate'}
          subtitle={described ? state.description : ready ? `${rows.length} ${rows.length === 1 ? 'food' : 'foods'} found` : null}
          tintHints={rows.map((row) => row.name)}
          amount={ready ? formatNumber(totals.calories) : null}
          amountCaption={ready ? 'kcal, estimated' : null}
          imageUri={state.photoUri}
          badge={state.status === 'error' ? null : 'ESTIMATED'}
          onBack={close}
        />

        <View style={styles.body}>
          {state.status === 'analyzing' ? <Analyzing steps={described ? TEXT_STEPS : PHOTO_STEPS} note="This takes a few seconds." /> : null}

          {state.status === 'error' ? (
            <View style={styles.center}>
              <Banner tone={state.errorCode === 'not_configured' ? 'warning' : 'error'} message={state.error ?? 'Something went wrong.'} />
              {described ? <Button label="Edit description" onPress={editDescription} /> : <Button label="Try another photo" onPress={close} />}
              <Button
                label="Search by name instead"
                variant="secondary"
                onPress={() => {
                  resetReview();
                  router.replace('/food/search');
                }}
              />
            </View>
          ) : null}

          {state.status === 'ready' ? (
            <>
              {state.note ? <Banner tone="info" message={state.note} /> : null}
              {rows.length === 0 ? (
                <EmptyState
                  title="no food found"
                  message={described ? 'Name the foods plainly, like “2 eggs and toast”.' : 'Try a closer shot with the whole plate in view.'}
                  actionLabel={described ? 'Edit description' : 'Try another photo'}
                  onAction={described ? editDescription : close}
                />
              ) : (
                <>
                  <InkReveal>
                    <NutritionColumns nutrition={totals} />
                  </InkReveal>

                  <View style={styles.rows}>
                    {rows.map((row, index) => (
                      <TearAway
                        key={row.id}
                        tearing={tearing === row.id}
                        onTorn={() => {
                          setTearing(null);
                          removeRow(row.id);
                        }}
                      >
                        <Deal index={index} delay={120}>
                          <RowCard row={row} onRemove={() => setTearing(row.id)} onPickMatch={() => pickMatch(row)} />
                        </Deal>
                      </TearAway>
                    ))}
                  </View>

                  <View style={styles.meal}>
                    <ThemedText variant="overline" color="tertiary">
                      ADD TO
                    </ThemedText>
                    <MealTypePicker value={mealType} onChange={setMealType} />
                  </View>
                  <ThemedText variant="caption1" color="tertiary" style={styles.centerText}>
                    {described ? 'Estimated from your description. Pick a database match for exact label numbers, and adjust anything that looks off.' : 'Estimated nutrition. A photo can’t weigh your food — adjust anything that looks off.'}
                  </ThemedText>
                </>
              )}
            </>
          ) : null}
        </View>
      </ScrollView>

      {ready ? (
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + Spacing.md }]}>
          <LogButton label={`Add ${rows.length === 1 ? 'it' : `${rows.length} items`} to ${MEAL_TYPE_META[mealType].label}`} onLog={logAll} onDone={finish} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: Spacing['3xl'] },
  body: { paddingHorizontal: Spacing.lg, gap: Spacing.lg, paddingTop: Spacing.lg },
  center: { alignItems: 'stretch', gap: Spacing.md, paddingVertical: Spacing.xl },
  centerText: { textAlign: 'center' },
  rows: { gap: Spacing.md },
  row: { padding: Spacing.lg, gap: Spacing.md },
  pulse: { borderWidth: 1.5, borderRadius: Radii.xl },
  rowHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm },
  rowTitle: { flex: 1, gap: Spacing.xs },
  contextRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  context: { flexShrink: 1 },
  badge: { paddingHorizontal: Spacing.xs + 2, paddingVertical: 1, borderRadius: Radii.sm, borderWidth: HAIRLINE },
  remove: { width: MIN_TAP, height: MIN_TAP, alignItems: 'center', justifyContent: 'center', marginTop: -Spacing.sm, marginRight: -Spacing.sm },
  optionsScroller: { flexGrow: 0, flexShrink: 0, marginHorizontal: -Spacing.xs },
  options: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xs },
  option: { maxWidth: 190 },
  rowControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexShrink: 0 },
  grams: { flexDirection: 'row', alignItems: 'center', gap: 2, height: MIN_TAP, paddingHorizontal: Spacing.md, borderRadius: Radii.full, borderWidth: HAIRLINE },
  stepInput: { width: 48, minWidth: 0, textAlign: 'center', paddingVertical: 0, outlineStyle: 'solid', outlineWidth: 0 },
  matchLink: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, minHeight: MIN_TAP / 2, alignSelf: 'flex-start' },
  meal: { gap: Spacing.sm },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: HAIRLINE },
});
