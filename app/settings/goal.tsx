import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CloseButton } from '@/components/ui/CloseButton';
import { OptionPicker } from '@/components/ui/OptionPicker';
import { PillTabs } from '@/components/ui/PillTabs';
import { TextField } from '@/components/ui/TextField';
import { ThemedText } from '@/components/ui/ThemedText';
import { ACTIVITY_OPTIONS, CALORIE_STEP, GOAL_OPTIONS, MAX_CALORIE_TARGET, SEX_OPTIONS } from '@/constants/onboarding';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/hooks/useSettings';
import { calculateMacroTargets, calculateNutritionTargets, MIN_CALORIE_TARGET } from '@/lib/nutrition/calorieTarget';
import { parseBodyStats, type BodyStatsErrors, type BodyStatsInput } from '@/lib/onboarding/bodyStats';
import { updateSettings } from '@/lib/settings/settingsStore';
import type { ActivityLevel, Sex, WeightGoal } from '@/types';
import { formatNumber } from '@/utils/format';

/** The daily calorie goal, by hand or estimated from a few body stats; optional macro targets. */
export default function GoalScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const settings = useSettings();

  const [calories, setCalories] = useState(String(settings.calorieGoal));
  const [macrosOn, setMacrosOn] = useState(settings.macroGoals !== null);
  const [macros, setMacros] = useState({
    protein: String(settings.macroGoals?.protein ?? ''),
    carbs: String(settings.macroGoals?.carbs ?? ''),
    fat: String(settings.macroGoals?.fat ?? ''),
  });
  const [estimating, setEstimating] = useState(false);
  const [sex, setSex] = useState<Sex>('female');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<WeightGoal>('maintain');
  const [stats, setStats] = useState<BodyStatsInput>({ age: '', feet: '', inches: '', cm: '', weight: '' });
  const [statErrors, setStatErrors] = useState<BodyStatsErrors>({});
  const [error, setError] = useState<string | null>(null);

  const calorieNumber = Number(calories);
  const calorieValid = Number.isInteger(calorieNumber) && calorieNumber >= MIN_CALORIE_TARGET && calorieNumber <= MAX_CALORIE_TARGET;

  const step = (delta: number) => {
    Haptics.selectionAsync();
    const next = Math.min(Math.max((Number(calories) || 0) + delta, MIN_CALORIE_TARGET), MAX_CALORIE_TARGET);
    setCalories(String(Math.round(next / CALORIE_STEP) * CALORIE_STEP));
  };

  const estimate = () => {
    const parsed = parseBodyStats(stats, { weightUnit: settings.weightUnit, heightUnit: settings.heightUnit });
    if (!parsed.ok) {
      setStatErrors(parsed.errors);
      return;
    }
    setStatErrors({});
    const targets = calculateNutritionTargets({ sex, ...parsed.value }, activity, goal);
    setCalories(String(targets.calories));
    setMacros({ protein: String(targets.protein), carbs: String(targets.carbs), fat: String(targets.fat) });
    setMacrosOn(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const suggestMacros = () => {
    if (!calorieValid) return;
    const weightKg = parseBodyStats(stats, { weightUnit: settings.weightUnit, heightUnit: settings.heightUnit });
    const kg = weightKg.ok ? weightKg.value.weightKg : 70;
    const targets = calculateMacroTargets(calorieNumber, kg, goal);
    setMacros({ protein: String(targets.protein), carbs: String(targets.carbs), fat: String(targets.fat) });
  };

  const save = () => {
    if (!calorieValid) {
      setError(`Enter a goal between ${formatNumber(MIN_CALORIE_TARGET)} and ${formatNumber(MAX_CALORIE_TARGET)} kcal.`);
      return;
    }
    let macroGoals = null;
    if (macrosOn) {
      const values = { protein: Number(macros.protein), carbs: Number(macros.carbs), fat: Number(macros.fat) };
      if (Object.values(values).some((value) => !Number.isFinite(value) || value < 0 || value > 2000)) {
        setError('Macro targets need to be whole grams (0–2000).');
        return;
      }
      macroGoals = { protein: Math.round(values.protein), carbs: Math.round(values.carbs), fat: Math.round(values.fat) };
    }
    updateSettings({ calorieGoal: calorieNumber, macroGoals });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Stack.Screen options={{ headerRight: () => <CloseButton onPress={() => router.back()} />, headerTitleAlign: 'center' }} />
      <Card style={styles.card}>
        <ThemedText variant="headline">Calories per day</ThemedText>
        <View style={styles.goalRow}>
          <Pressable onPress={() => step(-CALORIE_STEP)} accessibilityRole="button" accessibilityLabel={`${CALORIE_STEP} fewer`} style={[styles.stepButton, { backgroundColor: colors.backgroundSecondary }]}>
            <AppIcon name="minus" size={18} color={colors.text} weight="semibold" />
          </Pressable>
          <TextField label="" value={calories} onChangeText={(text) => setCalories(text.replace(/[^0-9]/g, ''))} keyboardType="number-pad" maxLength={5} suffix="kcal" accessibilityLabel="Daily calorie goal" />
          <Pressable onPress={() => step(CALORIE_STEP)} accessibilityRole="button" accessibilityLabel={`${CALORIE_STEP} more`} style={[styles.stepButton, { backgroundColor: colors.backgroundSecondary }]}>
            <AppIcon name="plus" size={18} color={colors.text} weight="semibold" />
          </Pressable>
        </View>
        <ThemedText variant="footnote" color="secondary">
          Not sure? Most adults land between 1,800 and 2,600. Or estimate it below.
        </ThemedText>
      </Card>

      <Card style={styles.card}>
        <Pressable onPress={() => setEstimating((open) => !open)} accessibilityRole="button" accessibilityState={{ expanded: estimating }} style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <ThemedText variant="headline">Estimate from my body</ThemedText>
            <ThemedText variant="footnote" color="secondary">
              A standard formula (Mifflin–St Jeor). Nothing you enter here is saved.
            </ThemedText>
          </View>
          <AppIcon name={estimating ? 'chevronDown' : 'chevronRight'} size={14} color={colors.textTertiary} weight="semibold" />
        </Pressable>
        {estimating ? (
          <View style={styles.form}>
            <PillTabs options={SEX_OPTIONS} value={sex} onChange={setSex} accessibilityLabel="Sex, for the estimate" />
            <TextField label="Age" value={stats.age} onChangeText={(age) => setStats({ ...stats, age: age.replace(/[^0-9]/g, '') })} keyboardType="number-pad" maxLength={3} error={statErrors.age} />
            {settings.heightUnit === 'cm' ? (
              <TextField label="Height" value={stats.cm} onChangeText={(cm) => setStats({ ...stats, cm: cm.replace(/[^0-9.]/g, '') })} keyboardType="decimal-pad" suffix="cm" error={statErrors.height} />
            ) : (
              <View style={styles.row}>
                <TextField label="Height" value={stats.feet} onChangeText={(feet) => setStats({ ...stats, feet: feet.replace(/[^0-9]/g, '') })} keyboardType="number-pad" suffix="ft" maxLength={1} error={statErrors.height} />
                <TextField label=" " value={stats.inches} onChangeText={(inches) => setStats({ ...stats, inches: inches.replace(/[^0-9]/g, '') })} keyboardType="number-pad" suffix="in" maxLength={2} />
              </View>
            )}
            <TextField label="Weight" value={stats.weight} onChangeText={(weight) => setStats({ ...stats, weight: weight.replace(/[^0-9.]/g, '') })} keyboardType="decimal-pad" suffix={settings.weightUnit} error={statErrors.weight} />
            <OptionPicker label="Activity" options={ACTIVITY_OPTIONS.map((option) => ({ value: option.value, label: option.title }))} value={activity} onChange={setActivity} />
            <PillTabs options={GOAL_OPTIONS.map((option) => ({ value: option.value, label: option.title.replace(' weight', '') }))} value={goal} onChange={setGoal} accessibilityLabel="Goal" />
            <Button label="Estimate my goal" variant="secondary" onPress={estimate} />
          </View>
        ) : null}
      </Card>

      <Card style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <ThemedText variant="headline">Macro targets</ThemedText>
            <ThemedText variant="footnote" color="secondary">
              Show grams of protein, carbs, and fat against a target.
            </ThemedText>
          </View>
          <Switch value={macrosOn} onValueChange={setMacrosOn} trackColor={{ true: colors.accent, false: colors.border }} accessibilityLabel="Macro targets" />
        </View>
        {macrosOn ? (
          <View style={styles.form}>
            <View style={styles.row}>
              <TextField label="Protein" value={macros.protein} onChangeText={(protein) => setMacros({ ...macros, protein: protein.replace(/[^0-9]/g, '') })} keyboardType="number-pad" suffix="g" maxLength={4} />
              <TextField label="Carbs" value={macros.carbs} onChangeText={(carbs) => setMacros({ ...macros, carbs: carbs.replace(/[^0-9]/g, '') })} keyboardType="number-pad" suffix="g" maxLength={4} />
              <TextField label="Fat" value={macros.fat} onChangeText={(fat) => setMacros({ ...macros, fat: fat.replace(/[^0-9]/g, '') })} keyboardType="number-pad" suffix="g" maxLength={4} />
            </View>
            <Pressable onPress={suggestMacros} accessibilityRole="button" hitSlop={8} disabled={!calorieValid}>
              <ThemedText variant="footnote" style={{ color: calorieValid ? colors.accent : colors.textTertiary, fontWeight: '600' }}>
                Suggest a split for {formatNumber(calorieNumber || 0)} kcal
              </ThemedText>
            </Pressable>
          </View>
        ) : null}
      </Card>

      {error ? (
        <ThemedText variant="footnote" style={{ color: colors.danger }} accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      ) : null}
      <Button label="Save goal" onPress={save} />

      <View style={[styles.note, { backgroundColor: colors.backgroundSecondary }]}>
        <AppIcon name="info" size={18} color={colors.textSecondary} />
        <ThemedText variant="footnote" color="secondary" style={styles.noteText}>
          Targets are estimates. JustTrack won’t suggest going below {formatNumber(MIN_CALORIE_TARGET)} calories a day — talk to a doctor or dietitian if you think you need less.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing['5xl'] },
  card: { gap: Spacing.md },
  goalRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  stepButton: { width: 52, height: 52, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  toggleText: { flex: 1, gap: 2 },
  form: { gap: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm },
  note: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radii.md },
  noteText: { flex: 1 },
});
