import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaFrameContext, SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { ChaptersPage, PHONE_GLOW, StorybookBackdrop, StoryPage } from '@/components/layout/StorybookStage';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useWantsLightStatusBar } from '@/lib/statusBar';

/**
 * On a phone browser the app fills the screen. On a laptop it runs inside an
 * iPhone — Dynamic Island, status bar, home indicator and all — with the
 * same safe-area insets iOS gives it, so what you test on the web is what
 * ships in the iOS build. Around the phone is the storybook stage: an
 * animated engraving, and on a wide screen a page of the book on each side.
 */

const SCREEN = { width: 393, height: 852 };
const BEZEL = 12;
const OUTER_RADIUS = 62;
/** iPhone 15 Pro–class insets: the status bar / Dynamic Island, and the home indicator. */
const IOS_INSETS = { top: 59, bottom: 34, left: 0, right: 0 };
const MIN_PAGE_WIDTH = 600;
const MIN_PAGE_HEIGHT = 560;
/** Room for both pages of the book beside the phone. */
const MIN_SPREAD_WIDTH = 1180;
const MIN_SPREAD_HEIGHT = 620;
/** Below this the pages drop their longer lines. */
const COMPACT_HEIGHT = 780;

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const framed = width >= MIN_PAGE_WIDTH && height >= MIN_PAGE_HEIGHT;
  const spread = width >= MIN_SPREAD_WIDTH && height >= MIN_SPREAD_HEIGHT;
  const compact = height < COMPACT_HEIGHT;

  const outer = { width: SCREEN.width + BEZEL * 2, height: SCREEN.height + BEZEL * 2 };
  const scale = Math.min(1, (height - 72) / outer.height, (width - 48) / outer.width);
  const frame = useMemo(() => ({ x: 0, y: 0, ...SCREEN }), []);

  if (!framed) return <>{children}</>;

  return (
    <View style={styles.page}>
      <StorybookBackdrop />
      {spread ? <StoryPage compact={compact} /> : null}
      <View style={{ width: outer.width * scale, height: outer.height * scale }}>
        <View style={[styles.device, outer, { transform: [{ scale }], borderColor: isDark ? '#3A3744' : '#C9C7D2' }]}>
          <SideButton side="left" top={170} height={34} />
          <SideButton side="left" top={236} height={64} />
          <SideButton side="left" top={312} height={64} />
          <SideButton side="right" top={260} height={96} />
          <View style={[styles.screen, SCREEN, { backgroundColor: colors.background }]}>
            <SafeAreaFrameContext.Provider value={frame}>
              <SafeAreaInsetsContext.Provider value={IOS_INSETS}>{children}</SafeAreaInsetsContext.Provider>
            </SafeAreaFrameContext.Provider>
            <StatusBar />
            <View style={styles.island} />
            <View style={styles.homeIndicator} />
          </View>
        </View>
      </View>
      {spread ? <ChaptersPage compact={compact} /> : null}
    </View>
  );
}

function SideButton({ side, top, height }: { side: 'left' | 'right'; top: number; height: number }) {
  return <View style={[styles.sideButton, { top, height, [side]: -3 }]} />;
}

function useClock(): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);
  return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '');
}

/** Time on the left, signal / Wi-Fi / battery on the right, drawn over whatever the app shows. */
function StatusBar() {
  const time = useClock();
  const { isDark } = useAppTheme();
  const light = useWantsLightStatusBar() || isDark;
  const ink = light ? WHITE : '#0A0A0B';
  return (
    <View pointerEvents="none" style={[styles.statusBar, { opacity: 1 }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <ThemedText variant="subheadEmphasized" style={[styles.statusText, { color: ink, textShadowColor: light ? 'rgba(0,0,0,0.35)' : 'transparent' }]}>
        {time}
      </ThemedText>
      <View style={styles.statusIcons}>
        <View style={styles.signal}>
          {[4, 6, 8, 10].map((h) => (
            <View key={h} style={[styles.bar, { height: h, backgroundColor: ink }]} />
          ))}
        </View>
        <View style={styles.wifi}>
          {[16, 10, 4].map((size) => (
            <View key={size} style={[styles.wifiArc, { backgroundColor: ink, width: size, height: size / 2 + 1, borderTopLeftRadius: size / 2, borderTopRightRadius: size / 2 }]} />
          ))}
        </View>
        <View style={[styles.battery, { borderColor: ink }]}>
          <View style={[styles.batteryFill, { backgroundColor: ink }]} />
          <View style={[styles.batteryCap, { backgroundColor: ink }]} />
        </View>
      </View>
    </View>
  );
}

const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  page: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing['2xl'], overflow: 'hidden', backgroundColor: '#0A0A0B' },
  device: {
    backgroundColor: '#0B0A10',
    borderRadius: OUTER_RADIUS,
    borderWidth: 2,
    padding: BEZEL - 2,
    transformOrigin: 'top left',
    boxShadow: PHONE_GLOW,
  },
  sideButton: { position: 'absolute', width: 4, borderRadius: 2, backgroundColor: '#2A2834' },
  screen: { borderRadius: OUTER_RADIUS - BEZEL, overflow: 'hidden' },
  island: { position: 'absolute', top: 11, left: SCREEN.width / 2 - 62, width: 124, height: 36, borderRadius: 18, backgroundColor: '#000000' },
  homeIndicator: { position: 'absolute', bottom: 8, left: SCREEN.width / 2 - 70, width: 140, height: 5, borderRadius: 3, backgroundColor: '#8A879C', opacity: 0.8 },
  statusBar: { position: 'absolute', top: 14, left: 0, right: 0, height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 38, paddingRight: 30 },
  statusText: { color: WHITE, textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  statusIcons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  signal: { flexDirection: 'row', alignItems: 'flex-end', gap: 1.5, height: 10 },
  bar: { width: 3, borderRadius: 1 },
  wifi: { width: 16, height: 10, alignItems: 'center', justifyContent: 'flex-end' },
  wifiArc: { position: 'absolute', bottom: 0 },
  battery: { width: 25, height: 12, borderRadius: 4, borderWidth: 1, padding: 1.5, opacity: 0.9 },
  batteryFill: { flex: 1, borderRadius: 2 },
  batteryCap: { position: 'absolute', right: -3, top: 3, width: 2, height: 4, borderRadius: 1 },
});
