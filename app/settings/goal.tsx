import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SheetFrame } from '@/components/layout/SheetFrame';
import { SheetHeader } from '@/components/layout/SheetHeader';
import { PressScale, Stagger } from '@/components/motion';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Glass } from '@/components/ui/Glass';
import { OptionPicker } from '@/components/ui/OptionPicker';
import { PillTabs } from '@/components/ui/PillTabs';
import { StepperButton } from '@/components/ui/Stepper';
import { TextField } from '@/components/ui/TextField';
import { ThemedText } from '@/components/ui/ThemedText';
import { Toggle } from '@/components/ui/Toggle';
import { Haptic } from '@/constants/motion';
import { ACTIVITY_OPTIONS, CALORIE_STEP, GOAL_OPTIONS, MAX_CALORIE_TARGET, SEX_OPTIONS } from '@/constants/onboarding';
import { HAIRLINE, MIN_TAP, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/hooks/useSettings';
import { calculateMacroTargets, calculateNutritionTargets, MIN_CALORIE_TARGET } from '@/lib/nutrition/calorieTarget';
import { parseBodyStats, type BodyStatsErrors, type BodyStatsInput } from '@/lib/onboarding/bodyStats';
import { updateSettings } from '@/lib/settings/settingsStore';
import type { ActivityLevel, Sex, WeightGoal } from '@/types';
import { formatNumber } from '@/utils/format';

/** The daily calorie goal, by hand or estimated from a few body stats; optional macro targets. */
export default function GoalScreen() {
  return (
    <SheetFrame>
      <Goal />
    </SheetFrame>
  );
}

function Goal() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
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
  const [stats, setStats] = useState<BodyStatsInput>({
    age: '',
    feet: '',
    inches: '',
    cm: '',
    weight: '',
  });
  const [statErrors, setStatErrors] = useState<BodyStatsErrors>({});
  const [error, setError] = useState<string | null>(null);

  const calorieNumber = Number(calories);
  const atFloor = Number.isFinite(calorieNumber) && calories.length > 0 && calorieNumber <= MIN_CALORIE_TARGET;
  const calorieValid = Number.isInteger(calorieNumber) && calorieNumber >= MIN_CALORIE_TARGET && calorieNumber <= MAX_CALORIE_TARGET;

  const step = (delta: number) => {
    const next = Math.min(Math.max((Number(calories) || 0) + delta, MIN_CALORIE_TARGET), MAX_CALORIE_TARGET);
    setCalories(String(Math.round(next / CALORIE_STEP) * CALORIE_STEP));
  };

  const estimate = () => {
    const parsed = parseBodyStats(stats, {
      weightUnit: settings.weightUnit,
      heightUnit: settings.heightUnit,
    });
    if (!parsed.ok) {
      setStatErrors(parsed.errors);
      return;
    }
    setStatErrors({});
    const targets = calculateNutritionTargets({ sex, ...parsed.value }, activity, goal);
    setCalories(String(targets.calories));
    setMacros({
      protein: String(targets.protein),
      carbs: String(targets.carbs),
      fat: String(targets.fat),
    });
    setMacrosOn(true);
    Haptic.success();
  };

  const suggestMacros = () => {
    if (!calorieValid) return;
    const weightKg = parseBodyStats(stats, {
      weightUnit: settings.weightUnit,
      heightUnit: settings.heightUnit,
    });
    const kg = weightKg.ok ? weightKg.value.weightKg : 70;
    const targets = calculateMacroTargets(calorieNumber, kg, goal);
    setMacros({
      protein: String(targets.protein),
      carbs: String(targets.carbs),
      fat: String(targets.fat),
    });
  };

  const save = () => {
    if (!calorieValid) {
      setError(`Enter a goal between ${formatNumber(MIN_CALORIE_TARGET)} and ${formatNumber(MAX_CALORIE_TARGET)} kcal.`);
      return;
    }
    let macroGoals = null;
    if (macrosOn) {
      const values = {
        protein: Number(macros.protein),
        carbs: Number(macros.carbs),
        fat: Number(macros.fat),
      };
      if (Object.values(values).some((value) => !Number.isFinite(value) || value < 0 || value > 2000)) {
        setError('Macro targets need to be whole grams (0–2000).');
        return;
      }
      macroGoals = {
        protein: Math.round(values.protein),
        carbs: Math.round(values.carbs),
        fat: Math.round(values.fat),
      };
    }
    updateSettings({ calorieGoal: calorieNumber, macroGoals });
    Haptic.success();
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SheetHeader title="Daily goal" tagline="a number to steer by" onClose={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Stagger index={0}>
          <Card style={styles.card} lit>
            <ThemedText variant="title3">calories per day</ThemedText>
            <View style={styles.goalRow}>
              <View style={styles.stepSlot}>
                <StepperButton direction="less" accessibilityLabel={`${CALORIE_STEP} fewer`} onPress={() => step(-CALORIE_STEP)} disabled={atFloor} />
              </View>
              <TextField label="" value={calories} onChangeText={(text) => setCalories(text.replace(/[^0-9]/g, ''))} keyboardType="number-pad" maxLength={5} suffix="kcal" accessibilityLabel="Daily calorie goal" />
              <View style={styles.stepSlot}>
                <StepperButton direction="more" accessibilityLabel={`${CALORIE_STEP} more`} onPress={() => step(CALORIE_STEP)} />
              </View>
            </View>
            <ThemedText variant="footnote" color="secondary">
              {atFloor ? `${formatNumber(MIN_CALORIE_TARGET)} is as low as JustTrack goes. Below that it gets hard to fit in enough protein, vitamins and minerals.` : 'Not sure? Most adults land between 1,800 and 2,600. Or estimate it below.'}
            </ThemedText>
          </Card>
        </Stagger>

        <Stagger index={1}>
          <Card style={styles.card}>
            <PressScale onPress={() => setEstimating((open) => !open)} pressScale={0.99} haptic="select" accessibilityRole="button" accessibilityState={{ expanded: estimating }} style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <ThemedText variant="title3">estimate it for me</ThemedText>
                <ThemedText variant="footnote" color="secondary">
                  A standard formula (Mifflin–St Jeor). Nothing you enter here is saved.
                </ThemedText>
              </View>
              <AppIcon name={estimating ? 'chevronUp' : 'chevronDown'} size={14} color={colors.textTertiary} weight="semibold" />
            </PressScale>
            {estimating ? (
              <View style={styles.form}>
                <PillTabs options={SEX_OPTIONS} value={sex} onChange={setSex} accessibilityLabel="Sex, for the estimate" />
                <TextField label="Age" value={stats.age} onChangeText={(age) => setStats({ ...stats, age: age.replace(/[^0-9]/g, '') })} keyboardType="number-pad" maxLength={3} error={statErrors.age} />
                {settings.heightUnit === 'cm' ? (
                  <TextField label="Height" value={stats.cm} onChangeText={(cm) => setStats({ ...stats, cm: cm.replace(/[^0-9.]/g, '') })} keyboardType="decimal-pad" suffix="cm" error={statErrors.height} />
                ) : (
                  <View style={styles.row}>
                    <TextField
                      label="Height"
                      value={stats.feet}
                      onChangeText={(feet) =>
                        setStats({
                          ...stats,
                          feet: feet.replace(/[^0-9]/g, ''),
                        })
                      }
                      keyboardType="number-pad"
                      suffix="ft"
                      maxLength={1}
                      error={statErrors.height}
                    />
                    <TextField
                      label=" "
                      value={stats.inches}
                      onChangeText={(inches) =>
                        setStats({
                          ...stats,
                          inches: inches.replace(/[^0-9]/g, ''),
                        })
                      }
                      keyboardType="number-pad"
                      suffix="in"
                      maxLength={2}
                    />
                  </View>
                )}
                <TextField
                  label="Weight"
                  value={stats.weight}
                  onChangeText={(weight) =>
                    setStats({
                      ...stats,
                      weight: weight.replace(/[^0-9.]/g, ''),
                    })
                  }
                  keyboardType="decimal-pad"
                  suffix={settings.weightUnit}
                  error={statErrors.weight}
                />
                <OptionPicker
                  label="Activity"
                  options={ACTIVITY_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.title,
                  }))}
                  value={activity}
                  onChange={setActivity}
                />
                <PillTabs
                  options={GOAL_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.title.replace(' weight', ''),
                  }))}
                  value={goal}
                  onChange={setGoal}
                  accessibilityLabel="Goal"
                />
                <Button label="Estimate my goal" variant="secondary" onPress={estimate} />
              </View>
            ) : null}
          </Card>
        </Stagger>

        <Stagger index={2}>
          <Card style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <ThemedText variant="title3">macro targets</ThemedText>
                <ThemedText variant="footnote" color="secondary">
                  Show grams of protein, carbs, and fat against a target.
                </ThemedText>
              </View>
              <Toggle value={macrosOn} onValueChange={setMacrosOn} accessibilityLabel="Macro targets" />
            </View>
            {macrosOn ? (
              <View style={styles.form}>
                <View style={styles.row}>
                  <TextField
                    label="Protein"
                    value={macros.protein}
                    onChangeText={(protein) =>
                      setMacros({
                        ...macros,
                        protein: protein.replace(/[^0-9]/g, ''),
                      })
                    }
                    keyboardType="number-pad"
                    suffix="g"
                    maxLength={4}
                  />
                  <TextField
                    label="Carbs"
                    value={macros.carbs}
                    onChangeText={(carbs) =>
                      setMacros({
                        ...macros,
                        carbs: carbs.replace(/[^0-9]/g, ''),
                      })
                    }
                    keyboardType="number-pad"
                    suffix="g"
                    maxLength={4}
                  />
                  <TextField label="Fat" value={macros.fat} onChangeText={(fat) => setMacros({ ...macros, fat: fat.replace(/[^0-9]/g, '') })} keyboardType="number-pad" suffix="g" maxLength={4} />
                </View>
                <PressScale onPress={suggestMacros} haptic="select" accessibilityRole="button" disabled={!calorieValid} style={styles.link}>
                  <ThemedText
                    variant="footnote"
                    style={[
                      styles.strong,
                      {
                        color: calorieValid ? colors.accentText : colors.textTertiary,
                      },
                    ]}
                  >
                    suggest a split for {formatNumber(calorieNumber || 0)} kcal
                  </ThemedText>
                </PressScale>
              </View>
            ) : null}
          </Card>
        </Stagger>

        <Stagger index={3}>
          <Glass radius={Radii.xl} style={styles.note}>
            <ThemedText variant="overline" color="tertiary">
              WHY NOT LOWER THAN {formatNumber(MIN_CALORIE_TARGET)}?
            </ThemedText>
            <ThemedText variant="footnote" color="secondary">
              Eating very little makes it hard to get the protein, vitamins and minerals a body runs on, and it tends not to last. So the goal stops at {formatNumber(MIN_CALORIE_TARGET)} calories a day, and every target here is an estimate, not a prescription.
              If you think you need less, a doctor or dietitian can look at the whole picture with you.
            </ThemedText>
          </Glass>
        </Stagger>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + Spacing.md,
          },
        ]}
      >
        {error ? (
          <ThemedText variant="footnote" style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </ThemedText>
        ) : null}
        <Button label="Save goal" onPress={save} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  card: { gap: Spacing.md },
  goalRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  stepSlot: { height: 52, justifyContent: 'center' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    minHeight: MIN_TAP,
  },
  toggleText: { flex: 1, gap: 2 },
  form: { gap: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm },
  link: {
    alignSelf: 'flex-start',
    minHeight: MIN_TAP / 2,
    justifyContent: 'center',
  },
  strong: { fontWeight: '600' },
  note: { padding: Spacing.lg, gap: Spacing.sm },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: HAIRLINE,
  },
  error: { textAlign: 'center' },
});
