import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { HAIRLINE, Radii } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

interface GlassProps extends ViewProps {
  radius?: number;
  /** Frost whatever is behind. Only for things that float over moving content (the tab bar); a panel on the page doesn't need it. */
  blur?: boolean;
  /** A panel that sits on another panel. */
  raised?: boolean;
  /** Lavender edge, for the one panel on a screen that should catch the eye. */
  lit?: boolean;
  /** Leave out the gloss along the top. */
  flat?: boolean;
}

/**
 * A pane of smoked glass: a near-black fill, a hairline edge, and a faint
 * sheen falling from the top. Every panel in the app is one of these, so
 * the collage art has a calm, consistent thing to sit behind.
 */
export function Glass({ radius = Radii.lg, blur = false, raised = false, lit = false, flat = false, style, children, ...rest }: GlassProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <View {...rest} style={[styles.pane, { borderRadius: radius, borderColor: lit ? colors.borderAccent : colors.border, backgroundColor: blur ? 'transparent' : raised ? colors.surfaceRaised : colors.surface }, style]}>
      {blur ? (
        <>
          <BlurView intensity={isDark ? 50 : 65} tint={isDark ? 'systemUltraThinMaterialDark' : 'systemThinMaterialLight'} style={StyleSheet.absoluteFill} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBarBackground }]} />
        </>
      ) : null}
      {flat ? null : <LinearGradient pointerEvents="none" colors={[colors.sheen, 'transparent']} style={styles.sheen} />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  pane: { borderWidth: HAIRLINE, overflow: 'hidden' },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '45%' },
});
