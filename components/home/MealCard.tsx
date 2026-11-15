import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { EntryRow } from '@/components/food/EntryRow';
import { PressScale, TearAway, useMotion } from '@/components/motion';
import { AppIcon } from '@/components/ui/AppIcon';
import { Glass } from '@/components/ui/Glass';
import { Stamp } from '@/components/ui/Stamp';
import { ThemedText } from '@/components/ui/ThemedText';
import { Duration, Easings } from '@/constants/motion';
import { MEAL_TYPE_META } from '@/constants/nutrition';
import { HAIRLINE, MIN_TAP, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useEntryActions } from '@/hooks/useEntryActions';
import { macroShares, type MealSection } from '@/lib/log/entries';
import { formatNumber } from '@/utils/format';

/**
 * A row that has just been logged drops into the card under a wash of
 * lavender that fades as it settles. Rows that were already there when the
 * card appeared simply sit.
 */
function Arrive({ fresh, children }: { fresh: boolean; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  const { reduced } = useMotion();
  const landed = useSharedValue(fresh ? 0 : 1);
  useEffect(() => {
    if (fresh) landed.set(withTiming(1, { duration: reduced ? Duration.micro : Duration.hero, easing: Easings.out }));
    // Lands once, when it mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const row = useAnimatedStyle(() => ({ opacity: Math.min(landed.get() * 2, 1), transform: [{ translateY: reduced ? 0 : (1 - landed.get()) * -14 }] }));
  const wash = useAnimatedStyle(() => ({ opacity: (1 - landed.get()) * 0.3 }));
  return (
    <Animated.View style={row}>
      {children}
      {fresh ? <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.accent }, wash]} /> : null}
    </Animated.View>
  );
}

interface MealCardProps {
  section: MealSection;
  onAdd: () => void;
}

/**
 * One meal: its name, calories and macro split, an "add" pill, and whatever
 * has been logged to it. A meal with food in it carries a LOGGED stamp,
 * which thumps down when something new is added. When a meal has a photo,
 * the photo heads the card.
 */
export function MealCard({ section, onAdd }: MealCardProps) {
  const { colors } = useAppTheme();
  const actions = useEntryActions();
  const meta = MEAL_TYPE_META[section.mealType];
  const count = section.entries.length;
  const hasEntries = count > 0;
  const cover = section.entries.find((entry) => entry.imageUri)?.imageUri ?? null;
  const onCover = Boolean(cover);
  const ink = onCover ? colors.onHero : colors.text;
  const muted = onCover ? colors.onHeroMuted : colors.textSecondary;
  const shares = macroShares(section.totals);
  const split = [
    { label: 'protein', value: shares.protein },
    { label: 'carbs', value: shares.carbs },
    { label: 'fat', value: shares.fat },
  ];

  // The stamp lands again each time the meal gains an entry, but not when the card first appears.
  const [stamp, setStamp] = useState({ count, strikes: 0 });
  // Anything logged after the card appeared is new and gets to arrive.
  const [mountedAt] = useState(() => Date.now());
  const [tearing, setTearing] = useState<string | null>(null);
  if (count !== stamp.count) setStamp({ count, strikes: count > stamp.count ? stamp.strikes + 1 : stamp.strikes });

  return (
    <Glass radius={Radii.xl} lit={hasEntries}>
      <View style={onCover ? styles.cover : null}>
        {cover ? (
          <>
            <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} accessibilityIgnoresInvertColors />
            <LinearGradient colors={['transparent', colors.photoPlate, colors.hero]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
          </>
        ) : null}
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <ThemedText variant="title3" style={{ color: ink }} accessibilityRole="header">
              {meta.label.toLowerCase()}
            </ThemedText>
            <ThemedText variant="footnote" style={[styles.tabular, { color: muted }]}>
              {hasEntries ? `${formatNumber(section.totals.calories)} kcal` : 'nothing yet'}
            </ThemedText>
          </View>
          {hasEntries ? <Stamp label="logged" size={50} thump={stamp.strikes > 0 ? stamp.strikes : false} haptic accent={!onCover} seed={meta.label.length} accessibilityLabel={`${meta.label} logged`} /> : null}
          <PressScale onPress={onAdd} accessibilityRole="button" accessibilityLabel={`Add food to ${meta.label}`} style={[styles.add, { borderColor: onCover ? colors.onHero : colors.accentText, backgroundColor: onCover ? colors.photoPlate : 'transparent' }]}>
            <AppIcon name="plus" size={13} color={onCover ? colors.onHero : colors.accentText} weight="bold" />
            <ThemedText variant="subheadEmphasized" style={{ color: onCover ? colors.onHero : colors.accentText }}>
              add
            </ThemedText>
          </PressScale>
        </View>

        {hasEntries ? (
          <ThemedText variant="caption1" style={[styles.split, styles.tabular, { color: muted }]} accessibilityLabel={split.map((macro) => `${macro.label} ${Math.round(macro.value * 100)} percent`).join(', ')}>
            {split.map((macro) => `${macro.label} ${Math.round(macro.value * 100)}%`).join('  ·  ')}
          </ThemedText>
        ) : null}
      </View>

      {hasEntries ? (
        <View style={{ borderTopWidth: HAIRLINE, borderTopColor: colors.border }}>
          {section.entries.map((entry, index) => (
            <TearAway key={entry.id} tearing={tearing === entry.id} onTorn={() => {
              setTearing(null);
              actions.remove(entry);
            }}>
              <Arrive fresh={Date.parse(entry.loggedAt) > mountedAt}>
                <EntryRow entry={entry} isLast={index === count - 1} onOpen={() => actions.open(entry)} onDuplicate={() => actions.duplicate(entry)} onDelete={() => setTearing(entry.id)} onMore={() => actions.more(entry, () => setTearing(entry.id))} />
              </Arrive>
            </TearAway>
          ))}
        </View>
      ) : null}
    </Glass>
  );
}

const styles = StyleSheet.create({
  cover: { minHeight: 140, justifyContent: 'flex-end', overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, paddingBottom: Spacing.md },
  titleBlock: { flex: 1, gap: Spacing.xxs },
  add: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, minHeight: MIN_TAP - 8, paddingHorizontal: Spacing.md, borderRadius: Radii.full, borderWidth: HAIRLINE },
  split: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  tabular: { fontVariant: ['tabular-nums'] },
});
