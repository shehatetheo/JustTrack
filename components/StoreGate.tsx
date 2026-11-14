import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { LoadingScreen } from '@/components/LoadingScreen';

import { logStore } from '@/lib/log/logStore';
import { settingsStore } from '@/lib/settings/settingsStore';
import { weightStore } from '@/lib/weight/weightStore';

/** Long enough on a cold start for a few meteors to cross. */
const LAUNCH_MS = 1900;
/** Coming back after this long in the background plays the shower again, briefly. */
const AWAY_MS = 10 * 60 * 1000;
const RETURN_MS = 1300;

/**
 * Shows the loading screen until the on-device log, weigh-ins and settings
 * have been read. The app mounts underneath as soon as the data is in, so by
 * the time the loading screen fades away the first screen is already drawn.
 */
export function StoreGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(() => logStore.isHydrated() && settingsStore.isHydrated() && weightStore.isHydrated());
  const [showing, setShowing] = useState(true);
  const leftAt = useRef<number | null>(null);

  useEffect(() => {
    // The static launch image hands over to the animated loading screen as soon as it's on screen.
    SplashScreen.hideAsync();
    let cancelled = false;
    Promise.all([logStore.hydrate(), settingsStore.hydrate(), weightStore.hydrate()]).then(() => {
      if (!cancelled) setReady(true);
    });
    let timer = setTimeout(() => setShowing(false), LAUNCH_MS);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        leftAt.current = Date.now();
        return;
      }
      if (state !== 'active' || leftAt.current === null) return;
      const away = Date.now() - leftAt.current;
      leftAt.current = null;
      if (away < AWAY_MS) return;
      clearTimeout(timer);
      setShowing(true);
      timer = setTimeout(() => setShowing(false), RETURN_MS);
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return (
    <>
      {ready ? children : null}
      {!ready || showing ? (
        <Animated.View entering={ready ? FadeIn.duration(180) : undefined} exiting={FadeOut.duration(380)} style={StyleSheet.absoluteFill} pointerEvents={ready ? 'none' : 'auto'}>
          <LoadingScreen />
        </Animated.View>
      ) : null}
    </>
  );
}
