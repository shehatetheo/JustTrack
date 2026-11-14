import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LiveCamera } from '@/components/scanner/LiveCamera';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useMealScan } from '@/hooks/useMealScan';
import { useLightStatusBar } from '@/lib/statusBar';

const VIOLET = '#8B6CFF';

/** The four corners of the framing guide. */
function Brackets() {
  return (
    <View pointerEvents="none" style={styles.brackets}>
      {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
        <View
          key={corner}
          style={[
            styles.corner,
            corner.startsWith('t') ? { top: 0, borderTopWidth: 3 } : { bottom: 0, borderBottomWidth: 3 },
            corner.endsWith('l') ? { left: 0, borderLeftWidth: 3, borderTopLeftRadius: corner === 'tl' ? 10 : 0, borderBottomLeftRadius: corner === 'bl' ? 10 : 0 } : { right: 0, borderRightWidth: 3, borderTopRightRadius: corner === 'tr' ? 10 : 0, borderBottomRightRadius: corner === 'br' ? 10 : 0 },
          ]}
        />
      ))}
    </View>
  );
}

function RoundButton({ icon, label, onPress, disabled }: { icon: AppIconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      hitSlop={8}
      style={({ pressed }) => [styles.roundButton, { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 }]}
    >
      <AppIcon name={icon} size={22} color="#FFFFFF" weight="semibold" />
    </Pressable>
  );
}

/**
 * The hero feature. On the web this is a live viewfinder: frame the plate,
 * tap the shutter, and the review screen names what's on it. Where the
 * camera can't be used (no camera, access declined, native until the iOS
 * build), the same screen offers the photo picker instead.
 */
export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scan, analyze, busy } = useMealScan();
  const [focused, setFocused] = useState(false);
  const [fallback, setFallback] = useState<'denied' | 'no_camera' | 'unsupported' | null>(null);
  const [ready, setReady] = useState(false);
  const capture = useRef<(() => void) | null>(null);
  useLightStatusBar(!fallback);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );

  const onCapture = useCallback(
    (uri: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      void analyze({ uri });
    },
    [analyze]
  );
  const onUnavailable = useCallback((reason: 'denied' | 'no_camera' | 'unsupported') => setFallback(reason), []);
  const bindCapture = useCallback((fn: (() => void) | null) => {
    capture.current = fn;
    setReady(fn !== null);
  }, []);

  if (fallback) return <ScanFallback reason={fallback} scan={scan} busy={busy} />;

  return (
    <View style={styles.viewfinder}>
      <LiveCamera active={focused && !busy} onCapture={onCapture} onUnavailable={onUnavailable} bindCapture={bindCapture} />
      <LinearGradient colors={['rgba(10,6,24,0.55)', 'rgba(10,6,24,0)']} style={[styles.topShade, { height: insets.top + 72 }]} pointerEvents="none" />
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <RoundButton icon="pencil" label="Describe what you ate" onPress={() => router.push('/scan/describe')} />
        <ThemedText variant="headline" style={styles.onCamera} accessibilityRole="header">
          Scanner
        </ThemedText>
        <RoundButton icon="barcode" label="Scan a barcode" onPress={() => router.push('/scan/barcode')} />
      </View>

      <Brackets />

      <LinearGradient colors={['rgba(10,6,24,0)', 'rgba(10,6,24,0.7)']} style={styles.bottomShade} pointerEvents="none" />
      <View style={styles.bottomBar}>
        <ThemedText variant="footnote" style={styles.hint}>
          {ready ? 'Frame the whole plate, then tap the shutter.' : 'Starting the camera…'}
        </ThemedText>
        <View style={styles.controls}>
          <RoundButton icon="photo" label="Choose a photo" onPress={() => void scan('library')} disabled={busy} />
          <Pressable
            onPress={() => capture.current?.()}
            disabled={!ready || busy}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            accessibilityState={{ disabled: !ready || busy }}
            style={({ pressed }) => [styles.shutter, { opacity: !ready || busy ? 0.5 : 1, transform: [{ scale: pressed ? 0.92 : 1 }] }]}
          >
            <View style={styles.shutterInner} />
          </Pressable>
          <RoundButton icon="search" label="Search by name" onPress={() => router.push('/food/search')} />
        </View>
        <ThemedText variant="caption2" style={styles.caption}>
          Estimated nutrition · photos are analyzed, not kept
        </ThemedText>
      </View>
    </View>
  );
}

function ScanFallback({ reason, scan, busy }: { reason: 'denied' | 'no_camera' | 'unsupported'; scan: (from: 'camera' | 'library') => Promise<void>; busy: boolean }) {
  const router = useRouter();
  const { colors, shadows, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const note =
    reason === 'denied'
      ? 'Camera access is off for this site. Turn it on in your browser to use the live scanner, or choose a photo instead.'
      : reason === 'no_camera'
        ? 'No camera here — choose a photo of your plate instead.'
        : 'Works best with the whole plate in frame and decent light.';

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
      <ThemedText variant="largeTitle" accessibilityRole="header">
        Scan
      </ThemedText>
      <ThemedText variant="body" color="secondary" style={styles.lede}>
        Photograph the plate. JustTrack names what’s on it and estimates the calories — you check it, then log it.
      </ThemedText>

      <LinearGradient colors={isDark ? [colors.surfaceTintStrong, colors.surfaceTint] : [colors.gradientStart, colors.gradientMiddle]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.heroCard, { borderColor: colors.border }]}>
        <View style={styles.heroBadge}>
          <ThemedText variant="caption2" style={styles.heroBadgeText}>
            ESTIMATE
          </ThemedText>
        </View>
        <ThemedText variant="title1" style={styles.heroTitle} accessibilityRole="header">
          Snap your meal
        </ThemedText>
        <ThemedText variant="subhead" style={styles.heroText}>
          {note}
        </ThemedText>
        <View style={styles.actions}>
          {reason === 'unsupported' ? <Action label="Take photo" onPress={() => void scan('camera')} disabled={busy} /> : null}
          <Action label="Choose photo" onPress={() => void scan('library')} disabled={busy} />
        </View>
      </LinearGradient>

      <Pressable
        onPress={() => router.push('/scan/describe')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.card, shadows.sm, { backgroundColor: colors.surfaceTint, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={[styles.iconTile, { backgroundColor: colors.surface }]}>
          <AppIcon name="pencil" size={22} color={colors.text} />
        </View>
        <View style={styles.cardText}>
          <ThemedText variant="headline">Describe what you ate</ThemedText>
          <ThemedText variant="footnote" color="secondary">
            Type it in a sentence; AI sizes it and finds database matches.
          </ThemedText>
        </View>
        <AppIcon name="chevronRight" size={14} color={colors.textTertiary} weight="semibold" />
      </Pressable>

      <Pressable
        onPress={() => router.push('/scan/barcode')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.card, shadows.sm, { backgroundColor: colors.surfaceTint, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={[styles.iconTile, { backgroundColor: colors.surface }]}>
          <AppIcon name="barcode" size={24} color={colors.text} />
        </View>
        <View style={styles.cardText}>
          <ThemedText variant="headline">Scan a barcode</ThemedText>
          <ThemedText variant="footnote" color="secondary">
            Packaged foods, straight from the label.
          </ThemedText>
        </View>
        <AppIcon name="chevronRight" size={14} color={colors.textTertiary} weight="semibold" />
      </Pressable>

      <Pressable
        onPress={() => router.push('/food/search')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.card, shadows.sm, { backgroundColor: colors.surfaceTint, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={[styles.iconTile, { backgroundColor: colors.surface }]}>
          <AppIcon name="search" size={22} color={colors.text} />
        </View>
        <View style={styles.cardText}>
          <ThemedText variant="headline">Search by name</ThemedText>
          <ThemedText variant="footnote" color="secondary">
            5,000+ everyday foods, plus packaged brands.
          </ThemedText>
        </View>
        <AppIcon name="chevronRight" size={14} color={colors.textTertiary} weight="semibold" />
      </Pressable>

      <ThemedText variant="caption1" color="tertiary" style={styles.footnote}>
        Photo estimates are a starting point, not a measurement. Photos are analyzed and not kept.
      </ThemedText>
    </ScrollView>
  );
}

function Action({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={({ pressed }) => [styles.action, { opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }]}
    >
      <ThemedText variant="subheadEmphasized" style={styles.actionLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const BRACKET = 220;
const SHUTTER = 74;

const styles = StyleSheet.create({
  viewfinder: { flex: 1, backgroundColor: '#0A0618' },
  topShade: { position: 'absolute', top: 0, left: 0, right: 0 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg },
  onCamera: { color: '#FFFFFF' },
  roundButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  brackets: { position: 'absolute', top: '50%', left: '50%', width: BRACKET, height: BRACKET, marginLeft: -BRACKET / 2, marginTop: -BRACKET / 2 - 40 },
  corner: { position: 'absolute', width: 34, height: 34, borderColor: VIOLET },
  bottomShade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', gap: Spacing.lg, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg },
  hint: { color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing['2xl'] },
  shutter: { width: SHUTTER, height: SHUTTER, borderRadius: SHUTTER / 2, borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: SHUTTER - 16, height: SHUTTER - 16, borderRadius: (SHUTTER - 16) / 2, backgroundColor: '#FFFFFF' },
  caption: { color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  // Fallback
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['5xl'], gap: Spacing.md },
  lede: { marginBottom: Spacing.sm },
  heroCard: { borderRadius: Radii.xl, borderWidth: StyleSheet.hairlineWidth * 2, padding: Spacing['2xl'], gap: Spacing.sm },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: 6 },
  heroBadgeText: { color: '#FFFFFF', letterSpacing: 0.9, fontWeight: '700' },
  heroTitle: { color: '#FFFFFF', marginTop: Spacing.sm },
  heroText: { color: 'rgba(255,255,255,0.8)' },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: '#FFFFFF', borderRadius: Radii.lg, paddingVertical: Spacing.md, minHeight: 48 },
  actionLabel: { color: '#0A0A0B' },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radii.xl, borderWidth: StyleSheet.hairlineWidth },
  iconTile: { width: 48, height: 48, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, gap: 2 },
  footnote: { textAlign: 'center', marginTop: Spacing.md, paddingHorizontal: Spacing.lg },
});
