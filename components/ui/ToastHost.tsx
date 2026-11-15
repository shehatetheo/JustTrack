import { usePathname } from 'expo-router';
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressScale, useMotion } from '@/components/motion';
import { Duration, Springs } from '@/constants/motion';
import { HAIRLINE, MIN_TAP, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { dismissToast, toastStore, type ToastState } from '@/utils/toast';
import { ThemedText } from './ThemedText';

const STAY_MS = 4500;
/** A toast belongs to the tabs: it waits while a sheet is open over them and shows once the sheet has gone. */
const TAB_PATHS = new Set(['/', '/stats', '/scan', '/profile']);
/** Clears the tab bar and its raised scan button. */
const ABOVE_TAB_BAR = 92;

/** Draws the current toast just above the tab bar. One instance, at the root. */
export function ToastHost() {
  const current = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot, toastStore.getSnapshot);
  const pathname = usePathname();
  const toast = TAB_PATHS.has(pathname) ? current : null;
  const { colors, shadows } = useAppTheme();
  const { reduced } = useMotion();
  const insets = useSafeAreaInsets();
  const [last, setLast] = useState<ToastState | null>(toast);
  if (toast && toast !== last) setLast(toast);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!toast) {
      progress.set(withTiming(0, { duration: Duration.micro }));
      return;
    }
    progress.set(reduced ? withTiming(1, { duration: Duration.micro }) : withSpring(1, Springs.settle));
    const timer = setTimeout(() => dismissToast(toast.id), STAY_MS);
    return () => clearTimeout(timer);
  }, [progress, reduced, toast]);

  const style = useAnimatedStyle(() => ({ opacity: progress.get(), transform: [{ translateY: reduced ? 0 : (1 - progress.get()) * 24 }] }));
  if (!last) return null;

  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + ABOVE_TAB_BAR }]}>
      <Animated.View pointerEvents={toast ? 'auto' : 'none'} accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.toast, shadows.lg, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderAccent }, style]}>
        <ThemedText variant="subheadEmphasized" numberOfLines={2} style={styles.message}>
          {last.message}
        </ThemedText>
        {last.actionLabel && last.onAction ? (
          <PressScale
            onPress={() => {
              last.onAction?.();
              dismissToast(last.id);
            }}
            haptic="select"
            accessibilityRole="button"
            accessibilityLabel={last.actionLabel}
            style={[styles.action, { borderColor: colors.borderAccent }]}
          >
            <ThemedText variant="subheadEmphasized" style={{ color: colors.accentText }}>
              {last.actionLabel.toLowerCase()}
            </ThemedText>
          </PressScale>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: Spacing.lg, right: Spacing.lg, alignItems: 'center', zIndex: 40, elevation: 40 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, maxWidth: 440, width: '100%', paddingLeft: Spacing.lg, paddingRight: Spacing.sm, paddingVertical: Spacing.sm, borderRadius: Radii.xl, borderWidth: HAIRLINE, minHeight: MIN_TAP + 12 },
  message: { flex: 1 },
  action: { minHeight: MIN_TAP, minWidth: MIN_TAP + 16, paddingHorizontal: Spacing.md, borderRadius: Radii.full, borderWidth: HAIRLINE, alignItems: 'center', justifyContent: 'center' },
});
