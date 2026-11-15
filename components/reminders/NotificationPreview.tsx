import React from 'react';
import { StyleSheet, View } from 'react-native';

import { InkReveal } from '@/components/motion';
import { Glass } from '@/components/ui/Glass';
import { Logo } from '@/components/ui/Logo';
import { ThemedText } from '@/components/ui/ThemedText';
import { APP_NAME } from '@/constants/brand';
import { Fonts } from '@/constants/fonts';
import { HAIRLINE, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

interface NotificationPreviewProps {
  title: string;
  body: string;
}

/** A reminder drawn the way it lands on the lock screen. Each new message is revealed afresh. */
export function NotificationPreview({ title, body }: NotificationPreviewProps) {
  const { colors } = useAppTheme();

  return (
    <InkReveal key={`${title}${body}`}>
      <Glass radius={Radii.xl} raised style={styles.card} accessible accessibilityLabel={`Sample reminder. ${title}. ${body}`}>
        <View style={[styles.icon, { backgroundColor: colors.hero, borderColor: colors.border }]}>
          <Logo width={30} color={colors.onHero} />
        </View>
        <View style={styles.text}>
          <View style={styles.meta}>
            <ThemedText variant="caption2" color="tertiary" style={styles.app}>
              {APP_NAME}
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
      </Glass>
    </InkReveal>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: Spacing.md },
  icon: { width: 38, height: 38, borderRadius: Radii.lg, borderWidth: HAIRLINE, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  // The app's name is always set in the wordmark face, even this small.
  app: { fontFamily: Fonts.wordmark, letterSpacing: 0 },
});
