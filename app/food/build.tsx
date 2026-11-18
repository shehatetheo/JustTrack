import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BuildPreview } from '@/components/food/BuildPreview';
import { LogButton } from '@/components/food/LogButton';
import { MealTypePicker } from '@/components/food/MealTypePicker';
import { SheetHeader } from '@/components/layout/SheetHeader';
import { CountUp, Stagger } from '@/components/motion';
import { Chip } from '@/components/ui/Chip';
import { Banner } from '@/components/ui/Banner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glass } from '@/components/ui/Glass';
import { ThemedText } from '@/components/ui/ThemedText';
import { Duration } from '@/constants/motion';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { HAIRLINE, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useFastConflict } from '@/hooks/useFast';
import { builderByKey, entryOf, nutritionOf, setCount, toggle, type Selection } from '@/lib/food/builders';
import { ingredientsOf, lengthOf, shapeOf } from '@/lib/food/builders/visual';
import { createEntry } from '@/lib/log/entries';
import { addEntries } from '@/lib/log/logStore';
import type { MealType } from '@/types';
import { formatNumber } from '@/utils/format';
import { defaultMealType } from '@/utils/mealTime';
import { mealTypeParam, singleParam } from '@/utils/routeParams';

/** Order at a chain the way you'd order it at the counter; the total is the menu's own numbers added up. */
export default function OrderBuilderScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ builder?: string; mealType?: string }>();
  const config = builderByKey(singleParam(params.builder));
  const { now } = useCurrentTime();
  const [mealType, setMealType] = useState<MealType>(() => mealTypeParam(params.mealType) ?? defaultMealType(now));
  const [selection, setSelection] = useState<Selection>(() => config?.defaultSelection ?? {});
  const fastConflict = useFastConflict();

  // Close the whole add-food sheet, not just this screen.
  const closeFlow = () => {
    const parent = navigation.getParent();
    if (parent?.canGoBack()) parent.goBack();
    else router.replace('/');
  };
  const canGoBack = router.canGoBack();

  if (!config) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <SheetHeader title="Build an order" onClose={closeFlow} />
        <EmptyState title="nothing here" message="Search for Chipotle, Subway, Panda Express, or Jersey Mike’s." actionLabel="Close" onAction={closeFlow} />
      </View>
    );
  }

  const totals = nutritionOf(config, selection);
  const extras = config.describe(selection);
  const ingredients = ingredientsOf(config, selection);
  const offFast = fastConflict(`${config.nameOf(selection)} ${extras} ${ingredients.map((item) => item.label).join(' ')}`);

  const add = () => addEntries([createEntry(entryOf(config, selection, mealType), new Date())]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SheetHeader title={config.title} tagline="picked the way you’d order it" onBack={canGoBack ? () => router.back() : undefined} onClose={closeFlow} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Glass radius={Radii['2xl']} lit style={styles.summary}>
          <BuildPreview shape={shapeOf(config, selection)} ingredients={ingredients} length={lengthOf(config, selection)} />
          <ThemedText variant="headline" numberOfLines={2}>
            {config.nameOf(selection)}
          </ThemedText>
          <ThemedText variant="footnote" color="secondary" numberOfLines={2}>
            {extras || 'Nothing else yet'}
          </ThemedText>
          <View style={styles.summaryRow}>
            <CountUp value={totals.calories} durationMs={Duration.standard} format={(value) => formatNumber(value)} variant="figure" />
            <ThemedText variant="overline" color="secondary">
              KCAL
            </ThemedText>
            <View style={styles.pills} accessible accessibilityLabel={`Protein ${formatNumber(totals.protein)} grams, carbs ${formatNumber(totals.carbs)} grams, fat ${formatNumber(totals.fat)} grams`}>
              {[
                { label: 'P', grams: totals.protein },
                { label: 'C', grams: totals.carbs },
                { label: 'F', grams: totals.fat },
              ].map((pill) => (
                <View key={pill.label} style={[styles.pill, { borderColor: colors.border }]}>
                  <ThemedText variant="caption2" color="secondary">
                    {pill.label}
                  </ThemedText>
                  <ThemedText variant="caption2" style={styles.tabular}>
                    {formatNumber(pill.grams)} g
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        </Glass>

        {offFast ? <Banner tone="info" icon="calendar" message={`This order has ${offFast} in it, which you’re setting aside for your fast.`} /> : null}

        {config.steps.map((step, stepIndex) => (
          <Stagger key={step.id} index={stepIndex} style={styles.step}>
            <View style={styles.stepHeader}>
              <ThemedText variant="title3" accessibilityRole="header">
                {step.title.toLowerCase()}
              </ThemedText>
              {step.hint ? (
                <ThemedText variant="tagline" color="secondary" style={styles.hint}>
                  {step.hint.toLowerCase()}
                </ThemedText>
              ) : null}
            </View>
            <View style={styles.chips} accessibilityRole={step.mode === 'one' ? 'radiogroup' : undefined}>
              {step.options.map((option) => {
                const count = selection[option.id] ?? 0;
                const picked = count > 0;
                return (
                  <View key={option.id} style={styles.chipGroup}>
                    <Chip label={option.label} selected={picked} checked={picked} accessibilityRole={step.mode === 'one' ? 'radio' : 'checkbox'} accessibilityLabel={option.label} onPress={() => setSelection((current) => toggle(current, step, option))} />
                    {picked && option.doubleable ? (
                      <Chip label="2×" selected={count === 2} checked={count === 2} haptic="tap" accessibilityRole="switch" accessibilityLabel={`Double ${option.label.toLowerCase()}`} onPress={() => setSelection((current) => setCount(current, option, count === 2 ? 1 : 2))} />
                    ) : null}
                  </View>
                );
              })}
            </View>
          </Stagger>
        ))}

        <View style={styles.meal}>
          <ThemedText variant="overline" color="tertiary">
            ADD TO
          </ThemedText>
          <MealTypePicker value={mealType} onChange={setMealType} />
        </View>
        <ThemedText variant="caption1" color="tertiary" style={styles.footnote}>
          {config.footnote}
        </ThemedText>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + Spacing.md }]}>
        <LogButton label={`Add to ${MEAL_TYPE_META[mealType].label} · ${formatNumber(totals.calories)} kcal`} onLog={add} onDone={closeFlow} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: Spacing['3xl'] },
  summary: { padding: Spacing.lg, gap: Spacing.xs },
  summaryRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs, marginTop: Spacing.xs },
  pills: { flexDirection: 'row', gap: Spacing.xs, marginLeft: 'auto' },
  pill: { flexDirection: 'row', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radii.full, borderWidth: HAIRLINE },
  step: { gap: Spacing.sm },
  stepHeader: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: Spacing.sm },
  hint: { flexShrink: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, rowGap: Spacing.sm + 2 },
  chipGroup: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  meal: { gap: Spacing.sm },
  footnote: { textAlign: 'center' },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: HAIRLINE },
  tabular: { fontVariant: ['tabular-nums'] },
});
