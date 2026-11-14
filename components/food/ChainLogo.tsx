import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/contexts/ThemeContext';
import { chainLogo, shortChainName } from '@/lib/food/chainLogos';

interface ChainLogoProps {
  chain: string;
  size?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** A chain's logo on a white tile; without one, its initials on a glass tile, the same for every chain. */
export function ChainLogo({ chain, size = 44, radius = 12, style }: ChainLogoProps) {
  const { colors } = useAppTheme();
  const source = chainLogo(chain);
  const box = { width: size, height: size, borderRadius: radius };
  if (source) {
    return (
      <View style={[box, styles.tile, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Image source={source} style={{ width: size, height: size }} contentFit="cover" transition={120} accessibilityIgnoresInvertColors />
      </View>
    );
  }
  const initials = shortChainName(chain)
    .split(/[\s-]+/)
    .map((word) => word.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View style={[box, styles.mono, { backgroundColor: colors.surfaceTintStrong, borderColor: colors.border }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <ThemedText variant={size >= 56 ? 'title3' : 'subheadEmphasized'} style={styles.initials}>
        {initials}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { backgroundColor: '#FFFFFF', overflow: 'hidden' },
  mono: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth * 2 },
  initials: { fontWeight: '800', letterSpacing: 0.4 },
});
