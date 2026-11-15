import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Hero } from '@/components/layout/Hero';
import { Heading } from '@/components/ui/Heading';
import { ListRow, ListSection } from '@/components/ui/ListRow';
import { Logo } from '@/components/ui/Logo';
import { ThemedText } from '@/components/ui/ThemedText';
import { APP_NAME, HOMETOWN_LINE, PRIVACY_LINE, REPOSITORY_URL, TAGLINE } from '@/constants/brand';
import { Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/hooks/useSettings';
import { clearRecentSearches } from '@/lib/food/recentSearches';
import { clearLog, logStore } from '@/lib/log/logStore';
import { DEFAULT_SETTINGS, settingsStore, updateSettings } from '@/lib/settings/settingsStore';
import { clearWeights } from '@/lib/weight/weightStore';
import type { HeightUnit, ThemePreference, WeightUnit } from '@/types';
import { confirmAsync, showNotice, showOptionSheet } from '@/utils/actionSheet';
import { formatNumber } from '@/utils/format';
import { HEIGHT_UNIT_LABELS, WEIGHT_UNIT_LABELS } from '@/utils/units';

const APPEARANCE_OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Parchment' },
  { value: 'system', label: 'Match phone' },
];
const WEIGHT_OPTIONS: readonly { value: WeightUnit; label: string }[] = [
  { value: 'lb', label: WEIGHT_UNIT_LABELS.lb },
  { value: 'kg', label: WEIGHT_UNIT_LABELS.kg },
];
const HEIGHT_OPTIONS: readonly { value: HeightUnit; label: string }[] = [
  { value: 'ft_in', label: HEIGHT_UNIT_LABELS.ft_in },
  { value: 'cm', label: HEIGHT_UNIT_LABELS.cm },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, preference, setPreference } = useAppTheme();
  const settings = useSettings();
  const [name, setName] = useState(settings.displayName ?? '');
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const { reminders } = settings;
  const reminderSummary = !reminders.enabled ? 'Off' : reminders.mode === 'interval' ? 'Every 1.5 hours' : 'Mealtimes';

  const saveName = () => updateSettings({ displayName: name.trim() || null });

  const confirmClear = async () => {
    const count = logStore.getSnapshot().length;
    if (count === 0) {
      showNotice({ title: 'Nothing to clear', message: 'Your log is already empty.' });
      return;
    }
    const confirmed = await confirmAsync({ title: 'Clear your log?', message: `This removes all ${count} ${count === 1 ? 'entry' : 'entries'} from this device. It can’t be undone.`, confirmLabel: 'Clear' });
    if (confirmed) clearLog();
  };

  /** Everything the app has stored on this device: the log, recent searches, name and goals. Lands back on the welcome screen. */
  const confirmErase = async () => {
    const confirmed = await confirmAsync({ title: 'Erase all data?', message: 'This deletes your food log, weigh-ins, recent searches, name and goals from this device and starts the app over. It can’t be undone.', confirmLabel: 'Erase everything' });
    if (!confirmed) return;
    clearLog();
    clearWeights();
    clearRecentSearches();
    settingsStore.set({ ...DEFAULT_SETTINGS, welcomed: false });
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <Hero page="profile" artOpacity={0.4} veil={0.2}>
        <Heading title="profile" tagline="yours, and only on this phone" level="title" align="center" onHero />
        <View style={styles.hero}>
          <Logo width={84} color={colors.onHero} />
          <TextInput
            value={name}
            onChangeText={setName}
            onBlur={saveName}
            onSubmitEditing={saveName}
            placeholder="your name"
            placeholderTextColor={colors.onHeroMuted}
            selectionColor={colors.accent}
            returnKeyType="done"
            maxLength={40}
            accessibilityLabel="Your name"
            style={[Typography.title2, styles.nameInput, { color: colors.onHero }]}
          />
          <ThemedText variant="footnote" style={[styles.hometown, { color: colors.onHeroMuted }]}>
            {HOMETOWN_LINE}
          </ThemedText>
        </View>
      </Hero>

      <View style={styles.body}>
        <ListSection title="Goals">
          <ListRow icon="target" title="Daily calorie goal" value={`${formatNumber(settings.calorieGoal)} kcal`} onPress={() => router.push('/settings/goal')} />
          <ListRow icon="flame" title="Macro targets" value={settings.macroGoals ? 'Set' : 'Off'} onPress={() => router.push('/settings/goal')} isLast />
        </ListSection>

        <ListSection title="Reminders" footer="A nudge to log your food, with a different joke each time.">
          <ListRow icon="bell" title="Meal reminders" value={reminderSummary} onPress={() => router.push('/settings/reminders')} isLast />
        </ListSection>

        <ListSection title="Preferences">
          <ListRow
            icon="scale"
           
            title="Weight"
            value={WEIGHT_UNIT_LABELS[settings.weightUnit]}
            onPress={() => showOptionSheet({ title: 'Weight units', options: WEIGHT_OPTIONS, selected: settings.weightUnit, onSelect: (weightUnit) => updateSettings({ weightUnit }) })}
          />
          <ListRow
            icon="ruler"
           
            title="Height"
            value={HEIGHT_UNIT_LABELS[settings.heightUnit]}
            onPress={() => showOptionSheet({ title: 'Height units', options: HEIGHT_OPTIONS, selected: settings.heightUnit, onSelect: (heightUnit) => updateSettings({ heightUnit }) })}
          />
          <ListRow
            icon="appearance"
           
            title="Appearance"
            value={APPEARANCE_OPTIONS.find((option) => option.value === preference)?.label}
            onPress={() => showOptionSheet({ title: 'Appearance', options: APPEARANCE_OPTIONS, selected: preference, onSelect: setPreference })}
            isLast
          />
        </ListSection>

        <ListSection title="Privacy" footer={`${PRIVACY_LINE} Meal photos are sent to the scanner for analysis and are not kept.`}>
          <ListRow icon="shield" title="No account, no tracking" showChevron={false} />
          <ListRow icon="privacy" title="Privacy policy" onPress={() => router.push('/privacy')} />
          <ListRow icon="trash" title="Clear my log" onPress={() => void confirmClear()} destructive />
          <ListRow icon="trash" title="Erase all data" onPress={() => void confirmErase()} destructive isLast />
        </ListSection>

        <ListSection title="About" footer={`${APP_NAME} ${version} · ${TAGLINE}`}>
          <ListRow icon="pin" title="Made in Philadelphia" showChevron={false} />
          <ListRow icon="openSource" title="Open source on GitHub" onPress={() => void WebBrowser.openBrowserAsync(REPOSITORY_URL)} />
          <ListRow icon="info" title="Food data: USDA & Open Food Facts" onPress={() => void WebBrowser.openBrowserAsync('https://world.openfoodfacts.org')} />
          <ListRow icon="heart" title="Help & support" onPress={() => router.push('/support')} isLast />
        </ListSection>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing['5xl'] },
  hero: { alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.xl, paddingBottom: Spacing.sm },
  nameInput: { textAlign: 'center', minWidth: 200, paddingVertical: Spacing.xs, outlineStyle: 'solid', outlineWidth: 0 },
  hometown: { textAlign: 'center' },
  body: { paddingHorizontal: Spacing.lg },
});
