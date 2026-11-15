import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SheetFrame } from '@/components/layout/SheetFrame';
import { SheetHeader } from '@/components/layout/SheetHeader';
import { InkReveal } from '@/components/motion';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/hooks/useSettings';

export interface LegalSection {
  heading: string;
  paragraphs: readonly string[];
}

interface LegalPageProps {
  title: string;
  /** e.g. "Updated October 30, 2026". */
  dateline: string;
  intro: string;
  sections: readonly LegalSection[];
}

/**
 * A plain, readable page for the privacy policy and support: reachable from
 * Profile in the app and by URL on the web (App Store Connect needs both).
 * Opens on its own on the web, so the close button falls back to Home.
 */
export function LegalPage(props: LegalPageProps) {
  return (
    <SheetFrame>
      <Page {...props} />
    </SheetFrame>
  );
}

function Page({ title, dateline, intro, sections }: LegalPageProps) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { welcomed } = useSettings();

  // Opened by URL there is nothing to go back to; Home only exists once the user has been welcomed.
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace(welcomed ? '/' : '/welcome');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SheetHeader title={title} onClose={close} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['3xl'] }]}>
      <InkReveal>
      <ThemedText variant="footnote" color="tertiary" style={styles.dateline}>
        {dateline}
      </ThemedText>
      <ThemedText variant="body" color="secondary" style={styles.intro}>
        {intro}
      </ThemedText>
      {sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <ThemedText variant="title3" accessibilityRole="header">
            {section.heading}
          </ThemedText>
          {section.paragraphs.map((paragraph) => (
            <ThemedText key={paragraph} variant="body" color="secondary" style={styles.paragraph}>
              {paragraph}
            </ThemedText>
          ))}
        </View>
      ))}
      </InkReveal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, maxWidth: 680, width: '100%', alignSelf: 'center' },
  dateline: {},
  intro: { marginTop: Spacing.lg },
  section: { marginTop: Spacing['2xl'], gap: Spacing.sm },
  paragraph: { lineHeight: 24 },
});
