import { useRouter } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

interface OnboardingScaffoldProps {
  step?: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Pinned to the bottom, above the keyboard. */
  footer: React.ReactNode;
  showBack?: boolean;
  /** 'close' shows an ✕ — for screens presented as modals. */
  backIcon?: 'back' | 'close';
}

export function OnboardingScaffold({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  footer,
  showBack = true,
  backIcon = 'back',
}: OnboardingScaffoldProps) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const progress = step && totalSteps ? step / totalSteps : null;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          {showBack && router.canGoBack() ? (
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={backIcon === 'close' ? 'Close' : 'Back'}
              hitSlop={12}
              style={styles.back}
            >
              <AppIcon name={backIcon === 'close' ? 'close' : 'chevronLeft'} size={20} color={colors.text} weight="semibold" />
            </Pressable>
          ) : (
            <View style={styles.back} />
          )}
          {progress !== null ? (
            <View
              style={[styles.track, { backgroundColor: colors.surfaceRaised }]}
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={`Step ${step} of ${totalSteps}`}
            >
              <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: colors.text }]} />
            </View>
          ) : null}
          <View style={styles.back} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <ThemedText variant="title1" accessibilityRole="header">
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText variant="body" color="secondary" style={styles.subtitle}>
              {subtitle}
            </ThemedText>
          ) : null}
          <View style={styles.body}>{children}</View>
        </ScrollView>

        <View style={styles.footer}>{footer}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  back: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  track: { flex: 1, height: 4, borderRadius: Radii.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radii.full },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing['2xl'] },
  subtitle: { marginTop: Spacing.sm },
  body: { marginTop: Spacing['2xl'], gap: Spacing.xl },
  footer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing.md, gap: Spacing.sm },
});
