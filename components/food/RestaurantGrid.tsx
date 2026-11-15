import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ChainLogo } from '@/components/food/ChainLogo';
import { PressScale, Stagger } from '@/components/motion';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { FEATURED_CHAINS, shortChainName } from '@/lib/food/chainLogos';

interface RestaurantGridProps {
  onSelect: (chain: string) => void;
}

/** Four logos a row: what you see on Add Food before typing anything. Tap one to browse its menu. */
export function RestaurantGrid({ onSelect }: RestaurantGridProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.grid} accessibilityRole="list">
      {FEATURED_CHAINS.map((chain, index) => (
        <Stagger key={chain} index={index} style={styles.cell}>
          <PressScale onPress={() => onSelect(chain)} haptic="select" accessibilityRole="button" accessibilityLabel={`${chain} menu`} style={styles.press}>
            <ChainLogo chain={chain} size={64} radius={Radii.lg} />
            <ThemedText variant="caption1" color="secondary" numberOfLines={1} style={styles.label}>
              {shortChainName(chain).toLowerCase()}
            </ThemedText>
          </PressScale>
        </Stagger>
      ))}
      <ThemedText variant="caption1" color="tertiary" style={[styles.foot, { color: colors.textTertiary }]}>
        or search anything above: everyday foods, brands, barcodes.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, rowGap: Spacing.lg },
  cell: { width: '25%' },
  press: { alignItems: 'center', gap: Spacing.xs },
  label: { textAlign: 'center', paddingHorizontal: 2 },
  foot: { width: '100%', textAlign: 'center', paddingHorizontal: Spacing.lg, marginTop: Spacing.sm },
});
