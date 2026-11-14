import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { CloseButton } from '@/components/ui/CloseButton';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
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
    Haptics.selectionAsync();
    setText((Math.round((current + direction * step) * 10) / 10).toFixed(1));
  };

  const save = () => {
    if (!valid) return;
    if (forGoal) settingsStore.set((current) => ({ ...current, goalWeightKg: Math.round(kg * 100) / 100 }));
    else logWeight(kg);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const clearGoal = () => {
    settingsStore.set((current) => ({ ...current, goalWeightKg: null }));
    router.back();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: forGoal ? 'Goal weight' : 'Log weight', headerRight: () => <CloseButton onPress={() => router.back()} />, headerTitleAlign: 'center' }} />

      <View style={styles.center}>
        <ThemedText variant="overline" color="tertiary">
          {forGoal ? 'THE WEIGHT YOU’RE WORKING TOWARD' : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
        </ThemedText>
        <View style={styles.entry}>
          <Pressable onPress={() => nudge(-1)} accessibilityRole="button" accessibilityLabel={`${step} ${weightUnit} less`} hitSlop={8} style={[styles.step, { backgroundColor: colors.surfaceTint, borderColor: colors.border }]}>
            <AppIcon name="minus" size={18} color={colors.text} weight="semibold" />
          </Pressable>
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
          <Pressable onPress={() => nudge(1)} accessibilityRole="button" accessibilityLabel={`${step} ${weightUnit} more`} hitSlop={8} style={[styles.step, { backgroundColor: colors.surfaceTint, borderColor: colors.border }]}>
            <AppIcon name="plus" size={18} color={colors.text} weight="semibold" />
          </Pressable>
        </View>
        <ThemedText variant="footnote" color="secondary" style={styles.note}>
          {text.length > 0 && !valid ? `Enter a weight between ${weightValue(MIN_WEIGHT_KG, weightUnit)} and ${weightValue(MAX_WEIGHT_KG, weightUnit)} ${weightUnit}.` : forGoal ? 'It shows as a line on your chart.' : 'Logging again today replaces today’s number.'}
        </ThemedText>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button label={forGoal ? 'Set goal' : 'Save'} onPress={save} disabled={!valid} />
        {forGoal && goalWeightKg !== null ? <Button label="Remove goal" variant="ghost" onPress={clearGoal} /> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, paddingHorizontal: Spacing.lg },
  entry: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  figure: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  input: { fontSize: 64, lineHeight: 72, fontWeight: '700', letterSpacing: -2, fontVariant: ['tabular-nums'], minWidth: 150, textAlign: 'center', padding: 0 },
  step: { width: 48, height: 48, borderRadius: Radii.md, borderWidth: StyleSheet.hairlineWidth * 2, alignItems: 'center', justifyContent: 'center' },
  note: { textAlign: 'center' },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm },
});
