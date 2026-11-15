import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAppTheme } from '@/contexts/ThemeContext';

/**
 * The outermost view of a screen that opens as a sheet. An iOS sheet starts
 * below the status bar, so its safe area is not the window's; measuring
 * again here gives everything inside the sheet the right insets.
 */
export function SheetFrame({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return <SafeAreaProvider style={[styles.frame, { backgroundColor: colors.background }]}>{children}</SafeAreaProvider>;
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
});
