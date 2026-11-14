import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Logo } from '@/components/ui/Logo';
import { ThemedText } from '@/components/ui/ThemedText';
import { APP_NAME } from '@/constants/brand';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

interface NotificationPreviewProps {
  title: string;
  body: string;
}

/** A reminder drawn the way it lands on the lock screen. Each new message drops in from above. */
export function NotificationPreview({ title, body }: NotificationPreviewProps) {
  const { colors, shadows } = useAppTheme();

  return (
    <Animated.View
      key={`${title}${body}`}
      entering={FadeInDown.duration(240)}
      style={[styles.card, shadows.sm, { backgroundColor: colors.surface, borderColor: colors.border }]}
      accessible
      accessibilityLabel={`Sample reminder. ${title}. ${body}`}
    >
      <View style={[styles.icon, { backgroundColor: colors.accent }]}>
        <Logo width={22} color="#FFFFFF" />
      </View>
      <View style={styles.text}>
        <View style={styles.meta}>
          <ThemedText variant="caption2" color="tertiary" style={styles.app}>
            {APP_NAME.toUpperCase()}
          </ThemedText>
          <ThemedText variant="caption2" color="tertiary">
            now
          </ThemedText>
        </View>
        <ThemedText variant="subheadEmphasized">{title}</ThemedText>
        <ThemedText variant="subhead" color="secondary">
          {body}
        </ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: Spacing.md, borderRadius: Radii.xl, borderWidth: StyleSheet.hairlineWidth },
  icon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  app: { letterSpacing: 0.4 },
});
