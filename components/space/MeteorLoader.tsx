import React from 'react';
import { StyleSheet, View } from 'react-native';

import { MeteorShower } from '@/components/space/MeteorShower';
import { Starfield } from '@/components/space/Starfield';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

/** The wait indicator for anything that takes a few seconds: a window onto the meteor shower, with a line saying what's happening. */
export function MeteorLoader({ message }: { message: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityLabel={message}>
      <View style={[styles.window, { borderColor: colors.border }]}>
        <Starfield count={34} seed={23} twinkle={4} />
        <MeteorShower count={4} seed={31} calm={0.8} />
      </View>
      <ThemedText variant="subhead" color="secondary" style={styles.message}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', gap: Spacing.md },
  window: { height: 132, borderRadius: Radii.xl, borderWidth: StyleSheet.hairlineWidth * 2, backgroundColor: '#000000', overflow: 'hidden' },
  message: { textAlign: 'center' },
});
