import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme as useSystemColorScheme } from 'react-native';

import { Colors, Shadows, type ColorScheme, type ThemeColors } from '@/constants/theme';
import type { ThemePreference } from '@/types';

const STORAGE_KEY = 'justtrack.themePreference';
const DEFAULT_PREFERENCE: ThemePreference = 'dark';

/** Tells the system which look the app is using. Browsers have no such switch, so this is a no-op there. */
function applyNativeScheme(scheme: 'light' | 'dark' | 'unspecified'): void {
  if (typeof Appearance.setColorScheme === 'function') Appearance.setColorScheme(scheme);
}

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  scheme: ColorScheme;
  isDark: boolean;
  colors: ThemeColors;
  shadows: (typeof Shadows)[ColorScheme];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  // Dark is the app's native look; someone who wants light, or to follow the phone, picks it in Profile.
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_PREFERENCE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        const chosen: ThemePreference = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : DEFAULT_PREFERENCE;
        setPreferenceState(chosen);
        // Native pieces (keyboards, action sheets, the status bar) follow this too.
        if (chosen !== 'system') applyNativeScheme(chosen);
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    applyNativeScheme(next === 'system' ? 'unspecified' : next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Non-fatal: preference just won't persist across restarts.
    });
  }, []);

  const scheme: ColorScheme = (preference === 'system' ? systemScheme : preference) === 'dark' ? 'dark' : 'light';

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      setPreference,
      scheme,
      isDark: scheme === 'dark',
      colors: Colors[scheme],
      shadows: Shadows[scheme],
    }),
    [preference, setPreference, scheme]
  );

  if (!hydrated) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return ctx;
}
