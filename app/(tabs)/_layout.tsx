import { usePathname } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { SlashWipe } from '@/components/motion';
import { ScanTabButton, SearchButton, TabBarButton, TabBarContainer } from '@/components/navigation/TabBar';
import { useWelcomeBack, WelcomeBack } from '@/components/onboarding/WelcomeBack';
import { ReminderPrompt } from '@/components/reminders/ReminderPrompt';
import { Duration } from '@/constants/motion';
import { useAppTheme } from '@/contexts/ThemeContext';

const TAB_PATHS = ['/', '/stats', '/scan', '/profile'];
/** Routes that open as a sheet over the tabs. */
const SHEET_PATHS = ['/food', '/entry', '/scan/', '/settings', '/weight/log', '/privacy', '/support'];

/**
 * While a sheet is open the tabs go dark behind it, so the day's numbers
 * never show around the edge of a sheet that has numbers of its own.
 */
function Curtain({ drawn }: { drawn: boolean }) {
  const { colors } = useAppTheme();
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.set(withTiming(drawn ? 1 : 0, { duration: drawn ? Duration.micro : Duration.standard }));
  }, [drawn, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.hero }, style]} />;
}

export default function TabsLayout() {
  const welcomeBack = useWelcomeBack();
  const pathname = usePathname();
  // Only a change of tab cuts across the screen; opening a sheet doesn't.
  const tab = TAB_PATHS.includes(pathname) ? pathname : null;

  return (
    <View style={styles.root}>
      <Tabs>
        <View style={styles.slot}>
          <TabSlot style={styles.slot} />
          {tab ? <SlashWipe trigger={tab} /> : null}
        </View>
        <TabList asChild>
          <TabBarContainer>
            <TabTrigger name="index" href="/" asChild>
              <TabBarButton icon="home" activeIcon="homeFilled" label="home" />
            </TabTrigger>
            <TabTrigger name="stats" href="/stats" asChild>
              <TabBarButton icon="stats" activeIcon="statsFilled" label="today" />
            </TabTrigger>
            <TabTrigger name="scan" href="/scan" asChild>
              <ScanTabButton />
            </TabTrigger>
            <SearchButton />
            <TabTrigger name="profile" href="/profile" asChild>
              <TabBarButton icon="profile" activeIcon="profileFilled" label="profile" />
            </TabTrigger>
          </TabBarContainer>
        </TabList>
      </Tabs>
      <Curtain drawn={SHEET_PATHS.some((path) => pathname.startsWith(path))} />
      {/* One thing at a time: the reminder question waits until the welcome-back slides are gone. */}
      {welcomeBack.days !== null ? <WelcomeBack days={welcomeBack.days} onClose={welcomeBack.close} /> : <ReminderPrompt />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // TabSlot defaults to flexShrink: 0, which lets a long screen push the
  // tab bar off the bottom; a zero basis makes it fill only the leftover space.
  slot: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 0 },
});
