import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { GradientHeader } from '@/components/layout/GradientHeader';
import { ListRow, ListSection } from '@/components/ui/ListRow';
import { ThemedText } from '@/components/ui/ThemedText';
import { APP_NAME, HOMETOWN_LINE, PRIVACY_LINE, REPOSITORY_URL, TAGLINE } from '@/constants/brand';
import { Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/hooks/useSettings';
import { clearRecentSearches } from '@/lib/food/recentSearches';
import { clearLog, logStore } from '@/lib/log/logStore';
import { DEFAULT_SETTINGS, settingsStore, updateSettings } from '@/lib/settings/settingsStore';
import type { HeightUnit, ThemePreference, WeightUnit } from '@/types';
import { confirmAsync, showOptionSheet } from '@/utils/actionSheet';
import { formatNumber } from '@/utils/format';
import { HEIGHT_UNIT_LABELS, WEIGHT_UNIT_LABELS } from '@/utils/units';

const APPEARANCE_OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
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
  const { colors, shadows, preference, setPreference } = useAppTheme();
  const settings = useSettings();
  const [name, setName] = useState(settings.displayName ?? '');
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const initial = (settings.displayName ?? '').trim().charAt(0).toUpperCase() || 'JT';

  const saveName = () => updateSettings({ displayName: name.trim() || null });

  const confirmClear = async () => {
    const count = logStore.getSnapshot().length;
    if (count === 0) {
      Alert.alert('Nothing to clear', 'Your log is already empty.');
      return;
    }
    const confirmed = await confirmAsync({ title: 'Clear your log?', message: `This removes all ${count} ${count === 1 ? 'entry' : 'entries'} from this device. It can’t be undone.`, confirmLabel: 'Clear' });
    if (confirmed) clearLog();
  };

  /** Everything the app has stored on this device: the log, recent searches, name and goals. Lands back on the welcome screen. */
  const confirmErase = async () => {
    const confirmed = await confirmAsync({ title: 'Erase all data?', message: 'This deletes your food log, recent searches, name and goals from this device and starts the app over. It can’t be undone.', confirmLabel: 'Erase everything' });
    if (!confirmed) return;
    clearLog();
    clearRecentSearches();
    settingsStore.set({ ...DEFAULT_SETTINGS, welcomed: false });
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <GradientHeader fadeEnd={0.9}>
        <ThemedText variant="headline" style={[styles.title, { color: colors.onGradient }]} accessibilityRole="header">
          Profile
        </ThemedText>
        <View style={[styles.hero, shadows.sm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <ThemedText variant="title1" style={{ color: '#FFFFFF' }}>
              {initial}
            </ThemedText>
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            onBlur={saveName}
            onSubmitEditing={saveName}
            placeholder="Your name"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="done"
            maxLength={40}
            accessibilityLabel="Your name"
            style={[Typography.title2, styles.nameInput, { color: colors.text }]}
          />
          <ThemedText variant="footnote" color="secondary" style={styles.hometown}>
            {HOMETOWN_LINE}
          </ThemedText>
        </View>
      </GradientHeader>

      <View style={styles.body}>
        <ListSection title="Goals">
          <ListRow icon="target" iconBackground={colors.accent} title="Daily calorie goal" value={`${formatNumber(settings.calorieGoal)} kcal`} onPress={() => router.push('/settings/goal')} />
          <ListRow icon="flame" iconBackground={colors.carbs} title="Macro targets" value={settings.macroGoals ? 'Set' : 'Off'} onPress={() => router.push('/settings/goal')} isLast />
        </ListSection>

        <ListSection title="Preferences">
          <ListRow
            icon="scale"
            iconBackground={colors.fat}
            title="Weight"
            value={WEIGHT_UNIT_LABELS[settings.weightUnit]}
            onPress={() => showOptionSheet({ title: 'Weight units', options: WEIGHT_OPTIONS, selected: settings.weightUnit, onSelect: (weightUnit) => updateSettings({ weightUnit }) })}
          />
          <ListRow
            icon="ruler"
            iconBackground={colors.fat}
            title="Height"
            value={HEIGHT_UNIT_LABELS[settings.heightUnit]}
            onPress={() => showOptionSheet({ title: 'Height units', options: HEIGHT_OPTIONS, selected: settings.heightUnit, onSelect: (heightUnit) => updateSettings({ heightUnit }) })}
          />
          <ListRow
            icon="appearance"
            iconBackground={colors.protein}
            title="Appearance"
            value={APPEARANCE_OPTIONS.find((option) => option.value === preference)?.label}
            onPress={() => showOptionSheet({ title: 'Appearance', options: APPEARANCE_OPTIONS, selected: preference, onSelect: setPreference })}
            isLast
          />
        </ListSection>

        <ListSection title="Privacy" footer={`${PRIVACY_LINE} Meal photos are sent to the scanner for analysis and are not kept.`}>
          <ListRow icon="shield" iconBackground={colors.success} title="No account, no tracking" showChevron={false} />
          <ListRow icon="privacy" iconBackground={colors.accent} title="Privacy policy" onPress={() => router.push('/privacy')} />
          <ListRow icon="trash" iconBackground={colors.danger} title="Clear my log" onPress={() => void confirmClear()} destructive />
          <ListRow icon="trash" iconBackground={colors.danger} title="Erase all data" onPress={() => void confirmErase()} destructive isLast />
        </ListSection>

        <ListSection title="About" footer={`${APP_NAME} ${version} · ${TAGLINE}`}>
          <ListRow icon="pin" iconBackground={colors.accent} title="Made in Philadelphia" showChevron={false} />
          <ListRow icon="openSource" iconBackground={colors.textSecondary} title="Open source on GitHub" onPress={() => void WebBrowser.openBrowserAsync(REPOSITORY_URL)} />
          <ListRow icon="info" iconBackground={colors.textTertiary} title="Food data: USDA & Open Food Facts" onPress={() => void WebBrowser.openBrowserAsync('https://world.openfoodfacts.org')} />
          <ListRow icon="heart" iconBackground={colors.danger} title="Help & support" onPress={() => router.push('/support')} isLast />
        </ListSection>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing['5xl'] },
  title: { textAlign: 'center' },
  hero: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.xl, marginTop: Spacing.lg, borderRadius: Radii.xl, borderWidth: StyleSheet.hairlineWidth },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  nameInput: { textAlign: 'center', minWidth: 200, paddingVertical: Spacing.xs, borderRadius: Radii.md },
  hometown: { textAlign: 'center' },
  body: { paddingHorizontal: Spacing.lg },
});
