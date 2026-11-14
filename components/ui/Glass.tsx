import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Radii } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

interface GlassProps extends ViewProps {
  radius?: number;
  /** Frost whatever is behind. Worth it for things that float over moving content (the tab bar, a footer); a card on a plain page doesn't need it. */
  blur?: boolean;
  /** A denser pane, for controls that need to stand off the glass they sit on. */
  strong?: boolean;
  /** Leave out the light catching the top edge. */
  flat?: boolean;
}

/**
 * A pane of smoked glass: a translucent fill, a hairline edge, and a faint
 * sheen falling from the top. In dark mode this is the app's one surface;
 * everything that isn't the black page is one of these.
 */
export function Glass({ radius = Radii.lg, blur = false, strong = false, flat = false, style, children, ...rest }: GlassProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <View {...rest} style={[styles.pane, { borderRadius: radius, borderColor: colors.border, backgroundColor: blur ? 'transparent' : strong ? colors.surfaceTintStrong : colors.surfaceTint }, style]}>
      {blur ? (
        <>
          <BlurView intensity={isDark ? 55 : 70} tint={isDark ? 'systemUltraThinMaterialDark' : 'systemThinMaterialLight'} style={StyleSheet.absoluteFill} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBarBackground }]} />
        </>
      ) : null}
      {flat ? null : <LinearGradient pointerEvents="none" colors={[isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0)']} style={styles.sheen} />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  pane: { borderWidth: StyleSheet.hairlineWidth * 2, overflow: 'hidden' },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '55%' },
});
