import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LAUNCH_EXIT_MS, LAUNCH_MS, LoadingScreen } from '@/components/LoadingScreen';
import { FONT_FILES } from '@/constants/fonts';
import { logStore } from '@/lib/log/logStore';
import { settingsStore } from '@/lib/settings/settingsStore';
import { weightStore } from '@/lib/weight/weightStore';

/**
 * Holds the launch screen until the on-device log, weigh-ins, settings and
 * fonts are ready and the monogram has finished drawing. The app mounts
 * underneath as soon as the data is in, so when the launch screen is cut
 * away the first screen is already there. Touches pass through to the app
 * from the moment it is ready; the animation never blocks input.
 */
export function StoreGate({ children }: { children: React.ReactNode }) {
  // If a font fails to load the app still opens, in the system face.
  const [fontsLoaded, fontError] = useFonts(FONT_FILES);
  const [stored, setStored] = useState(() => logStore.isHydrated() && settingsStore.isHydrated() && weightStore.isHydrated());
  const ready = stored && (fontsLoaded || fontError !== null);
  const [drawn, setDrawn] = useState(false);
  const [gone, setGone] = useState(false);
  const leaving = ready && drawn;

  useEffect(() => {
    // The static launch image hands over to the drawn one as soon as it's on screen.
    SplashScreen.hideAsync();
    let cancelled = false;
    Promise.all([logStore.hydrate(), settingsStore.hydrate(), weightStore.hydrate()]).then(() => {
      if (!cancelled) setStored(true);
    });
    const timer = setTimeout(() => setDrawn(true), LAUNCH_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => setGone(true), LAUNCH_EXIT_MS + 40);
    return () => clearTimeout(timer);
  }, [leaving]);

  return (
    <>
      {ready ? children : null}
      {gone ? null : (
        <View style={StyleSheet.absoluteFill} pointerEvents={ready ? 'none' : 'auto'}>
          {/* The wordmark waits for its fonts like everything else; the mark itself is pure vector. */}
          <LoadingScreen leaving={leaving} />
        </View>
      )}
    </>
  );
}
