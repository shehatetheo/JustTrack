import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { FiligreeCorner, Splatter } from '@/components/decor';
import { discover } from '@/components/easterEggs/found';
import { PressScale, useMotion } from '@/components/motion';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { ThemedText } from '@/components/ui/ThemedText';
import { Duration, Haptic, Springs } from '@/constants/motion';
import { Gloss, HAIRLINE, MIN_TAP, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { countTaps, EASTER_EGGS_ENABLED } from '@/lib/easterEggs/eggs';

/**
 * The tab bar: a dark blade across the foot of the screen, edged with a
 * lavender hairline and capped with filigree. Five slots: home, today, the
 * raised scan button, search, profile. A short bar of light glides to the
 * tab in front and leaves a fleck of ink where it lands. Composed inline in
 * app/(tabs)/_layout.tsx because expo-router/ui reads the TabTriggers there.
 */

const SLOTS = 5;
/** Which slot each tab's path lights. Search isn't a tab: it opens Add Food. */
const SLOT_FOR_PATH: Record<string, number> = { '/': 0, '/stats': 1, '/scan': 2, '/profile': 4 };
const SCAN_SIZE = 62;

/** Whether the bar's end caps have been swapped (tap the tab you are on three times, quickly). Lasts until the app restarts. */
let flipped = false;
const flipListeners = new Set<() => void>();
const flipStore = {
  getSnapshot: () => flipped,
  subscribe: (listener: () => void) => {
    flipListeners.add(listener);
    return () => flipListeners.delete(listener);
  },
};
function flipBlade() {
  flipped = !flipped;
  flipListeners.forEach((listener) => listener());
}
const SCAN_LIFT = 20;

export function TabBarContainer({ style, children, ref, ...rest }: ViewProps & { ref?: React.Ref<View> }) {
  const { colors, shadows } = useAppTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { reduced } = useMotion();
  const [width, setWidth] = useState(0);
  const slot = SLOT_FOR_PATH[pathname];
  // While a modal is open the path isn't a tab's; the light stays where it was.
  const [active, setActive] = useState(slot ?? 0);
  if (slot !== undefined && slot !== active) setActive(slot);
  const slotWidth = width / SLOTS;

  const position = useSharedValue(active);
  const splash = useSharedValue(1);
  useEffect(() => {
    position.set(reduced ? withTiming(active, { duration: Duration.micro }) : withSpring(active, Springs.glide));
    if (reduced) return;
    splash.set(0);
    splash.set(withSequence(withTiming(0, { duration: Duration.micro }), withTiming(1, { duration: Duration.standard })));
  }, [active, position, reduced, splash]);

  const turned = useSyncExternalStore(flipStore.subscribe, flipStore.getSnapshot, flipStore.getSnapshot);
  const turn = useSharedValue(0);
  useEffect(() => {
    turn.set(reduced ? withTiming(turned ? 1 : 0, { duration: Duration.micro }) : withSpring(turned ? 1 : 0, Springs.snappy));
  }, [reduced, turn, turned]);
  const capLeft = useAnimatedStyle(() => ({ transform: [{ translateX: turn.get() * Math.max(width - 30, 0) }, { scaleX: 1 - turn.get() * 2 }] }));
  const capRight = useAnimatedStyle(() => ({ transform: [{ translateX: -turn.get() * Math.max(width - 30, 0) }, { scaleX: 1 - turn.get() * 2 }] }));

  const light = useAnimatedStyle(() => ({ transform: [{ translateX: position.get() * slotWidth + slotWidth / 2 - LIGHT_WIDTH / 2 }] }));
  const ink = useAnimatedStyle(() => ({ opacity: splash.get() >= 1 ? 0 : 1 - splash.get(), transform: [{ translateX: active * slotWidth + slotWidth / 2 - 14 }, { scale: 0.5 + splash.get() * 0.9 }] }));

  return (
    // TabList passes a row layout; ours comes last so the blade spans the width.
    <View {...rest} ref={ref} accessibilityRole="tablist" style={[style, styles.container]}>
      <View style={[styles.blade, shadows.lg, { backgroundColor: colors.surface, borderTopColor: colors.tabBarBorder, paddingBottom: Math.max(insets.bottom, Spacing.sm) }]} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        <LinearGradient pointerEvents="none" colors={[colors.sheen, 'transparent']} style={styles.sheen} />
        <Animated.View pointerEvents="none" style={[styles.capLeft, capLeft]}>
          <FiligreeCorner size={22} color={colors.tabBarBorder} />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.capRight, capRight]}>
          <View style={styles.flip}>
            <FiligreeCorner size={22} color={colors.tabBarBorder} />
          </View>
        </Animated.View>
        {width > 0 && active !== 2 ? (
          <>
            <Animated.View pointerEvents="none" style={[styles.light, { backgroundColor: colors.accent, shadowColor: colors.accentDeep }, light]} />
            <Animated.View pointerEvents="none" style={[styles.ink, ink]}>
              <Splatter size={28} color={colors.accent} seed={active + 3} count={9} />
            </Animated.View>
          </>
        ) : null}
        <View style={styles.row}>{children}</View>
      </View>
    </View>
  );
}

interface TabBarButtonProps extends TabTriggerSlotProps {
  icon: AppIconName;
  activeIcon?: AppIconName;
  label: string;
}

/** An ordinary tab: an icon over a lowercase label. */
export function TabBarButton({ icon, activeIcon, label, isFocused, onPress, style, ref, ...rest }: TabBarButtonProps) {
  const { colors } = useAppTheme();
  const taps = useRef<number[]>([]);

  return (
    <Pressable
      {...rest}
      ref={ref}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: Boolean(isFocused) }}
      onPress={(event) => {
        if (!isFocused) {
          Haptic.select();
          taps.current = [];
        } else if (EASTER_EGGS_ENABLED) {
          // Three quick taps on the tab you are already on swap the bar's end caps.
          taps.current = countTaps(taps.current, Date.now(), 3, 700);
          if (taps.current.length === 3) {
            taps.current = [];
            discover('blade-flip');
            flipBlade();
          }
        }
        onPress?.(event);
      }}
      // TabTrigger injects a row layout; ours must come last to win.
      style={(state) => [typeof style === 'function' ? style(state) : style, styles.tab, { opacity: state.pressed ? 0.6 : 1 }]}
    >
      <AppIcon name={isFocused && activeIcon ? activeIcon : icon} size={21} color={isFocused ? colors.tabIconSelected : colors.tabIconDefault} />
      <ThemedText variant="caption2" style={[styles.label, { color: isFocused ? colors.tabIconSelected : colors.tabIconDefault }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/** The search slot. Not a tab: it opens Add Food for whichever meal fits the time of day. */
export function SearchButton() {
  const router = useRouter();
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={() => {
        Haptic.tap();
        router.push('/food/search');
      }}
      accessibilityRole="button"
      accessibilityLabel="Add food"
      accessibilityHint="Search foods, brands, and restaurant menus"
      style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.6 : 1 }]}
    >
      <AppIcon name="search" size={21} color={colors.tabIconDefault} />
      <ThemedText variant="caption2" style={[styles.label, { color: colors.tabIconDefault }]}>
        search
      </ThemedText>
    </Pressable>
  );
}

/** The scan tab: a raised capsule of lavender glass inside a thin ornate ring that turns slowly. */
export function ScanTabButton({ isFocused, onPress, style: _style, ref, ...rest }: TabTriggerSlotProps) {
  const { colors, shadows } = useAppTheme();
  const { reduced } = useMotion();
  const turn = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    turn.set(withRepeat(withTiming(1, { duration: Duration.ambient * 7, easing: Easing.linear }), -1, false));
  }, [reduced, turn]);
  const ring = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.get() * 360}deg` }] }));
  const ringSize = SCAN_SIZE + 16;
  const centre = ringSize / 2;

  return (
    <View ref={ref} style={styles.tab}>
      <PressScale
        {...rest}
        accessibilityRole="tab"
        accessibilityLabel="scan"
        accessibilityHint="Photograph a meal"
        accessibilityState={{ selected: Boolean(isFocused) }}
        haptic={isFocused ? null : 'tap'}
        onPress={(event) => onPress?.(event)}
        style={[styles.scan, shadows.lg]}
      >
        <Animated.View pointerEvents="none" style={[styles.scanRing, { width: ringSize, height: ringSize }, ring]}>
          <Svg width={ringSize} height={ringSize}>
            <Circle cx={centre} cy={centre} r={centre - 1.5} stroke={colors.tabBarBorder} strokeWidth={1} strokeDasharray="1.5 5" fill="none" />
            {[0, 90, 180, 270].map((angle) => (
              <Path key={angle} d={`M${centre} 0 l3 4.5 l-3 4.5 l-3 -4.5 Z`} fill={colors.accent} transform={`rotate(${angle} ${centre} ${centre})`} />
            ))}
          </Svg>
        </Animated.View>
        <View style={styles.scanFace}>
          <LinearGradient colors={Gloss.capsule} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={Gloss.highlight} style={styles.scanGloss} />
          <AppIcon name={isFocused ? 'scanFilled' : 'scan'} size={25} color={colors.onAccent} weight="semibold" />
        </View>
      </PressScale>
      <ThemedText variant="caption2" style={[styles.label, styles.scanLabel, { color: isFocused ? colors.tabIconSelected : colors.tabIconDefault }]}>
        scan
      </ThemedText>
    </View>
  );
}

const LIGHT_WIDTH = 26;

const styles = StyleSheet.create({
  container: { flexDirection: 'column', alignItems: 'stretch', backgroundColor: 'transparent' },
  blade: { borderTopWidth: HAIRLINE, paddingTop: Spacing.sm },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, height: 22 },
  capLeft: { position: 'absolute', top: 3, left: 3 },
  capRight: { position: 'absolute', top: 3, right: 3 },
  flip: { transform: [{ rotate: '90deg' }] },
  light: { position: 'absolute', top: -1.5, left: 0, width: LIGHT_WIDTH, height: 3, borderRadius: Radii.full, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  ink: { position: 'absolute', top: -12, left: 0, width: 28, height: 28 },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  tab: { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 3, minHeight: MIN_TAP + 2 },
  label: { letterSpacing: 0.3 },
  scan: { width: SCAN_SIZE, height: SCAN_SIZE, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', marginTop: -SCAN_LIFT },
  scanRing: { position: 'absolute' },
  scanFace: { width: SCAN_SIZE, height: SCAN_SIZE, borderRadius: Radii.full, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  scanGloss: { position: 'absolute', top: 2, left: 8, right: 8, height: '44%', borderRadius: Radii.full },
  scanLabel: { marginTop: 1 },
});
