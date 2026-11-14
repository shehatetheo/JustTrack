import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseButton } from '@/components/ui/CloseButton';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { foodEmojiFor } from '@/lib/food/foodEmoji';
import { heroTintFor } from '@/lib/food/heroTint';
import { useLightStatusBar } from '@/lib/statusBar';

interface FoodHeroProps {
  title: string;
  subtitle?: string | null;
  /** Right-aligned headline, e.g. "150 g". */
  amount?: string | null;
  amountCaption?: string | null;
  /** A photo to show instead of the tint: a product shot, or the user's own meal photo. */
  imageUri?: string | null;
  /** Used to choose the tint when there's no photo. */
  tintHints?: (string | null | undefined)[];
  badge?: string | null;
  onBack?: () => void;
  /** A modal closes with an X; a pushed screen goes back with a chevron. */
  backIcon?: 'close' | 'back';
}

/**
 * The top of a food screen: a photo (or a category-tinted gradient) with
 * the food's name and amount set over it, like a magazine cover.
 */
export function FoodHero({ title, subtitle, amount, amountCaption, imageUri, tintHints = [], badge, onBack, backIcon = 'close' }: FoodHeroProps) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [tintStart, tintEnd] = heroTintFor(...tintHints, title);
  // Light mode sets dark text over a whitened foot of the photo; dark mode keeps white text over a darkened one.
  useLightStatusBar(isDark);
  const ink = isDark ? '#FFFFFF' : colors.text;
  const inkMuted = isDark ? 'rgba(255,255,255,0.8)' : colors.textSecondary;
  const scrim = isDark ? ['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.82)'] : ['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.0)', 'rgba(255,255,255,0.82)'];

  return (
    <View style={styles.hero}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} accessibilityIgnoresInvertColors />
      ) : (
        <LinearGradient colors={[tintStart, tintEnd]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill}>
          <Text style={styles.emoji} accessible={false}>
            {foodEmojiFor(title, ...tintHints)}
          </Text>
        </LinearGradient>
      )}
      <LinearGradient colors={scrim as [string, string, string]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />

      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        {onBack ? (
          <CloseButton onPress={onBack} onPhoto back={backIcon === 'back'} />
        ) : (
          <View style={styles.backButton} />
        )}
        {badge ? (
          <View style={styles.badge}>
            <ThemedText variant="caption2" style={styles.badgeText}>
              {badge}
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.titles}>
        <View style={styles.titleBlock}>
          <ThemedText variant="title1" style={{ color: ink }} numberOfLines={3} accessibilityRole="header">
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText variant="subhead" style={{ color: inkMuted }} numberOfLines={1}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
        {amount ? (
          <View style={styles.amountBlock}>
            <ThemedText variant="title1" style={[styles.tabular, { color: ink }]}>
              {amount}
            </ThemedText>
            {amountCaption ? (
              <ThemedText variant="footnote" style={{ color: inkMuted }}>
                {amountCaption}
              </ThemedText>
            ) : null}
          </View>
        ) : null}
      </View>
      <View style={[styles.lip, { backgroundColor: colors.background }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 340, justifyContent: 'space-between', overflow: 'hidden' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg },
  backButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  badge: { backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#0A0A0B', letterSpacing: 0.9, fontWeight: '700' },
  titles: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: Spacing.lg, paddingHorizontal: Spacing.lg, paddingBottom: Spacing['3xl'] },
  titleBlock: { flex: 1, gap: 2 },
  amountBlock: { alignItems: 'flex-end' },
  emoji: { position: 'absolute', right: 20, top: 92, fontSize: 132, lineHeight: 150, opacity: 0.95 },
  tabular: { fontVariant: ['tabular-nums'] },
  lip: { position: 'absolute', left: 0, right: 0, bottom: -1, height: 24, borderTopLeftRadius: Radii['2xl'], borderTopRightRadius: Radii['2xl'] },
});
