import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SpaceBackdrop } from '@/components/space/SpaceBackdrop';
import { Button } from '@/components/ui/Button';
import { Glass } from '@/components/ui/Glass';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
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
export function WelcomeBack({ days, onClose }: WelcomeBackProps) {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
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
    Haptics.selectionAsync();
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
    <Animated.View entering={FadeIn.duration(260)} exiting={FadeOut.duration(200)} style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} accessibilityViewIsModal>
      {isDark ? <SpaceBackdrop meteors={3} calm={3} stars={80} nebula={{ x: 0.3, y: 0.3 }} seed={29} /> : null}
      <View style={[styles.top, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.dots} accessible accessibilityLabel={`Slide ${page + 1} of 3`}>
          {[0, 1, 2].map((index) => (
            <View key={index} style={[styles.dot, { backgroundColor: index === page ? colors.text : colors.surfaceTintStrong, width: index === page ? 22 : 8 }]} />
          ))}
        </View>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Skip" hitSlop={12}>
          <ThemedText variant="subheadEmphasized" color="secondary">
            Skip
          </ThemedText>
        </Pressable>
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
          <ThemedText variant="display" style={styles.count}>
            {days}
          </ThemedText>
          <ThemedText variant="title1">days off the log.</ThemedText>
          <ThemedText variant="body" color="secondary" style={styles.body}>
            No lecture. The days you missed don’t undo the ones you logged, and today counts the same as any other.
            {best > 1 ? ` Your best run so far is ${best} days.` : ''}
          </ThemedText>
        </View>

        <View style={[styles.slide, { width }]}>
          <ThemedText variant="overline" color="tertiary">
            THE QUICKEST WAYS IN
          </ThemedText>
          <ThemedText variant="title1">Log a meal in under ten seconds.</ThemedText>
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
          <ThemedText variant="title1">Start a new streak.</ThemedText>
          <ThemedText variant="body" color="secondary" style={styles.body}>
            One entry today puts you back on day one. Log the last thing you ate and build from there.
            {canRemind ? ' Want a nudge so it sticks? Turn on reminders.' : ''}
          </ThemedText>
        </View>
      </ScrollView>

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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 4, borderRadius: 2 },
  pager: { flex: 1 },
  slide: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  count: { fontSize: 132, lineHeight: 132, letterSpacing: -6, fontVariant: ['tabular-nums'], marginBottom: -Spacing.sm },
  body: { marginTop: Spacing.xs },
  ways: { gap: Spacing.sm, marginTop: Spacing.md },
  way: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, padding: Spacing.lg },
  wayNumber: { fontVariant: ['tabular-nums'] },
  wayText: { flex: 1, gap: 2 },
  footer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.sm },
});
