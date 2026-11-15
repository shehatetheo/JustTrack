import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Shake } from '@/components/motion';
import { HAIRLINE, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { AppIcon, type AppIconName } from './AppIcon';
import { ThemedText } from './ThemedText';

interface BannerProps {
  /** info is a quiet note. warning and error both mean "this needs you"; the icon and the words say which. */
  tone?: 'info' | 'warning' | 'error';
  icon?: AppIconName;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * An inline notice. Something that needs fixing gives one small shake and
 * is underlined with a pen scribble; it never changes colour to alarm.
 */
export function Banner({ tone = 'info', icon, message, actionLabel, onAction }: BannerProps) {
  const { colors } = useAppTheme();
  const urgent = tone !== 'info';
  const defaultIcon: AppIconName = urgent ? 'wifiOff' : 'info';

  return (
    <Shake trigger={urgent ? message : null}>
      <View style={[styles.banner, { backgroundColor: colors.surface, borderColor: urgent ? colors.borderAccent : colors.border }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <AppIcon name={icon ?? defaultIcon} size={18} color={urgent ? colors.accentText : colors.textSecondary} />
        <View style={styles.body}>
          <ThemedText variant="footnote" color={urgent ? 'primary' : 'secondary'}>
            {message}
          </ThemedText>
          {urgent ? (
            <Svg width={88} height={6} viewBox="0 0 88 6" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Path d="M1 4 C8 0 12 6 20 3 C28 0 32 6 40 3 C48 0 52 6 60 3 C68 0 74 5 87 2" stroke={colors.accent} strokeWidth={1.2} strokeLinecap="round" fill="none" />
            </Svg>
          ) : null}
        </View>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} accessibilityRole="button" hitSlop={12}>
            <ThemedText variant="footnote" style={[styles.action, { color: colors.accentText }]}>
              {actionLabel.toLowerCase()}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </Shake>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radii.lg, borderWidth: HAIRLINE },
  body: { flex: 1, gap: Spacing.xs },
  action: { fontWeight: '600' },
});
