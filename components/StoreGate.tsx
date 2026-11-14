import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

import { LoadingScreen } from '@/components/LoadingScreen';

import { logStore } from '@/lib/log/logStore';
import { settingsStore } from '@/lib/settings/settingsStore';

/** Long enough for the loading animation to read as an animation rather than a flash. */
const MIN_LOADING_MS = 900;

/**
 * Shows the loading screen until the on-device log and settings have been
 * read. The app mounts underneath as soon as the data is in, so by the time
 * the loading screen fades away the first screen is already drawn.
 */
export function StoreGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(() => logStore.isHydrated() && settingsStore.isHydrated());
  const [held, setHeld] = useState(true);

  useEffect(() => {
    // The static launch image hands over to the animated loading screen as soon as it's on screen.
    SplashScreen.hideAsync();
    let cancelled = false;
    Promise.all([logStore.hydrate(), settingsStore.hydrate()]).then(() => {
      if (!cancelled) setReady(true);
    });
    const timer = setTimeout(() => setHeld(false), MIN_LOADING_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {ready ? children : null}
      {!ready || held ? (
        <Animated.View exiting={FadeOut.duration(320)} style={StyleSheet.absoluteFill} pointerEvents={ready ? 'none' : 'auto'}>
          <LoadingScreen />
        </Animated.View>
      ) : null}
    </>
  );
}
