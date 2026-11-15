import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedBackground } from '@/components/background/AnimatedBackground';
import { Splatter } from '@/components/decor';
import { PressScale, useMotion } from '@/components/motion';
import { LiveCamera } from '@/components/scanner/LiveCamera';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Glass } from '@/components/ui/Glass';
import { Heading } from '@/components/ui/Heading';
import { OrnateFrame } from '@/components/ui/OrnateFrame';
import { ThemedText } from '@/components/ui/ThemedText';
import { Duration, Haptic } from '@/constants/motion';
import { Gloss, HAIRLINE, MIN_TAP, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useMealScan } from '@/hooks/useMealScan';
import { useLightStatusBar } from '@/lib/statusBar';

type Unavailable = 'denied' | 'no_camera' | 'unsupported';

const NOTES: Record<Unavailable, string> = {
  denied: 'camera access is off. turn it on in settings to use the live scanner, or choose a photo instead.',
  no_camera: 'no camera here. choose a photo of your plate instead.',
  unsupported: 'works best with the whole plate in frame and decent light.',
};

/** A round control that sits on the artwork or the camera: a dark disc with a white glyph. */
function RoundButton({ icon, label, onPress, disabled }: { icon: AppIconName; label: string; onPress: () => void; disabled?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <PressScale onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: Boolean(disabled) }} style={[styles.round, { backgroundColor: colors.photoPlate, borderColor: colors.onHeroMuted, opacity: disabled ? 0.5 : 1 }]}>
      <AppIcon name={icon} size={20} color={colors.onHero} weight="semibold" />
    </PressScale>
  );
}

/** The viewfinder's wrought-iron corners. They breathe, very slightly, so the frame feels alive without pulling the eye from the plate. */
function BreathingFrame({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  const { reduced } = useMotion();
  const breath = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    breath.set(withRepeat(withSequence(withTiming(1, { duration: Duration.ambient, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: Duration.ambient, easing: Easing.inOut(Easing.quad) })), -1, false));
  }, [breath, reduced]);
  const style = useAnimatedStyle(() => ({ opacity: 0.75 + breath.get() * 0.25, transform: [{ scale: 1 + breath.get() * 0.012 }] }));

  return (
    <View style={styles.viewfinder}>
      <View style={[styles.feed, { borderColor: colors.border, backgroundColor: colors.hero }]}>{children}</View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
        <OrnateFrame variant="corners" corner={58} color={colors.onHero} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

/**
 * Scan: frame the plate inside the filigree, press the lavender shutter,
 * and the review screen names what's on it. Where the camera can't be used
 * the same screen offers the photo picker instead.
 */
export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { scan, analyze, busy } = useMealScan();
  const [focused, setFocused] = useState(false);
  const [fallback, setFallback] = useState<Unavailable | null>(null);
  const [ready, setReady] = useState(false);
  const capture = useRef<(() => void) | null>(null);
  const flash = useSharedValue(0);
  useLightStatusBar();

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );

  const onCapture = useCallback(
    (uri: string) => {
      Haptic.log();
      void analyze({ uri });
    },
    [analyze]
  );
  const onUnavailable = useCallback((reason: Unavailable) => setFallback(reason), []);
  const bindCapture = useCallback((fn: (() => void) | null) => {
    capture.current = fn;
    setReady(fn !== null);
  }, []);

  const shoot = () => {
    // The frame goes black for an instant and ink bursts from the shutter, like a plate exposed.
    flash.set(withSequence(withTiming(1, { duration: 60 }), withTiming(0, { duration: Duration.standard })));
    capture.current?.();
  };
  const blackout = useAnimatedStyle(() => ({ opacity: flash.get() }));
  const burst = useAnimatedStyle(() => ({ opacity: flash.get(), transform: [{ scale: 1.2 + (1 - flash.get()) * 1.6 }] }));

  return (
    <View style={[styles.root, { backgroundColor: colors.hero }]}>
      <AnimatedBackground page="scan" fit="cover" />
      <LinearGradient pointerEvents="none" colors={[colors.hero, 'transparent']} style={[styles.topShade, { height: insets.top + 110 }]} />
      <LinearGradient pointerEvents="none" colors={['transparent', colors.photoPlate, colors.hero]} locations={[0, 0.35, 0.9]} style={styles.bottomShade} />

      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <RoundButton icon="pencil" label="Describe what you ate" onPress={() => router.push('/scan/describe')} />
        <Heading title="scan" tagline="show me the plate" level="title" align="center" onHero style={styles.heading} />
        <RoundButton icon="barcode" label="Scan a barcode" onPress={() => router.push('/scan/barcode')} />
      </View>

      {fallback ? (
        <View style={styles.viewfinder}>
          <OrnateFrame variant="corners" corner={58} color={colors.onHero} style={styles.fallbackFrame}>
            <Glass radius={Radii['2xl']} lit style={styles.fallbackPanel}>
              <ThemedText variant="blackletter" style={styles.center}>
                no lens
              </ThemedText>
              <ThemedText variant="subhead" color="secondary" style={styles.center}>
                {NOTES[fallback]}
              </ThemedText>
              <View style={styles.fallbackActions}>
                {fallback === 'unsupported' ? <Button label="Take photo" onPress={() => void scan('camera')} disabled={busy} /> : null}
                <Button label="Choose photo" variant={fallback === 'unsupported' ? 'secondary' : 'primary'} onPress={() => void scan('library')} disabled={busy} />
              </View>
            </Glass>
          </OrnateFrame>
        </View>
      ) : (
        <BreathingFrame>
          <LiveCamera active={focused && !busy} onCapture={onCapture} onUnavailable={onUnavailable} bindCapture={bindCapture} />
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.hero }, blackout]} />
        </BreathingFrame>
      )}

      <View style={styles.bottomBar}>
        <ThemedText variant="tagline" style={[styles.center, { color: colors.onHeroMuted }]}>
          {fallback ? 'or type it, scan a barcode, or search' : ready ? 'frame the whole plate, then press' : 'waking the camera…'}
        </ThemedText>
        <View style={styles.controls}>
          <RoundButton icon="photo" label="Choose a photo" onPress={() => void scan('library')} disabled={busy} />
          <View style={styles.shutterWrap}>
            <Animated.View pointerEvents="none" style={[styles.burst, burst]}>
              <Splatter size={SHUTTER} color={colors.accent} seed={5} count={16} />
            </Animated.View>
            <PressScale
              onPress={shoot}
              pressScale={0.9}
              haptic={null}
              disabled={!ready || busy || fallback !== null}
              accessibilityRole="button"
              accessibilityLabel="Take photo"
              accessibilityState={{ disabled: !ready || busy || fallback !== null }}
              style={[styles.shutter, { borderColor: colors.onHero, opacity: !ready || busy || fallback !== null ? 0.4 : 1 }]}
            >
              <View style={styles.shutterFace}>
                <LinearGradient colors={Gloss.capsule} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
                <LinearGradient colors={Gloss.highlight} style={styles.shutterGloss} />
              </View>
            </PressScale>
          </View>
          <RoundButton icon="search" label="Search by name" onPress={() => router.push('/food/search')} />
        </View>
        <ThemedText variant="caption2" style={[styles.center, { color: colors.onHeroMuted }]}>
          estimated nutrition · photos are analyzed, not kept
        </ThemedText>
      </View>
    </View>
  );
}

const SHUTTER = 76;

const styles = StyleSheet.create({
  root: { flex: 1 },
  topShade: { position: 'absolute', top: 0, left: 0, right: 0 },
  bottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 320 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, gap: Spacing.md },
  heading: { flex: 1 },
  round: { width: MIN_TAP, height: MIN_TAP, borderRadius: Radii.full, borderWidth: HAIRLINE, alignItems: 'center', justifyContent: 'center' },
  viewfinder: { flex: 1, marginHorizontal: Spacing.xl, marginTop: Spacing.lg, marginBottom: Spacing.md, justifyContent: 'center' },
  feed: { position: 'absolute', top: Spacing.sm, left: Spacing.sm, right: Spacing.sm, bottom: Spacing.sm, borderRadius: Radii['2xl'], borderWidth: HAIRLINE, overflow: 'hidden' },
  fallbackFrame: { padding: Spacing.sm },
  fallbackPanel: { padding: Spacing['2xl'], gap: Spacing.md },
  fallbackActions: { gap: Spacing.sm, marginTop: Spacing.sm },
  center: { textAlign: 'center' },
  bottomBar: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, gap: Spacing.md },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl },
  shutterWrap: { width: SHUTTER, height: SHUTTER, alignItems: 'center', justifyContent: 'center' },
  burst: { position: 'absolute' },
  shutter: { width: SHUTTER, height: SHUTTER, borderRadius: Radii.full, borderWidth: 2, padding: 5 },
  shutterFace: { flex: 1, borderRadius: Radii.full, overflow: 'hidden' },
  shutterGloss: { position: 'absolute', top: 2, left: 8, right: 8, height: '44%', borderRadius: Radii.full },
});
