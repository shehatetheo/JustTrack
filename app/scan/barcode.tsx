import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SkeletonRows } from '@/components/food/SkeletonRows';
import { SheetFrame } from '@/components/layout/SheetFrame';
import { SheetHeader } from '@/components/layout/SheetHeader';
import { useMotion } from '@/components/motion';
import { BarcodeScanner } from '@/components/scanner/BarcodeScanner';
import { Button } from '@/components/ui/Button';
import { OrnateFrame } from '@/components/ui/OrnateFrame';
import { ThemedText } from '@/components/ui/ThemedText';
import { Easings, Haptic } from '@/constants/motion';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { rememberFoods } from '@/lib/food/foodStore';
import { getOpenFoodFactsProduct } from '@/lib/food/openFoodFacts';
import { useLightStatusBar } from '@/lib/statusBar';
import { getErrorMessage } from '@/utils/errors';

type Status = { kind: 'scanning' } | { kind: 'looking_up'; code: string } | { kind: 'not_found'; code: string } | { kind: 'error'; message: string };

const RETICLE = { width: 270, height: 160 };

/** The frame the barcode goes in: filigree corners and a line of light passing over it while the camera looks. */
function Reticle({ scanning }: { scanning: boolean }) {
  const { colors } = useAppTheme();
  const { reduced } = useMotion();
  const sweep = useSharedValue(0);
  useEffect(() => {
    if (reduced || !scanning) return;
    sweep.set(withRepeat(withSequence(withTiming(1, { duration: 1300, easing: Easings.inOut }), withTiming(0, { duration: 1300, easing: Easings.inOut })), -1, false));
  }, [reduced, scanning, sweep]);
  const line = useAnimatedStyle(() => ({ transform: [{ translateY: sweep.get() * (RETICLE.height - 24) }] }));

  return (
    <OrnateFrame variant="corners" corner={40} color={colors.onHero} style={[styles.reticle, RETICLE]}>
      {scanning && !reduced ? (
        <Animated.View style={[styles.sweep, line]}>
          <LinearGradient colors={['transparent', colors.accent, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.sweepLine} />
        </Animated.View>
      ) : null}
    </OrnateFrame>
  );
}

/** Point at a package barcode; Open Food Facts supplies the label's nutrition. */
export default function BarcodeScreen() {
  return (
    <SheetFrame>
      <BarcodeFlow />
    </SheetFrame>
  );
}

function BarcodeFlow() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<Status>({ kind: 'scanning' });
  useLightStatusBar();

  const onDetected = useCallback(
    async (code: string) => {
      Haptic.success();
      setStatus({ kind: 'looking_up', code });
      try {
        const food = await getOpenFoodFactsProduct(code);
        if (!food) {
          setStatus({ kind: 'not_found', code });
          return;
        }
        rememberFoods([food]);
        router.replace({ pathname: '/food/[id]', params: { id: food.id } });
      } catch (error) {
        setStatus({ kind: 'error', message: getErrorMessage(error) });
      }
    },
    [router]
  );
  const onError = useCallback((message: string) => setStatus({ kind: 'error', message }), []);
  const live = status.kind === 'scanning' || status.kind === 'looking_up';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.viewport, { backgroundColor: colors.hero }]}>
        {live ? <BarcodeScanner onDetected={onDetected} onError={onError} /> : null}
        <LinearGradient pointerEvents="none" colors={[colors.photoPlate, 'transparent']} style={styles.topShade} />
        <View pointerEvents="none" style={styles.frame}>
          <Reticle scanning={status.kind === 'scanning'} />
        </View>
        <SheetHeader title="Barcode" tagline="anything in a packet" onClose={() => router.back()} onPhoto style={styles.header} />
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + Spacing.xl, borderTopColor: colors.borderAccent }]}>
        {status.kind === 'scanning' ? (
          <>
            <ThemedText variant="title3">scan a barcode</ThemedText>
            <ThemedText variant="subhead" color="secondary">
              Line the barcode up inside the frame.
            </ThemedText>
          </>
        ) : null}
        {status.kind === 'looking_up' ? (
          <View accessibilityRole="progressbar" accessibilityLabel={`Looking up ${status.code}`}>
            <ThemedText variant="tagline" color="secondary">
              looking up {status.code}…
            </ThemedText>
            <SkeletonRows count={1} />
          </View>
        ) : null}
        {status.kind === 'not_found' ? (
          <>
            <ThemedText variant="title3">not in the book</ThemedText>
            <ThemedText variant="subhead" color="secondary">
              Barcode {status.code} isn’t in Open Food Facts yet. You can still search for it by name.
            </ThemedText>
            <Button label="Search by name" onPress={() => router.replace('/food/search')} />
            <Button label="Scan again" variant="secondary" onPress={() => setStatus({ kind: 'scanning' })} />
          </>
        ) : null}
        {status.kind === 'error' ? (
          <>
            <ThemedText variant="title3">camera unavailable</ThemedText>
            <ThemedText variant="subhead" color="secondary">
              {status.message}
            </ThemedText>
            <Button label="Search by name" onPress={() => router.replace('/food/search')} />
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  viewport: { flex: 1, overflow: 'hidden' },
  topShade: { position: 'absolute', top: 0, left: 0, right: 0, height: 140 },
  header: { position: 'absolute', top: 0, left: 0, right: 0 },
  frame: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  reticle: { borderRadius: Radii.lg },
  sweep: { position: 'absolute', left: 12, right: 12, top: 12 },
  sweepLine: { height: 2 },
  panel: { padding: Spacing.xl, gap: Spacing.md, minHeight: 160, borderTopWidth: StyleSheet.hairlineWidth },
});
