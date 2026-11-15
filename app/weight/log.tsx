import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SheetFrame } from '@/components/layout/SheetFrame';
import { SheetHeader } from '@/components/layout/SheetHeader';
import { InkReveal } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { OrnateFrame } from '@/components/ui/OrnateFrame';
import { StepperButton, StepperTick } from '@/components/ui/Stepper';
import { ThemedText } from '@/components/ui/ThemedText';
import { Fonts } from '@/constants/fonts';
import { Haptic } from '@/constants/motion';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/hooks/useSettings';
import { useWeights } from '@/hooks/useWeights';
import { settingsStore } from '@/lib/settings/settingsStore';
import { MAX_WEIGHT_KG, MIN_WEIGHT_KG } from '@/lib/weight/limits';
import { logWeight } from '@/lib/weight/weightStore';
import { singleParam } from '@/utils/routeParams';
import { weightFromInput, weightValue } from '@/utils/weight';

/** One number and a Save button: today's weigh-in, or (with ?goal=1) the weight to aim for. */
export default function LogWeightScreen() {
  return (
    <SheetFrame>
      <LogWeight />
    </SheetFrame>
  );
}

function LogWeight() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ goal?: string }>();
  const forGoal = singleParam(params.goal) === '1';
  const { weightUnit, goalWeightKg } = useSettings();
  const entries = useWeights();
  const latest = entries[entries.length - 1]?.kg ?? null;
  const starting = forGoal ? (goalWeightKg ?? latest) : latest;
  const [text, setText] = useState(starting !== null ? weightValue(starting, weightUnit) : '');
  const step = weightUnit === 'kg' ? 0.1 : 0.2;
  const kg = weightFromInput(text, weightUnit);
  const valid = Number.isFinite(kg) && kg >= MIN_WEIGHT_KG && kg <= MAX_WEIGHT_KG;

  const nudge = (direction: 1 | -1) => {
    const current = Number.parseFloat(text.replace(',', '.'));
    if (!Number.isFinite(current)) return;
    setText((Math.round((current + direction * step) * 10) / 10).toFixed(1));
  };

  const save = () => {
    if (!valid) return;
    if (forGoal) settingsStore.set((current) => ({ ...current, goalWeightKg: Math.round(kg * 100) / 100 }));
    else logWeight(kg);
    Haptic.success();
    router.back();
  };

  const clearGoal = () => {
    settingsStore.set((current) => ({ ...current, goalWeightKg: null }));
    router.back();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: colors.background }]}>
      <SheetHeader title={forGoal ? 'Goal weight' : 'Log weight'} tagline={forGoal ? 'where you’re headed' : 'one number, same time of day'} onClose={() => router.back()} />

      <View style={styles.center}>
        <ThemedText variant="overline" color="tertiary">
          {forGoal ? 'THE WEIGHT YOU’RE WORKING TOWARD' : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
        </ThemedText>
        <InkReveal>
          <OrnateFrame variant="corners" corner={36} style={styles.frame}>
            <View style={styles.entry}>
              <StepperButton direction="less" accessibilityLabel={`${step} ${weightUnit} less`} onPress={() => nudge(-1)} />
              <StepperTick value={text}>
                <View style={styles.figure}>
                  <TextInput
                    value={text}
                    onChangeText={(value) => setText(value.replace(/[^0-9.,]/g, '').slice(0, 6))}
                    keyboardType="decimal-pad"
                    autoFocus
                    selectTextOnFocus
                    placeholder="0.0"
                    placeholderTextColor={colors.textTertiary}
                    selectionColor={colors.accent}
                    accessibilityLabel={forGoal ? `Goal weight in ${weightUnit}` : `Weight in ${weightUnit}`}
                    style={[styles.input, { color: colors.text }]}
                  />
                  <ThemedText variant="title3" color="secondary">
                    {weightUnit}
                  </ThemedText>
                </View>
              </StepperTick>
              <StepperButton direction="more" accessibilityLabel={`${step} ${weightUnit} more`} onPress={() => nudge(1)} />
            </View>
          </OrnateFrame>
        </InkReveal>
        <ThemedText variant="footnote" color="secondary" style={styles.note}>
          {text.length > 0 && !valid ? `Enter a weight between ${weightValue(MIN_WEIGHT_KG, weightUnit)} and ${weightValue(MAX_WEIGHT_KG, weightUnit)} ${weightUnit}.` : forGoal ? 'It shows as a line on your chart.' : 'Logging again today replaces today’s number.'}
        </ThemedText>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button label={forGoal ? 'Set goal' : 'Save'} onPress={save} disabled={!valid} />
        {forGoal && goalWeightKg !== null ? <Button label="Remove goal" variant="quiet" onPress={clearGoal} /> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, paddingHorizontal: Spacing.lg },
  frame: { paddingVertical: Spacing['2xl'], paddingHorizontal: Spacing.lg },
  entry: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  figure: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  input: { fontFamily: Fonts.bodyHeavy, fontSize: 60, lineHeight: 68, letterSpacing: -2, fontVariant: ['tabular-nums'], minWidth: 150, textAlign: 'center', padding: 0, outlineStyle: 'solid', outlineWidth: 0 },
  note: { textAlign: 'center' },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm },
});
