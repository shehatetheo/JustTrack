import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { chainLogo, shortChainName } from '@/lib/food/chainLogos';

interface ChainLogoProps {
  chain: string;
  size?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** A chain's logo on a white tile; a tinted monogram when we don't have the logo. */
export function ChainLogo({ chain, size = 44, radius = 12, style }: ChainLogoProps) {
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
    <View style={[box, styles.mono, { backgroundColor: monogramColor(chain) }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <ThemedText variant={size >= 56 ? 'title3' : 'subheadEmphasized'} style={{ color: '#FFFFFF' }}>
        {initials}
      </ThemedText>
    </View>
  );
}

/** A steady, varied tile color per chain: the same chain always gets the same one. */
const MONOGRAM_COLORS = ['#6B4EF2', '#E8603C', '#2BA384', '#D9873B', '#3C7BE0', '#C94C7A', '#7A5AD6', '#1F9BB5', '#B8862F', '#4F8F3A'];

function monogramColor(chain: string): string {
  let hash = 0;
  for (const char of chain) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return MONOGRAM_COLORS[hash % MONOGRAM_COLORS.length];
}

const styles = StyleSheet.create({
  tile: { backgroundColor: '#FFFFFF', overflow: 'hidden' },
  mono: { alignItems: 'center', justifyContent: 'center' },
});
