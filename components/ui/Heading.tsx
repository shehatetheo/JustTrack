import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { ThemedText } from './ThemedText';

interface HeadingProps {
  /** Written in lowercase; the display face sets it in small capitals. */
  title: string;
  /** One italic line under it. */
  tagline?: string;
  /** title: a screen's name. section: a block within a screen. */
  level?: 'title' | 'section';
  /** Sits on the hero artwork, so it is white in both themes. */
  onHero?: boolean;
  align?: 'left' | 'center';
  /** Something to the right: a small button, a chip. */
  accessory?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** The one heading pattern: spaced serif small capitals, with an optional italic line beneath. */
export function Heading({ title, tagline, level = 'section', onHero = false, align = 'left', accessory, style }: HeadingProps) {
  const { colors } = useAppTheme();
  // The hero artwork is dark in both themes, so text on it takes the hero inks.
  const heroInk = onHero ? { color: colors.onHero } : null;
  return (
    <View style={[styles.row, style]}>
      <View style={[styles.words, align === 'center' && styles.center]}>
        <ThemedText variant={level === 'title' ? 'title1' : 'title3'} style={[heroInk, align === 'center' && styles.centerText]} accessibilityRole="header">
          {title.toLowerCase()}
        </ThemedText>
        {tagline ? (
          <ThemedText variant="tagline" color="secondary" style={[onHero ? { color: colors.onHeroMuted } : null, align === 'center' && styles.centerText]}>
            {tagline}
          </ThemedText>
        ) : null}
      </View>
      {accessory}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  words: { flex: 1, gap: Spacing.xxs },
  center: { alignItems: 'center' },
  centerText: { textAlign: 'center' },
});
