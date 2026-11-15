import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/contexts/ThemeContext';

/** On the web a sheet fills the screen, so the insets it inherits (the phone frame's, on a laptop) are already right. */
export function SheetFrame({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return <View style={[styles.frame, { backgroundColor: colors.background }]}>{children}</View>;
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
});
