import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PhoneFrame } from '@/components/layout/PhoneFrame';
import { ReminderSync } from '@/components/reminders/ReminderSync';
import { StoreGate } from '@/components/StoreGate';
import { ActionSheetHost } from '@/components/ui/ActionSheetHost';
import { ToastHost } from '@/components/ui/ToastHost';
import { ThemeProvider, useAppTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/hooks/useSettings';
import { useWantsLightStatusBar } from '@/lib/statusBar';

export { AppErrorBoundary as ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: true, duration: 250 });

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StoreGate>
            <PhoneFrame>
              <RootNavigator />
              <ReminderSync />
              <ToastHost />
              <ActionSheetHost />
            </PhoneFrame>
          </StoreGate>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Logging food happens in a sheet: it rises from the bottom and can be swiped away. The tabs go dark behind it (see the curtain in the tabs layout). */
const TRACKING_MODAL = { presentation: 'modal' } as const;

function RootNavigator() {
  const { isDark, colors } = useAppTheme();
  const { welcomed } = useSettings();
  const lightStatusBar = useWantsLightStatusBar();

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, primary: colors.accent, background: colors.background, card: colors.background, text: colors.text, border: colors.border },
    };
  }, [isDark, colors]);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={isDark || lightStatusBar ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 260, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={welcomed}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="food" options={TRACKING_MODAL} />
          <Stack.Screen name="entry/[id]" options={TRACKING_MODAL} />
          <Stack.Screen name="scan/review" options={{ ...TRACKING_MODAL, gestureEnabled: false }} />
          <Stack.Screen name="scan/barcode" options={TRACKING_MODAL} />
          <Stack.Screen name="scan/describe" options={TRACKING_MODAL} />
          <Stack.Screen name="settings/goal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings/reminders" options={{ presentation: 'modal' }} />
          <Stack.Screen name="weight/index" />
          <Stack.Screen name="weight/log" options={{ presentation: 'modal' }} />
        </Stack.Protected>
        <Stack.Protected guard={!welcomed}>
          <Stack.Screen name="welcome" />
        </Stack.Protected>
        <Stack.Screen name="privacy" options={{ presentation: 'modal' }} />
        <Stack.Screen name="support" options={{ presentation: 'modal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </NavigationThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
