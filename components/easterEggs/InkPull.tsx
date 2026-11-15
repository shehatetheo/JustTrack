import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { Splatter } from '@/components/decor';
import { useMotion } from '@/components/motion';
import { useAppTheme } from '@/contexts/ThemeContext';

/** How far the page has to be pulled before the drop lets go. */
const SPLAT_AT = 64;

/**
 * Pull a page down past its top and a drop of ink hangs from the edge,
 * stretching as you pull, until it lets go and splats. Lives in the space
 * above the page, so it only shows while the page is being pulled. Hidden
 * from screen readers; with motion reduced there is nothing to see.
 */
export function InkPull({ pull }: { pull: SharedValue<number> }) {
  const { colors } = useAppTheme();
  const { reduced } = useMotion();

  const drop = useAnimatedStyle(() => {
    const distance = Math.min(pull.get(), SPLAT_AT);
    return { opacity: pull.get() > 2 && pull.get() < SPLAT_AT ? 1 : 0, transform: [{ translateY: -distance * 0.35 }, { scaleY: 1 + distance / 26 }, { scaleX: 1 - distance / 220 }] };
  });
  const splat = useAnimatedStyle(() => {
    const over = Math.max(pull.get() - SPLAT_AT, 0);
    return { opacity: over > 0 ? 1 : 0, transform: [{ scale: 0.6 + Math.min(over / 40, 0.7) }] };
  });
  if (reduced) return null;

  return (
    <View pointerEvents="none" style={styles.root} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.drop, { backgroundColor: colors.accent }, drop]} />
      <Animated.View style={[styles.splat, splat]}>
        <Splatter size={64} color={colors.accent} seed={6} count={18} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: -58, left: 0, right: 0, height: 58, alignItems: 'center', justifyContent: 'flex-end', zIndex: 1 },
  drop: { width: 10, height: 10, borderRadius: 5, marginBottom: 8, transformOrigin: 'top' },
  splat: { position: 'absolute', bottom: -6 },
});
