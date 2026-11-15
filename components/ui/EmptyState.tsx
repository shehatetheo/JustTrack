import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Crescent, ReceiptScrap } from '@/components/decor';
import { InkReveal } from '@/components/motion';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Button } from './Button';
import { ThemedText } from './ThemedText';

interface EmptyStateProps {
  /** A word or two in blackletter: the one place it is used for meaning, so keep it short. */
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Nothing here yet: a lone receipt scrap under the moon, a line in blackletter, and what to do about it. */
export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <InkReveal style={styles.container}>
      <View style={styles.art}>
        <View style={styles.moon}>
          <Crescent size={34} color={colors.accent} />
        </View>
        <ReceiptScrap width={72} height={92} opacity={0.9} />
      </View>
      <ThemedText variant="blackletter" style={styles.center} accessibilityRole="header">
        {title}
      </ThemedText>
      <ThemedText variant="subhead" color="secondary" style={styles.center}>
        {message}
      </ThemedText>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} size="md" fullWidth={false} />
        </View>
      ) : null}
    </InkReveal>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: Spacing['3xl'], paddingHorizontal: Spacing['2xl'], gap: Spacing.sm },
  art: { width: 130, height: 104, alignItems: 'center', justifyContent: 'flex-end', marginBottom: Spacing.sm },
  moon: { position: 'absolute', top: 0, right: 6 },
  center: { textAlign: 'center' },
  action: { marginTop: Spacing.md },
});
