import React from 'react';
import { StyleSheet } from 'react-native';

import { PressScale } from '@/components/motion';
import { HAIRLINE, MIN_TAP, Radii } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { AppIcon } from './AppIcon';

interface CloseButtonProps {
  onPress: () => void;
  label?: string;
  /** Sits over a photo or the camera: a dark disc with white ink in either theme. */
  onPhoto?: boolean;
  /** Back chevron instead of an X, for a screen that was pushed rather than presented. */
  back?: boolean;
}

/** The one way to leave a screen: a round button with an X (or a chevron), top corner, every time. */
export function CloseButton({ onPress, label, onPhoto = false, back = false }: CloseButtonProps) {
  const { colors } = useAppTheme();
  return (
    <PressScale
      onPress={onPress}
      haptic="select"
      accessibilityRole="button"
      accessibilityLabel={label ?? (back ? 'Back' : 'Close')}
      hitSlop={(MIN_TAP - SIZE) / 2}
      style={[styles.button, { backgroundColor: onPhoto ? colors.photoPlate : colors.surface, borderColor: onPhoto ? colors.onHeroMuted : colors.border }]}
    >
      <AppIcon name={back ? 'chevronLeft' : 'close'} size={back ? 17 : 15} color={onPhoto ? colors.onHero : colors.text} weight="semibold" />
    </PressScale>
  );
}

const SIZE = 36;

const styles = StyleSheet.create({
  button: { width: SIZE, height: SIZE, borderRadius: Radii.full, borderWidth: HAIRLINE, alignItems: 'center', justifyContent: 'center' },
});
