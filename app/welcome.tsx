import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedBackground } from '@/components/background/AnimatedBackground';
import { MONOGRAM_DRAW_MS, MonogramDraw } from '@/components/brand/MonogramDraw';
import { Crescent } from '@/components/decor';
import { InkReveal, Stagger } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { Wordmark } from '@/components/ui/Wordmark';
import { HOMETOWN_LINE, PROMISES } from '@/constants/brand';
import { Radii, Spacing } from '@/constants/theme';
import { OnDark, useAppTheme } from '@/contexts/ThemeContext';
import { useLightStatusBar } from '@/lib/statusBar';
import { updateSettings } from '@/lib/settings/settingsStore';

const MARK = 116;

/** First launch: the mark is written on, then who this is for, what it promises, and one button. */
export default function WelcomeScreen() {
  return (
    <OnDark>
      <Welcome />
    </OnDark>
  );
}

function Welcome() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  useLightStatusBar();

  const start = (thenGoal: boolean) => {
    updateSettings({ welcomed: true, welcomedAt: new Date().toISOString() });
    if (thenGoal) router.push('/settings/goal');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.hero }]}>
      <AnimatedBackground page="welcome" fit="cover" />
      <LinearGradient pointerEvents="none" colors={[colors.photoPlate, colors.photoPlate, colors.hero]} locations={[0, 0.5, 0.92]} style={StyleSheet.absoluteFill} />

      <View style={[styles.content, { paddingTop: insets.top + Spacing['4xl'], paddingBottom: insets.bottom + Spacing['2xl'] }]}>
        <View style={styles.hero}>
          {/* A black disc behind the mark: the pen effect needs a plain ground to write on. */}
          <View style={[styles.plate, { backgroundColor: colors.hero }]}>
            <MonogramDraw size={MARK} ground={colors.hero} color={colors.onHero} delay={200} />
          </View>
          <Stagger delay={200 + MONOGRAM_DRAW_MS - 200}>
            <Wordmark size={20} color={colors.onHero} />
          </Stagger>
          <Stagger delay={200 + MONOGRAM_DRAW_MS - 80}>
            <ThemedText variant="largeTitle" style={[styles.center, { color: colors.onHero }]} accessibilityRole="header">
              {'snap your food.\nknow your calories.'}
            </ThemedText>
          </Stagger>
          <Stagger delay={200 + MONOGRAM_DRAW_MS + 40}>
            <ThemedText variant="tagline" style={[styles.center, styles.sub, { color: colors.onHeroMuted }]}>
              {HOMETOWN_LINE}
            </ThemedText>
          </Stagger>
        </View>

        <InkReveal delay={200 + MONOGRAM_DRAW_MS + 160} style={styles.bottom}>
          <View style={styles.promises}>
            {PROMISES.map((promise) => (
              <View key={promise} style={styles.promise}>
                <Crescent size={15} color={colors.accent} />
                <ThemedText variant="subheadEmphasized" style={{ color: colors.onHero }}>
                  {promise.toLowerCase()}
                </ThemedText>
              </View>
            ))}
          </View>
          <Button label="Start tracking" onPress={() => start(false)} haptic="success" />
          <Button label="Set a calorie goal first" variant="quiet" size="md" onPress={() => start(true)} />
        </InkReveal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Spacing['2xl'], justifyContent: 'space-between' },
  hero: { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.xl },
  plate: { width: MARK + 20, height: MARK + 20, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  center: { textAlign: 'center' },
  sub: { maxWidth: 320 },
  bottom: { gap: Spacing.sm },
  promises: { gap: Spacing.sm, marginBottom: Spacing.lg },
  promise: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
