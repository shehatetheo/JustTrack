import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TermChips } from '@/components/food/SearchChips';
import { Button } from '@/components/ui/Button';
import { CloseButton } from '@/components/ui/CloseButton';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useMealScan } from '@/hooks/useMealScan';
import { MAX_DESCRIPTION_LENGTH } from '@/services/mealScanService';
import { singleParam } from '@/utils/routeParams';

/** Meals people actually type, to show the register the box expects. */
const EXAMPLES = ['2 scrambled eggs and toast with butter', 'Chipotle chicken bowl with guac', 'Half a large pepperoni pizza', 'Protein shake and a banana', 'Iced vanilla latte, 16 oz', 'Chicken caesar salad, no croutons'];

/**
 * Describe what you ate in a sentence. The model splits it into foods,
 * sizes each one, and the review screen offers database matches next to
 * the estimate, so the user picks the numbers they trust.
 */
export default function DescribeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ text?: string }>();
  const { describe, busy } = useMealScan();
  const [text, setText] = useState(singleParam(params.text) ?? '');
  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0 && !busy;

  const submit = () => {
    if (!canSubmit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void describe(trimmed);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: true, title: 'Describe what you ate', headerTitleAlign: 'center', headerShadowVisible: false, headerTintColor: colors.text, headerStyle: { backgroundColor: colors.background }, headerLeft: () => null, headerRight: () => <CloseButton onPress={() => router.back()} /> }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(260)} style={[styles.box, { backgroundColor: colors.surfaceTint }]}>
          <TextInput
            value={text}
            onChangeText={(value) => setText(value.slice(0, MAX_DESCRIPTION_LENGTH))}
            placeholder="2 eggs, whole wheat toast with butter, and an iced latte…"
            placeholderTextColor={colors.textTertiary}
            multiline
            autoFocus
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={submit}
            accessibilityLabel="What you ate"
            style={[Typography.title3, styles.input, { color: colors.text }]}
          />
          <View style={styles.boxFooter}>
            <View style={styles.hintRow}>
              <ThemedText variant="caption1" color="secondary" style={styles.hint}>
                Say how much when you can: 2 eggs, half a bowl, large fries.
              </ThemedText>
            </View>
            <ThemedText variant="caption2" color="tertiary" style={styles.count}>
              {text.length}/{MAX_DESCRIPTION_LENGTH}
            </ThemedText>
          </View>
        </Animated.View>

        <TermChips title="Try" terms={EXAMPLES} onPick={setText} />

        <View style={[styles.how, { backgroundColor: colors.surfaceTint }]}>
          {[
            ['1', 'AI splits it into foods and sizes each portion.'],
            ['2', 'Each food gets database matches to pick from, or keep the estimate.'],
            ['3', 'Adjust grams, then add it all to a meal.'],
          ].map(([step, line]) => (
            <View key={step} style={styles.howRow}>
              <View style={[styles.stepDot, { backgroundColor: colors.accentMuted }]}>
                <ThemedText variant="caption2" style={{ color: colors.accent, fontWeight: '700' }}>
                  {step}
                </ThemedText>
              </View>
              <ThemedText variant="footnote" color="secondary" style={styles.howText}>
                {line}
              </ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + Spacing.md }]}>
        <Button label={busy ? 'Working it out…' : 'Work it out'} onPress={submit} disabled={!canSubmit} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing['3xl'] },
  box: { borderRadius: Radii['2xl'], padding: Spacing.lg, gap: Spacing.md },
  input: { minHeight: 120, textAlignVertical: 'top', lineHeight: 28 },
  boxFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  hint: { flexShrink: 1 },
  count: { fontVariant: ['tabular-nums'] },
  how: { borderRadius: Radii['2xl'], padding: Spacing.lg, gap: Spacing.md },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  stepDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  howText: { flex: 1 },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
});
