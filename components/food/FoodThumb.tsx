import { Image } from 'expo-image';
import type { ImageStyle } from 'expo-image';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ChainLogo } from '@/components/food/ChainLogo';
import { FoodGlyph, foodKindFor } from '@/components/food/FoodGlyph';
import { HAIRLINE, Radii } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { chainLogo } from '@/lib/food/chainLogos';

interface FoodThumbProps {
  name: string;
  /** Category, brand… anything that helps pick the drawing. */
  hints?: (string | null | undefined)[];
  /** A product photo or the user's own meal photo; wins over the drawing. */
  imageUri?: string | null;
  size?: number;
  radius?: number;
  style?: StyleProp<ViewStyle & ImageStyle>;
}

/** A food's picture: its photo when there is one, otherwise an ink drawing of its kind on a dark tile. */
export function FoodThumb({ name, hints = [], imageUri, size = 44, radius = Radii.md, style }: FoodThumbProps) {
  const { colors } = useAppTheme();
  const box = { width: size, height: size, borderRadius: radius };
  if (imageUri) {
    return <Image source={{ uri: imageUri }} style={[box, { backgroundColor: colors.surfaceRaised }, style]} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />;
  }
  // A chain's item wears the chain's tile, so a Chipotle bowl is recognisable at a glance.
  const chain = hints.find((hint): hint is string => typeof hint === 'string' && chainLogo(hint) !== null);
  if (chain) return <ChainLogo chain={chain} size={size} radius={radius} style={style} />;
  return (
    <View style={[box, styles.tile, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <FoodGlyph kind={foodKindFor(name, ...hints)} size={Math.round(size * 0.56)} color={colors.accentText} />
    </View>
  );
}

/** Lets a list of thumbs look like a stack of photos, e.g. on a meal card. */
export function FoodThumbStack({ items, size = 32 }: { items: { name: string; imageUri?: string | null; hints?: (string | null | undefined)[] }[]; size?: number }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.stack}>
      {items.slice(0, 3).map((item, index) => (
        <FoodThumb key={`${item.name}-${index}`} {...item} size={size} radius={size / 2} style={[styles.stacked, { borderColor: colors.surface }, index > 0 && { marginLeft: -size * 0.3 }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', borderWidth: HAIRLINE },
  stack: { flexDirection: 'row', alignItems: 'center' },
  stacked: { borderWidth: 2 },
});
