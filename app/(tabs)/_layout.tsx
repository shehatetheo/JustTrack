import { usePathname } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { SlashWipe } from '@/components/motion';
import { ScanTabButton, SearchButton, TabBarButton, TabBarContainer } from '@/components/navigation/TabBar';
import { useWelcomeBack, WelcomeBack } from '@/components/onboarding/WelcomeBack';
import { ReminderPrompt } from '@/components/reminders/ReminderPrompt';

const TAB_PATHS = ['/', '/stats', '/scan', '/profile'];

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
