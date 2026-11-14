import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import React from 'react';
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { Glass } from '@/components/ui/Glass';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

/**
 * The tab bar: a floating capsule of frosted glass with four round icon buttons and, in
 * the middle, the one that matters — a search button that starts logging. The
 * selected tab is a dark circle. Composed inline in app/(tabs)/_layout.tsx
 * because expo-router/ui reads the TabTriggers there.
 */

export function TabBarContainer({ style, children, ref, ...rest }: ViewProps & { ref?: React.Ref<View> }) {
  const { colors, shadows } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    // TabList passes a row layout; ours comes last so the pill fills the width.
    <View {...rest} ref={ref} accessibilityRole="tablist" style={[style, styles.container, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
      <View style={[styles.shadow, shadows.lg]}>
        <Glass blur flat radius={Radii.full} style={[styles.pill, { borderColor: colors.tabBarBorder }]}>
          {children}
        </Glass>
      </View>
    </View>
  );
}

interface TabBarButtonProps extends TabTriggerSlotProps {
  icon: AppIconName;
  activeIcon?: AppIconName;
  label: string;
}

export function TabBarButton({ icon, activeIcon, label, isFocused, onPress, style, ref, ...rest }: TabBarButtonProps) {
  const { colors } = useAppTheme();
  const focus = useSharedValue(isFocused ? 1 : 0);
  React.useEffect(() => {
    focus.set(withSpring(isFocused ? 1 : 0, { damping: 14, stiffness: 220 }));
  }, [focus, isFocused]);
  const circle = useAnimatedStyle(() => ({ transform: [{ scale: 0.82 + focus.get() * 0.18 }], opacity: 0.85 + focus.get() * 0.15 }));

  return (
    <Pressable
      {...rest}
      ref={ref}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: Boolean(isFocused) }}
      onPress={(event) => {
        if (!isFocused) Haptics.selectionAsync();
        onPress?.(event);
      }}
      // TabTrigger injects a row layout; ours must come last to win.
      style={(state) => [typeof style === 'function' ? style(state) : style, styles.tab]}
    >
      <Animated.View style={[styles.circle, isFocused && { backgroundColor: colors.surfaceTintStrong }, circle]}>
        <AppIcon name={isFocused && activeIcon ? activeIcon : icon} size={22} color={isFocused ? colors.tabIconSelected : colors.tabIconDefault} />
      </Animated.View>
    </Pressable>
  );
}

/** The search button in the middle of the bar: opens Add Food for whichever meal fits the time of day. */
export function AddButton() {
  const router = useRouter();
  const { colors, shadows } = useAppTheme();

  return (
    <View style={styles.tab}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/food/search');
        }}
        accessibilityRole="button"
        accessibilityLabel="Add food"
        accessibilityHint="Search foods, brands, and restaurant menus"
        style={({ pressed }) => [styles.fab, shadows.md, { backgroundColor: colors.fab, transform: [{ scale: pressed ? 0.94 : 1 }] }]}
      >
        <AppIcon name="search" size={24} color={colors.fabIcon} weight="bold" />
      </Pressable>
    </View>
  );
}

const CIRCLE = 44;
const FAB_SIZE = 56;

const styles = StyleSheet.create({
  container: { flexDirection: 'column', alignItems: 'stretch', paddingTop: Spacing.sm, paddingHorizontal: Spacing.lg, backgroundColor: 'transparent' },
  shadow: { alignSelf: 'stretch', borderRadius: Radii.full },
  pill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 6 },
  tab: { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: FAB_SIZE },
  circle: { width: CIRCLE, height: CIRCLE, borderRadius: CIRCLE / 2, alignItems: 'center', justifyContent: 'center' },
  fab: { width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2, alignItems: 'center', justifyContent: 'center' },
});
