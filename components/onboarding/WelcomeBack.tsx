import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedBackground } from '@/components/background/AnimatedBackground';
import { CountUp, InkReveal, PressScale, SlashWipe, StampThump } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { Glass } from '@/components/ui/Glass';
import { ThemedText } from '@/components/ui/ThemedText';
import { HAIRLINE, MIN_TAP, Radii, Spacing } from '@/constants/theme';
import { OnDark, useAppTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/hooks/useSettings';
import { logStore } from '@/lib/log/logStore';
import { lapseDays, streakSummary } from '@/lib/log/streak';
import { remindersSupported } from '@/lib/reminders/notifier';
import { turnOnReminders } from '@/lib/reminders/sync';
import { updateSettings } from '@/lib/settings/settingsStore';

/**
 * Decides, once per launch, whether the user has been away long enough for
 * the welcome-back slides, and remembers that they were shown.
 */
export function useWelcomeBack(): { days: number | null; close: () => void } {
  const { welcomedAt, welcomeBackAt } = useSettings();
  const entries = useSyncExternalStore(logStore.subscribe, logStore.getSnapshot, logStore.getSnapshot);
  const [days, setDays] = useState(() => lapseDays({ entries, welcomedAt, welcomeBackAt, now: new Date() }));

  useEffect(() => {
    if (days !== null) updateSettings({ welcomeBackAt: new Date().toISOString() });
  }, [days]);

  return { days, close: () => setDays(null) };
}

const WAYS_IN = [
  { title: 'Search', detail: '5,000+ everyday foods and 32 restaurant menus.' },
  { title: 'Scan', detail: 'Photograph the plate, check the estimate.' },
  { title: 'Describe', detail: 'Type it like a text: “2 eggs and toast”.' },
] as const;

interface WelcomeBackProps {
  days: number;
  onClose: () => void;
}

/** Three short slides for someone returning after a few days: no guilt, the quickest ways to log, and a push to start again. Skippable from every slide. */
export function WelcomeBack(props: WelcomeBackProps) {
  return (
    <OnDark>
      <Slides {...props} />
    </OnDark>
  );
}

function Slides({ days, onClose }: WelcomeBackProps) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { reminders } = useSettings();
  const entries = useSyncExternalStore(logStore.subscribe, logStore.getSnapshot, logStore.getSnapshot);
  const [best] = useState(() => streakSummary(entries, new Date()).best);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const pager = useRef<ScrollView>(null);
  const last = page === 2;
  const canRemind = remindersSupported && !reminders.enabled;

  const go = (next: number) => {
    pager.current?.scrollTo({ x: next * width, animated: true });
    setPage(next);
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width > 0) setPage(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const logNow = () => {
    onClose();
    router.push('/food/search');
  };

  return (
    <InkReveal style={[StyleSheet.absoluteFill, { backgroundColor: colors.hero }]}>
      <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <AnimatedBackground page="welcome" fit="cover" opacity={0.55} stillOnly />
      <LinearGradient pointerEvents="none" colors={[colors.photoPlate, colors.photoPlate, colors.hero]} locations={[0, 0.5, 0.95]} style={StyleSheet.absoluteFill} />
      <View style={[styles.top, { paddingTop: insets.top + Spacing.md }]}>
        {/* Progress as a row of stamps: each slide reached gets inked, and the current one lands with a thump. */}
        <View style={styles.dots} accessible accessibilityLabel={`Slide ${page + 1} of 3`}>
          {[0, 1, 2].map((index) => (
            <StampThump key={index} play={index === page ? page + 1 : false} tilt={0}>
              <View style={[styles.dot, { borderColor: index <= page ? colors.accent : colors.onHeroMuted, backgroundColor: index <= page ? colors.accent : 'transparent' }]} />
            </StampThump>
          ))}
        </View>
        <PressScale onPress={onClose} haptic="select" accessibilityRole="button" accessibilityLabel="Skip" style={styles.skip}>
          <ThemedText variant="subheadEmphasized" color="secondary">
            skip
          </ThemedText>
        </PressScale>
      </View>

      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        <View style={[styles.slide, { width }]}>
          <ThemedText variant="overline" color="tertiary">
            WELCOME BACK
          </ThemedText>
          <CountUp value={days} variant="display" style={styles.count} />
          <ThemedText variant="title1">days off the log</ThemedText>
          <ThemedText variant="body" color="secondary" style={styles.body}>
            No lecture. The days you missed don’t undo the ones you logged, and today counts the same as any other.
            {best > 1 ? ` Your best run so far is ${best} days.` : ''}
          </ThemedText>
        </View>

        <View style={[styles.slide, { width }]}>
          <ThemedText variant="overline" color="tertiary">
            THE QUICKEST WAYS IN
          </ThemedText>
          <ThemedText variant="title1">a meal in under ten seconds</ThemedText>
          <View style={styles.ways}>
            {WAYS_IN.map((way, index) => (
              <Glass key={way.title} radius={Radii.lg} style={styles.way}>
                <ThemedText variant="overline" color="tertiary" style={styles.wayNumber}>
                  0{index + 1}
                </ThemedText>
                <View style={styles.wayText}>
                  <ThemedText variant="headline">{way.title}</ThemedText>
                  <ThemedText variant="footnote" color="secondary">
                    {way.detail}
                  </ThemedText>
                </View>
              </Glass>
            ))}
          </View>
        </View>

        <View style={[styles.slide, { width }]}>
          <ThemedText variant="overline" color="tertiary">
            TODAY
          </ThemedText>
          <ThemedText variant="title1">start a new streak</ThemedText>
          <ThemedText variant="body" color="secondary" style={styles.body}>
            One entry today puts you back on day one. Log the last thing you ate and build from there.
            {canRemind ? ' Want a nudge so it sticks? Turn on reminders.' : ''}
          </ThemedText>
        </View>
      </ScrollView>
      <SlashWipe trigger={page} />

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Button label={last ? 'Log something now' : 'Next'} onPress={last ? logNow : () => go(page + 1)} />
        {last && canRemind ? (
          <Button
            label="Turn on reminders"
            variant="secondary"
            onPress={() => {
              void turnOnReminders();
              onClose();
            }}
          />
        ) : null}
      </View>
      </View>
    </InkReveal>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl },
  dots: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 12, height: 12, borderRadius: Radii.full, borderWidth: HAIRLINE },
  skip: { minWidth: MIN_TAP, minHeight: MIN_TAP, alignItems: 'flex-end', justifyContent: 'center' },
  pager: { flex: 1 },
  slide: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  count: { fontSize: 120, lineHeight: 124, letterSpacing: -5, fontVariant: ['tabular-nums'], marginBottom: -Spacing.sm },
  body: { marginTop: Spacing.xs },
  ways: { gap: Spacing.sm, marginTop: Spacing.md },
  way: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, padding: Spacing.lg },
  wayNumber: { fontVariant: ['tabular-nums'] },
  wayText: { flex: 1, gap: 2 },
  footer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.sm },
});
