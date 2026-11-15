import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { InkReveal, PressScale } from '@/components/motion';
import { Glass } from '@/components/ui/Glass';
import { Stamp } from '@/components/ui/Stamp';
import { ThemedText } from '@/components/ui/ThemedText';
import { REPOSITORY_URL } from '@/constants/brand';
import { MIN_TAP, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { postmarkDate } from '@/lib/easterEggs/eggs';

/** A row of rooftops with one tall tower and a small figure on top: a skyline, not any building's likeness. */
const SKYLINE = 'M0 30 V22 H6 V17 H11 V22 H15 V12 H21 V20 H25 V15 H30 V8 H33 V4 H34.5 V1 H35.5 V4 H37 V8 H40 V16 H45 V10 H51 V19 H55 V14 H61 V21 H66 V17 H71 V24 H76 V30 Z';

/** What a search for a Philadelphia classic turns up, the first time: a postmark and a strip of skyline. Decoration only. */
export function PhillyStamp({ date }: { date: Date }) {
  const { colors } = useAppTheme();
  return (
    <InkReveal style={styles.row}>
      <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Stamp label="philly" caption={postmarkDate(date)} size={78} accent thump haptic />
        <View style={styles.words}>
          <Svg width={114} height={45} viewBox="0 0 76 30">
            <Path d={SKYLINE} fill={colors.inkFaint} />
          </Svg>
          <ThemedText variant="tagline" color="secondary">
            a philadelphia classic. made here too.
          </ThemedText>
        </View>
      </View>
    </InkReveal>
  );
}

/** What searching for "theo" turns up: who built this, and where the code is. */
export function DevCredit() {
  const { colors } = useAppTheme();
  return (
    <InkReveal>
      <Glass radius={Radii.xl} lit style={styles.card}>
        <View style={styles.words}>
          <ThemedText variant="blackletter" style={styles.credit}>
            built by theo · philly
          </ThemedText>
          <ThemedText variant="footnote" color="secondary">
            Free, open source, and made between classes.
          </ThemedText>
        </View>
        <PressScale onPress={() => void WebBrowser.openBrowserAsync(REPOSITORY_URL)} haptic="select" accessibilityRole="link" accessibilityLabel="Open the JustTrack repository on GitHub" style={[styles.link, { borderColor: colors.borderAccent }]}>
          <ThemedText variant="subheadEmphasized" style={{ color: colors.accentText }}>
            the code
          </ThemedText>
        </PressScale>
      </Glass>
    </InkReveal>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  words: { flex: 1, gap: Spacing.xs },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  credit: { fontSize: 22, lineHeight: 28 },
  link: { minHeight: MIN_TAP, paddingHorizontal: Spacing.lg, borderRadius: Radii.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
