import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SheetFrame } from '@/components/layout/SheetFrame';
import { SheetHeader } from '@/components/layout/SheetHeader';
import { Stagger } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Glass } from '@/components/ui/Glass';
import { StepperButton, StepperTick } from '@/components/ui/Stepper';
import { TextField } from '@/components/ui/TextField';
import { ThemedText } from '@/components/ui/ThemedText';
import { Toggle } from '@/components/ui/Toggle';
import { Haptic } from '@/constants/motion';
import { HAIRLINE, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useSettings } from '@/hooks/useSettings';
import { FAST_GROUPS, type FastGroup } from '@/lib/fast/groups';
import { clampFastDays, DEFAULT_FAST_AVOID, DEFAULT_FAST_DAYS, DEFAULT_NO_SNACK_MEAL, fastDates, fastIsEmpty, fastRuleText, MAX_FAST_DAYS, MIN_FAST_DAYS, newFastPlan, wordsFromText } from '@/lib/fast/plan';
import { updateSettings } from '@/lib/settings/settingsStore';
import { confirmAsync } from '@/utils/actionSheet';
import { addDays, parseDateKey } from '@/utils/date';

const LENGTHS = [7, 14, 20, 30, 40] as const;
type StartChoice = 'keep' | 'today' | 'tomorrow';

const longDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/**
 * Set up a fast, or change the one that is running: how many days, when it
 * starts, and what is being set aside. It only ever names foods to leave
 * out; the calorie goal is not part of it.
 */
export default function FastScreen() {
  return (
    <SheetFrame>
      <Fast />
    </SheetFrame>
  );
}

function Fast() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { fast: saved } = useSettings();
  const { today } = useCurrentTime();

  const [days, setDays] = useState(saved?.days ?? DEFAULT_FAST_DAYS);
  const [avoid, setAvoid] = useState<FastGroup[]>(saved?.avoid ?? [...DEFAULT_FAST_AVOID]);
  const [noSnackMeal, setNoSnackMeal] = useState(saved?.noSnackMeal ?? DEFAULT_NO_SNACK_MEAL);
  const [extra, setExtra] = useState(saved?.customWords.join(', ') ?? '');
  const [startChoice, setStartChoice] = useState<StartChoice>(saved ? 'keep' : 'today');

  const customWords = wordsFromText(extra);
  const start = startChoice === 'keep' && saved ? (parseDateKey(saved.startedOn) ?? today) : startChoice === 'tomorrow' ? addDays(today, 1) : today;
  const draft = newFastPlan(start, days, avoid, customWords, noSnackMeal);
  const { end } = fastDates(draft);
  const nothing = fastIsEmpty(draft);

  const toggle = (group: FastGroup) => setAvoid((current) => (current.includes(group) ? current.filter((item) => item !== group) : [...current, group]));
  const step = (delta: number) => setDays((current) => clampFastDays(current + delta));

  const save = () => {
    if (nothing) return;
    updateSettings({ fast: draft });
    Haptic.success();
    router.back();
  };

  const endFast = async () => {
    const confirmed = await confirmAsync({ title: 'End the fast?', message: 'The count stops and foods are no longer pointed out. Your log is untouched.', confirmLabel: 'End it' });
    if (!confirmed) return;
    updateSettings({ fast: null });
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SheetHeader title="Fast" tagline="what you set aside, and for how long" onClose={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Stagger index={0}>
          <Card lit style={styles.card}>
            <ThemedText variant="title3">how long</ThemedText>
            <View style={styles.lengthRow}>
              <StepperButton direction="less" accessibilityLabel="One day fewer" onPress={() => step(-1)} disabled={days <= MIN_FAST_DAYS} />
              <StepperTick value={days}>
                <View style={styles.length} accessible accessibilityLabel={`${days} days`}>
                  <ThemedText variant="figure" style={styles.tabular}>
                    {days}
                  </ThemedText>
                  <ThemedText variant="overline" color="secondary">
                    {days === 1 ? 'DAY' : 'DAYS'}
                  </ThemedText>
                </View>
              </StepperTick>
              <StepperButton direction="more" accessibilityLabel="One day more" onPress={() => step(1)} disabled={days >= MAX_FAST_DAYS} />
            </View>
            <View style={styles.wrap} accessibilityRole="radiogroup">
              {LENGTHS.map((length) => (
                <Chip key={length} label={`${length}`} selected={days === length} checked={days === length} accessibilityRole="radio" accessibilityLabel={`${length} days`} onPress={() => setDays(length)} />
              ))}
            </View>
          </Card>
        </Stagger>

        <Stagger index={1}>
          <Card style={styles.card}>
            <ThemedText variant="title3">starting</ThemedText>
            <View style={styles.wrap} accessibilityRole="radiogroup">
              {saved ? <Chip label={`as it is · ${longDate(parseDateKey(saved.startedOn) ?? today).toLowerCase()}`} selected={startChoice === 'keep'} checked={startChoice === 'keep'} accessibilityRole="radio" onPress={() => setStartChoice('keep')} /> : null}
              <Chip label="today" selected={startChoice === 'today'} checked={startChoice === 'today'} accessibilityRole="radio" onPress={() => setStartChoice('today')} />
              <Chip label="tomorrow" selected={startChoice === 'tomorrow'} checked={startChoice === 'tomorrow'} accessibilityRole="radio" onPress={() => setStartChoice('tomorrow')} />
            </View>
          </Card>
        </Stagger>

        <Stagger index={2}>
          <Card style={styles.card}>
            <ThemedText variant="title3">setting aside</ThemedText>
            <View style={styles.wrap}>
              {FAST_GROUPS.map((group) => (
                <Chip key={group.id} stacked label={group.label.toLowerCase()} detail={group.detail} selected={avoid.includes(group.id)} checked={avoid.includes(group.id)} accessibilityRole="checkbox" onPress={() => toggle(group.id)} />
              ))}
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <ThemedText variant="bodyEmphasized">nothing between meals</ThemedText>
                <ThemedText variant="footnote" color="secondary">
                  Anything logged under Snacks counts as off the fast, whatever it is. Breakfast, lunch and dinner are untouched.
                </ThemedText>
              </View>
              <Toggle value={noSnackMeal} onValueChange={setNoSnackMeal} accessibilityLabel="Nothing between meals" />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TextField label="Anything else" value={extra} onChangeText={setExtra} placeholder="fast food, fried food" placeholderTextColor={colors.textTertiary} autoCapitalize="none" autoCorrect={false} returnKeyType="done" maxLength={160} />
            <ThemedText variant="footnote" color="secondary">
              Your own words, with commas between them. A food is pointed out when its name has one of them in it.
            </ThemedText>
          </Card>
        </Stagger>

        <Stagger index={3}>
          <Glass radius={Radii.xl} style={styles.note}>
            <ThemedText variant="overline" color="tertiary">
              HOW IT WORKS
            </ThemedText>
            <ThemedText variant="footnote" color="secondary">
              A fast here is about what you eat, not how little. Your calorie goal stays where it is. While the fast runs, foods that look like something you set aside carry a small label, and each day you log without one fills a plate on Home. Nothing is ever blocked, and a day off the fast is just a day.
            </ThemedText>
          </Glass>
        </Stagger>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + Spacing.md }]}>
        <ThemedText variant="tagline" color="secondary" style={styles.center} accessibilityLiveRegion="polite">
          {nothing ? 'choose something to set aside' : `${draft.days} ${draft.days === 1 ? 'day' : 'days'}, ${fastRuleText(draft)} · ${longDate(start).toLowerCase()} to ${longDate(end).toLowerCase()}`}
        </ThemedText>
        <Button label={saved ? 'Save changes' : 'Begin the fast'} onPress={save} disabled={nothing} haptic={null} />
        {saved ? <Button label="End the fast" variant="quiet" size="md" onPress={() => void endFast()} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing['3xl'] },
  card: { gap: Spacing.md },
  lengthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl },
  length: { alignItems: 'center', minWidth: 96 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  divider: { height: HAIRLINE },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  toggleText: { flex: 1, gap: 2 },
  note: { padding: Spacing.lg, gap: Spacing.sm },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm, borderTopWidth: HAIRLINE },
  center: { textAlign: 'center' },
  tabular: { fontVariant: ['tabular-nums'] },
});
