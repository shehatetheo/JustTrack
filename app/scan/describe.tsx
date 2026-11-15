import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TermChips } from '@/components/food/SearchChips';
import { SheetFrame } from '@/components/layout/SheetFrame';
import { SheetHeader } from '@/components/layout/SheetHeader';
import { InkReveal, Stagger } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { FocusLine } from '@/components/ui/FocusLine';
import { Glass } from '@/components/ui/Glass';
import { ThemedText } from '@/components/ui/ThemedText';
import { Fonts } from '@/constants/fonts';
import { Haptic } from '@/constants/motion';
import { HAIRLINE, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useMealScan } from '@/hooks/useMealScan';
import { MAX_DESCRIPTION_LENGTH } from '@/services/mealScanService';
import { singleParam } from '@/utils/routeParams';

/** Meals people actually type, to show the register the box expects. */
const EXAMPLES = ['2 scrambled eggs and toast with butter', 'Chipotle chicken bowl with guac', 'Half a large pepperoni pizza', 'Protein shake and a banana', 'Iced vanilla latte, 16 oz', 'Chicken caesar salad, no croutons'];

const HOW = ['It is split into foods and each portion is sized.', 'Each food gets database matches to pick from, or keep the estimate.', 'Adjust the grams, then add it all to a meal.'];

/**
 * Describe what you ate in a sentence. The model splits it into foods,
 * sizes each one, and the review screen offers database matches next to
 * the estimate, so the user picks the numbers they trust.
 */
export default function DescribeScreen() {
  return (
    <SheetFrame>
      <Describe />
    </SheetFrame>
  );
}

function Describe() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ text?: string }>();
  const { describe, busy } = useMealScan();
  const [text, setText] = useState(singleParam(params.text) ?? '');
  const [focused, setFocused] = useState(false);
  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0 && !busy;

  const submit = () => {
    if (!canSubmit) return;
    Haptic.log();
    void describe(trimmed);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: colors.background }]}>
      <SheetHeader title="Describe it" tagline="write it the way you’d say it" onClose={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <InkReveal>
          <Glass radius={Radii['2xl']} lit={focused} style={styles.box}>
            <TextInput
              value={text}
              onChangeText={(value) => setText(value.slice(0, MAX_DESCRIPTION_LENGTH))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="2 eggs, whole wheat toast with butter, and an iced latte…"
              placeholderTextColor={colors.textTertiary}
              multiline
              autoFocus
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={submit}
              accessibilityLabel="What you ate"
              style={[styles.input, { color: colors.text }]}
            />
            <FocusLine active={focused} />
            <View style={styles.boxFooter}>
              <ThemedText variant="caption1" color="secondary" style={styles.hint}>
                Say how much when you can: 2 eggs, half a bowl, large fries.
              </ThemedText>
              <ThemedText variant="caption2" color="tertiary" style={styles.count}>
                {text.length}/{MAX_DESCRIPTION_LENGTH}
              </ThemedText>
            </View>
          </Glass>
        </InkReveal>

        <Stagger index={1}>
          <TermChips title="Try" terms={EXAMPLES} onPick={setText} />
        </Stagger>

        <Stagger index={2}>
          <Glass radius={Radii.xl} style={styles.how}>
            {HOW.map((line, index) => (
              <View key={line} style={styles.howRow}>
                <View style={[styles.stepDot, { borderColor: colors.borderAccent }]}>
                  <ThemedText variant="caption2" style={[styles.stepNumber, { color: colors.accentText }]}>
                    {index + 1}
                  </ThemedText>
                </View>
                <ThemedText variant="footnote" color="secondary" style={styles.howText}>
                  {line}
                </ThemedText>
              </View>
            ))}
          </Glass>
        </Stagger>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + Spacing.md }]}>
        <Button label={busy ? 'Working it out…' : 'Work it out'} onPress={submit} disabled={!canSubmit} haptic={null} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingVertical: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing['3xl'] },
  box: { marginHorizontal: Spacing.lg, padding: Spacing.lg, gap: Spacing.sm },
  input: { minHeight: 120, textAlignVertical: 'top', fontFamily: Fonts.body, fontSize: 19, lineHeight: 27, outlineStyle: 'solid', outlineWidth: 0 },
  boxFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  hint: { flexShrink: 1 },
  count: { fontVariant: ['tabular-nums'] },
  how: { marginHorizontal: Spacing.lg, padding: Spacing.lg, gap: Spacing.md },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  stepDot: { width: 22, height: 22, borderRadius: Radii.full, borderWidth: HAIRLINE, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumber: { fontWeight: '700' },
  howText: { flex: 1 },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: HAIRLINE },
});
