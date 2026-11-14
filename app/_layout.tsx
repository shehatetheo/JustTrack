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
              <ActionSheetHost />
            </PhoneFrame>
          </StoreGate>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** A sheet that covers the screen edge to edge and rises from the bottom. */
const TRACKING_MODAL = { presentation: 'fullScreenModal', animation: 'slide_from_bottom' } as const;

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
          {/* Logging food takes the whole screen, so Home never shows behind it. */}
          <Stack.Screen name="food" options={TRACKING_MODAL} />
          <Stack.Screen name="entry/[id]" options={TRACKING_MODAL} />
          <Stack.Screen name="scan/review" options={{ ...TRACKING_MODAL, gestureEnabled: false }} />
          <Stack.Screen name="scan/barcode" options={TRACKING_MODAL} />
          <Stack.Screen name="scan/describe" options={TRACKING_MODAL} />
          <Stack.Screen
            name="settings/goal"
            options={{ presentation: 'modal', headerShown: true, title: 'Daily Goal', headerShadowVisible: false, headerTintColor: colors.text, headerStyle: { backgroundColor: colors.background } }}
          />
          <Stack.Screen name="weight/index" options={{ headerShown: true, title: 'Weight', headerShadowVisible: false, headerTintColor: colors.text, headerStyle: { backgroundColor: colors.background } }} />
          <Stack.Screen name="weight/log" options={{ presentation: 'modal', headerShown: true, title: 'Log weight', headerShadowVisible: false, headerTintColor: colors.text, headerStyle: { backgroundColor: colors.background } }} />
          <Stack.Screen
            name="settings/reminders"
            options={{ presentation: 'modal', headerShown: true, title: 'Reminders', headerShadowVisible: false, headerTintColor: colors.text, headerStyle: { backgroundColor: colors.background } }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!welcomed}>
          <Stack.Screen name="welcome" />
        </Stack.Protected>
        <Stack.Screen name="privacy" options={{ presentation: 'modal' }} />
        <Stack.Screen name="support" options={{ presentation: 'modal' }} />
        <Stack.Screen name="+not-found" options={{ headerShown: true, title: 'Not Found' }} />
      </Stack>
    </NavigationThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
