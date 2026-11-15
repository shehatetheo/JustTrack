import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GridPatch, Halftone, Scribble } from '@/components/decor';
import { FoodGlyph, foodKindFor } from '@/components/food/FoodGlyph';
import { CloseButton } from '@/components/ui/CloseButton';
import { ThemedText } from '@/components/ui/ThemedText';
import { HAIRLINE, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useLightStatusBar } from '@/lib/statusBar';

interface FoodHeroProps {
  title: string;
  subtitle?: string | null;
  /** Right-aligned headline, e.g. "150 g". */
  amount?: string | null;
  amountCaption?: string | null;
  /** A photo to show instead of the drawing: a product shot, or the user's own meal photo. */
  imageUri?: string | null;
  /** Used to choose the drawing when there's no photo. */
  tintHints?: (string | null | undefined)[];
  badge?: string | null;
  onBack?: () => void;
  /** A sheet closes with an X; a pushed screen goes back with a chevron. */
  backIcon?: 'close' | 'back';
  /** A second button on the right that leaves the whole sheet, for a pushed screen. */
  onClose?: () => void;
}

const HEIGHT = 300;

/**
 * The top of a food screen: a dark plate in both themes. A real photo stays
 * in colour; without one the food is drawn in white ink over a patch of
 * grid and halftone. The name and the amount sit along the foot.
 */
export function FoodHero({ title, subtitle, amount, amountCaption, imageUri, tintHints = [], badge, onBack, backIcon = 'close', onClose }: FoodHeroProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  useLightStatusBar();

  return (
    <View style={[styles.hero, { backgroundColor: colors.hero }]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} accessibilityIgnoresInvertColors />
      ) : (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.grid}>
            <GridPatch width={220} height={170} color={colors.onHero} opacity={0.12} />
          </View>
          <View style={styles.halftone}>
            <Halftone width={150} height={120} color={colors.accent} opacity={0.5} />
          </View>
          <View style={styles.scribble}>
            <Scribble width={200} height={90} color={colors.accent} opacity={0.55} seed={title.length + 3} />
          </View>
          <View style={styles.glyph}>
            <FoodGlyph kind={foodKindFor(title, ...tintHints)} size={150} color={colors.onHero} />
          </View>
        </View>
      )}
      <LinearGradient colors={[colors.photoPlate, 'transparent', colors.photoPlate, colors.hero]} locations={[0, 0.3, 0.72, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />

      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.md }]}>
        {onBack ? <CloseButton onPress={onBack} onPhoto back={backIcon === 'back'} /> : <View style={styles.spacer} />}
        {badge ? (
          <View style={[styles.badge, { borderColor: colors.onHero, backgroundColor: colors.photoPlate }]}>
            <ThemedText variant="caption2" style={[styles.badgeText, { color: colors.onHero }]}>
              {badge}
            </ThemedText>
          </View>
        ) : null}
        {onClose ? <CloseButton onPress={onClose} onPhoto /> : <View style={styles.spacer} />}
      </View>

      <View style={styles.titles}>
        <View style={styles.titleBlock}>
          <ThemedText variant="title2" style={{ color: colors.onHero }} numberOfLines={3} accessibilityRole="header">
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText variant="tagline" style={{ color: colors.onHeroMuted }} numberOfLines={1}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
        {amount ? (
          <View style={styles.amountBlock}>
            <ThemedText variant="figureSmall" style={[styles.tabular, { color: colors.onHero }]}>
              {amount}
            </ThemedText>
            {amountCaption ? (
              <ThemedText variant="overline" style={{ color: colors.onHeroMuted }}>
                {amountCaption.toUpperCase()}
              </ThemedText>
            ) : null}
          </View>
        ) : null}
      </View>
      <View style={[styles.rule, { backgroundColor: colors.borderAccent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: HEIGHT, justifyContent: 'space-between', overflow: 'hidden', borderBottomLeftRadius: Radii['2xl'], borderBottomRightRadius: Radii['2xl'] },
  grid: { position: 'absolute', left: -20, top: 40 },
  halftone: { position: 'absolute', right: -10, top: 70 },
  scribble: { position: 'absolute', left: 30, bottom: 70 },
  glyph: { position: 'absolute', right: 26, top: 64 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg },
  spacer: { width: 36, height: 36 },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radii.sm, borderWidth: HAIRLINE },
  badgeText: { letterSpacing: 1.2, fontWeight: '700' },
  titles: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: Spacing.lg, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  titleBlock: { flex: 1, gap: Spacing.xxs },
  amountBlock: { alignItems: 'flex-end', gap: Spacing.xxs },
  tabular: { fontVariant: ['tabular-nums'] },
  rule: { position: 'absolute', left: Spacing.xl, right: Spacing.xl, bottom: 0, height: HAIRLINE },
});
