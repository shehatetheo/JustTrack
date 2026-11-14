import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { Logo } from '@/components/ui/Logo';
import { ThemedText } from '@/components/ui/ThemedText';
import { APP_NAME, HOMETOWN_LINE, PROMISES } from '@/constants/brand';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { updateSettings } from '@/lib/settings/settingsStore';

/** First launch: who this is for, what it promises, and one button. */
export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const start = (thenGoal: boolean) => {
    updateSettings({ welcomed: true, welcomedAt: new Date().toISOString() });
    if (thenGoal) router.push('/settings/goal');
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]} locations={[0, 0.5, 1]} style={styles.root}>
      <View style={[styles.content, { paddingTop: insets.top + Spacing['4xl'], paddingBottom: insets.bottom + Spacing['2xl'] }]}>
        <View style={styles.hero}>
          <Animated.View entering={FadeInDown.duration(600)}>
            <Logo width={96} color={colors.onGradient} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(200).duration(600)} style={[styles.wordmark, { color: colors.onGradient }]} accessibilityRole="header">
            {APP_NAME.toUpperCase()}
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(350).duration(600)} style={[styles.headline, { color: colors.onGradient }]}>
            Snap your food.{'\n'}Know your calories.
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(500).duration(600)} style={[styles.sub, { color: colors.onGradientMuted }]}>
            {HOMETOWN_LINE}
          </Animated.Text>
        </View>

        <Animated.View entering={FadeInDown.delay(650).duration(600)} style={styles.bottom}>
          <View style={styles.promises}>
            {PROMISES.map((promise) => (
              <View key={promise} style={styles.promise}>
                <AppIcon name="checkCircle" size={18} color={colors.accent} />
                <ThemedText variant="subheadEmphasized">{promise}</ThemedText>
              </View>
            ))}
          </View>
          <Pressable
            onPress={() => start(false)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.primary, { backgroundColor: colors.fab, opacity: pressed ? 0.85 : 1 }]}
          >
            <ThemedText variant="bodyEmphasized" style={{ color: colors.fabIcon }}>
              Start tracking
            </ThemedText>
          </Pressable>
          <Pressable onPress={() => start(true)} accessibilityRole="button" style={styles.secondary} hitSlop={8}>
            <ThemedText variant="subheadEmphasized">Set a calorie goal first</ThemedText>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Spacing['2xl'], justifyContent: 'space-between' },
  hero: { alignItems: 'center', gap: Spacing.lg, paddingTop: Spacing['3xl'] },
  wordmark: { fontSize: 15, fontWeight: '700', letterSpacing: 6 },
  headline: { fontSize: 36, lineHeight: 42, fontWeight: '700', letterSpacing: -0.8, textAlign: 'center' },
  sub: { fontSize: 16, lineHeight: 22, textAlign: 'center', maxWidth: 320 },
  bottom: { gap: Spacing.md },
  promises: { gap: Spacing.sm, marginBottom: Spacing.lg },
  promise: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  primary: { alignItems: 'center', justifyContent: 'center', borderRadius: Radii.full, paddingVertical: Spacing.lg, minHeight: 56 },
  secondary: { alignItems: 'center', paddingVertical: Spacing.sm },
});
