import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FoodThumb } from '@/components/food/FoodThumb';
import { InkReveal, PressScale } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { Glass } from '@/components/ui/Glass';
import { Heading } from '@/components/ui/Heading';
import { ThemedText } from '@/components/ui/ThemedText';
import { Haptic } from '@/constants/motion';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { HAIRLINE, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useFastConflict } from '@/hooks/useFast';
import { createEntry, entryFromFood } from '@/lib/log/entries';
import { addEntries, removeEntry } from '@/lib/log/logStore';
import { MIN_ROOM, remainingFor, suggestFoods, suggestPlate, type Pick } from '@/lib/suggest/fill';
import { amountLabel, pantryFoods, type PantryFood } from '@/lib/suggest/pantry';
import type { MacroGoals, NutritionValues } from '@/types';
import { formatNumber } from '@/utils/format';
import { defaultMealType } from '@/utils/mealTime';
import { showToast } from '@/utils/toast';

interface FillCardProps {
  eaten: NutritionValues;
  calorieGoal: number;
  macroGoals: MacroGoals | null;
  now: Date;
}

/** Whether the ideas are showing; kept for the session so Home does not fold them away on every visit. */
let opened = false;

const macroLine = (nutrition: NutritionValues) => `P ${formatNumber(nutrition.protein)} · C ${formatNumber(nutrition.carbs)} · F ${formatNumber(nutrition.fat)} g`;

/**
 * Ideas for the rest of the day, on Home: a plate that makes a meal of what
 * is left, and single foods that fit. It stays folded until asked for, shows
 * nothing once the day is nearly full, and only ever suggests.
 */
export function FillCard({ eaten, calorieGoal, macroGoals, now }: FillCardProps) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const conflict = useFastConflict();
  const [open, setOpen] = useState(opened);
  const [turn, setTurn] = useState(0);

  const remaining = useMemo(() => remainingFor(calorieGoal, macroGoals, eaten), [calorieGoal, macroGoals, eaten]);
  const mealType = defaultMealType(now);
  // Foods set aside for a fast are not suggested while it runs.
  const pantry = useMemo(() => pantryFoods().filter((item) => !conflict(item.food.name, null, mealType) && !conflict(item.candidate.name, null, mealType)), [conflict, mealType]);
  const byId = useMemo(() => new Map(pantry.map((item) => [item.candidate.id, item])), [pantry]);
  const candidates = useMemo(() => pantry.map((item) => item.candidate), [pantry]);
  const plate = useMemo(() => (open ? suggestPlate(candidates, remaining, turn) : null), [open, candidates, remaining, turn]);
  const singles = useMemo(() => (open ? suggestFoods(candidates, remaining, 4, turn) : []), [open, candidates, remaining, turn]);

  if (remaining.calories < MIN_ROOM) return null;

  const toggle = () => {
    opened = !open;
    setOpen(!open);
  };
  const amount = (pick: Pick, item: PantryFood) => amountLabel(item.units, pick.count);
  const summary = `${formatNumber(remaining.calories)} kcal · ${formatNumber(remaining.protein)} g protein · ${formatNumber(remaining.carbs)} g carbs · ${formatNumber(remaining.fat)} g fat to go`;

  const openFood = (pick: Pick, item: PantryFood) =>
    router.push({ pathname: '/food/[id]', params: { id: item.food.id, mealType, servingId: item.serving.id, servings: String(pick.count) } });

  const addPlate = () => {
    if (!plate) return;
    const entries = plate.picks.flatMap((pick) => {
      const item = byId.get(pick.candidate.id);
      const entry = item ? entryFromFood(item.food, { servingId: item.serving.id, servings: pick.count, amountUnit: 'serving' }, mealType) : null;
      return entry ? [createEntry(entry, new Date())] : [];
    });
    if (entries.length === 0) return;
    addEntries(entries);
    Haptic.log();
    showToast({ message: `${entries.length} foods added to ${MEAL_TYPE_META[mealType].label.toLowerCase()}`, actionLabel: 'Undo', onAction: () => entries.forEach((entry) => removeEntry(entry.id)) });
  };

  return (
    <View style={styles.root}>
      <Heading title="to fill the rest" tagline="ideas that fit what is left" accessory={<Button label={open ? 'hide' : 'show ideas'} variant="secondary" size="md" fullWidth={false} onPress={toggle} accessibilityLabel={open ? 'Hide ideas' : 'Show ideas for the rest of the day'} />} />
      <ThemedText variant="footnote" color="secondary">
        {summary}
        {macroGoals ? '' : ', on a balanced split'}
      </ThemedText>

      {open ? (
        <InkReveal key={turn} style={styles.ideas}>
          {plate ? (
            <Glass radius={Radii.xl} lit style={styles.plate}>
              <ThemedText variant="overline" color="tertiary">
                A PLATE THAT FITS
              </ThemedText>
              {plate.picks.map((pick) => {
                const item = byId.get(pick.candidate.id);
                if (!item) return null;
                return (
                  <View key={pick.candidate.id} style={styles.plateRow}>
                    <View style={styles.text}>
                      <ThemedText variant="body">{pick.candidate.name}</ThemedText>
                      <ThemedText variant="footnote" color="secondary">
                        {amount(pick, item)}
                      </ThemedText>
                    </View>
                    <ThemedText variant="subheadEmphasized" style={styles.tabular}>
                      {formatNumber(pick.nutrition.calories)}
                    </ThemedText>
                  </View>
                );
              })}
              <View style={[styles.total, { borderTopColor: colors.border }]}>
                <ThemedText variant="footnote" color="secondary" style={styles.text}>
                  {macroLine(plate.total)}
                </ThemedText>
                <ThemedText variant="subheadEmphasized" style={styles.tabular}>
                  {formatNumber(plate.total.calories)} kcal
                </ThemedText>
              </View>
              <Button label={`Add all to ${MEAL_TYPE_META[mealType].label}`} variant="secondary" size="md" haptic={null} onPress={addPlate} />
            </Glass>
          ) : null}

          {singles.length > 0 ? (
            <View>
              <ThemedText variant="overline" color="tertiary" style={styles.label}>
                {plate ? 'OR ONE THING' : 'ONE THING'}
              </ThemedText>
              {singles.map((pick, index) => {
                const item = byId.get(pick.candidate.id);
                if (!item) return null;
                const first = index === 0;
                const last = index === singles.length - 1;
                const lead = pick.leads === 'balanced' ? 'balanced' : `mostly ${pick.leads}`;
                return (
                  <PressScale
                    key={pick.candidate.id}
                    onPress={() => openFood(pick, item)}
                    pressScale={0.985}
                    haptic="tap"
                    accessibilityRole="button"
                    accessibilityLabel={`${pick.candidate.name}, ${amount(pick, item)}, ${formatNumber(pick.nutrition.calories)} calories, ${lead}`}
                    accessibilityHint="Opens it at this amount so you can add it"
                    style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border, borderTopWidth: first ? HAIRLINE : 0 }, first && styles.top, last && styles.bottom]}
                  >
                    <FoodThumb name={item.food.name} hints={[item.food.category]} size={40} radius={Radii.md} />
                    <View style={styles.text}>
                      <ThemedText variant="body" numberOfLines={1}>
                        {pick.candidate.name}
                      </ThemedText>
                      <ThemedText variant="footnote" color="secondary" numberOfLines={1}>
                        {amount(pick, item)} · {lead}
                      </ThemedText>
                      <ThemedText variant="caption1" color="tertiary" numberOfLines={1}>
                        {macroLine(pick.nutrition)}
                      </ThemedText>
                    </View>
                    <View style={styles.calories}>
                      <ThemedText variant="subheadEmphasized" style={styles.tabular}>
                        {formatNumber(pick.nutrition.calories)}
                      </ThemedText>
                      <ThemedText variant="caption2" color="secondary">
                        cal
                      </ThemedText>
                    </View>
                  </PressScale>
                );
              })}
            </View>
          ) : null}

          <View style={styles.foot}>
            <ThemedText variant="caption1" color="tertiary" style={styles.text}>
              Ideas only, from everyday foods. Eat what suits you.
            </ThemedText>
            <Button label="other ideas" variant="quiet" size="md" fullWidth={false} haptic="select" onPress={() => setTurn((value) => value + 1)} accessibilityLabel="Show other ideas" />
          </View>
        </InkReveal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.sm },
  ideas: { gap: Spacing.md, marginTop: Spacing.xs },
  plate: { padding: Spacing.lg, gap: Spacing.sm },
  plateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  total: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.sm, marginBottom: Spacing.xs, borderTopWidth: HAIRLINE },
  label: { marginBottom: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, minHeight: 60, borderLeftWidth: HAIRLINE, borderRightWidth: HAIRLINE, borderBottomWidth: HAIRLINE },
  top: { borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl },
  bottom: { borderBottomLeftRadius: Radii.xl, borderBottomRightRadius: Radii.xl },
  text: { flex: 1, gap: 2 },
  calories: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  tabular: { fontVariant: ['tabular-nums'] },
  foot: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
});
