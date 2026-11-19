import { router, usePathname } from 'expo-router';
import React, { useState, useSyncExternalStore } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { Flourish } from '@/components/decor';
import { InkReveal, PressScale, useMotion } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { OrnateFrame } from '@/components/ui/OrnateFrame';
import { ThemedText } from '@/components/ui/ThemedText';
import { Wordmark } from '@/components/ui/Wordmark';
import { REPOSITORY_URL } from '@/constants/brand';
import { Fonts } from '@/constants/fonts';
import { HAIRLINE, LAVENDER, PAPER, Radii, Spacing } from '@/constants/theme';
import { OnDark } from '@/contexts/ThemeContext';
import { addSampleWeek, hasSampleWeek, removeSampleWeek } from '@/lib/demo/sampleWeek';
import { SHATTER_LINE } from '@/lib/easterEggs/eggs';
import { logStore } from '@/lib/log/logStore';
import { settingsStore } from '@/lib/settings/settingsStore';
import { showToast } from '@/utils/toast';

/**
 * The desktop website's stage: an animated storybook engraving behind the
 * phone, and a page of the book on either side of it. Only the web's phone
 * frame draws this, on a screen wide enough to hold it, so none of it is in
 * the iOS build. The phone in the middle is still the whole, working app;
 * the pages only talk about it and turn it to a chapter.
 */

const STILL = '/demo/storybook.jpg';
const LOOP = '/demo/storybook.mp4';

/** Lavender and ink at a strength, for the scrims and glows painted over the artwork. */
const ink = (alpha: number) => `rgba(10,10,11,${alpha})`;
const lavender = (alpha: number) => `rgba(201,184,255,${alpha})`;

const fill = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' } as const;

/** The engraving, moving where motion is welcome: mist drifts, the candle gutters, pages lift off the book. */
export function StorybookBackdrop() {
  const { reduced } = useMotion();
  const [playing, setPlaying] = useState(false);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {React.createElement('img', { src: STILL, alt: '', draggable: false, style: { ...fill, objectFit: 'cover' } })}
      {reduced
        ? null
        : React.createElement('video', {
            src: LOOP,
            poster: STILL,
            autoPlay: true,
            muted: true,
            loop: true,
            playsInline: true,
            disablePictureInPicture: true,
            preload: 'auto',
            'aria-hidden': true,
            tabIndex: -1,
            onPlaying: () => setPlaying(true),
            style: { ...fill, objectFit: 'cover', opacity: playing ? 1 : 0, transition: 'opacity 900ms ease' },
          })}
      {/* A pool of dark behind the phone, and the edges drawn in, so the artwork frames the page instead of fighting it. */}
      {React.createElement('div', { style: { ...fill, backgroundImage: `radial-gradient(ellipse 46% 78% at 50% 50%, ${ink(0.72)} 0%, ${ink(0.38)} 55%, ${ink(0)} 100%)` } })}
      {React.createElement('div', { style: { ...fill, backgroundImage: `linear-gradient(180deg, ${ink(0.5)} 0%, ${ink(0)} 16%, ${ink(0)} 82%, ${ink(0.62)} 100%)` } })}
    </View>
  );
}

/** Light the phone throws on the night around it. */
export const PHONE_GLOW = `0 50px 110px ${ink(0.85)}, 0 0 140px ${lavender(0.2)}, inset 0 0 0 2px rgba(255,255,255,0.06)`;

function usePageState() {
  const entries = useSyncExternalStore(logStore.subscribe, logStore.getSnapshot, logStore.getSnapshot);
  const settings = useSyncExternalStore(settingsStore.subscribe, settingsStore.getSnapshot, settingsStore.getSnapshot);
  return { sampled: hasSampleWeek(entries), welcomed: settings.welcomed };
}

/** Turn the phone to a screen, closing whatever sheet is open on it first. */
function turnTo(path: '/' | '/scan' | '/food/search' | '/stats' | '/profile' | '/privacy' | '/support') {
  if (router.canDismiss()) router.dismissAll();
  if (path === '/food/search' || path === '/privacy' || path === '/support') router.push(path);
  else router.navigate(path);
}

function Page({ side, label, children }: { side: 'left' | 'right'; label: string; children: React.ReactNode }) {
  return (
    <OnDark>
      <InkReveal delay={side === 'left' ? 500 : 680}>
        <OrnateFrame variant="corners" corner={34} color={lavender(0.5)} style={[styles.page, side === 'left' ? styles.left : styles.right]}>
          <View accessibilityRole={'complementary' as never} accessibilityLabel={label} style={styles.pageBody}>
            {children}
          </View>
        </OrnateFrame>
      </InkReveal>
    </OnDark>
  );
}

/** The left-hand page: what this is, and a way to see it with a week already in it. */
export function StoryPage({ compact }: { compact: boolean }) {
  const { sampled } = usePageState();

  const fillBook = () => {
    if (!addSampleWeek()) return;
    turnTo('/');
    showToast({ message: 'A sample week is in the book.' });
  };
  const emptyBook = () => {
    if (!removeSampleWeek()) return;
    showToast({ message: 'The sample week is out again.' });
  };

  return (
    <Page side="left" label="About JustTrack">
      <View style={styles.brand}>
        <Logo width={40} labelled={false} />
        <Wordmark size={22} />
      </View>
      <ThemedText variant="overline" style={styles.overline}>
        A CALORIE TRACKER, PLAINLY TOLD
      </ThemedText>
      <ThemedText variant="largeTitle" style={styles.title} accessibilityRole="header">
        once upon a plate
      </ThemedText>
      {React.createElement(
        'p',
        { style: prose },
        React.createElement('span', { style: dropCap, 'aria-hidden': true }, 'T'),
        React.createElement('span', { style: srOnly }, 'T'),
        compact
          ? 'here was a tracker that asked for nothing. Point it at dinner, and it writes down what it sees.'
          : 'here was a tracker that asked for nothing: no sign-up, no ads, no one keeping count but you. Point it at dinner, and it writes down what it sees. The book stays on your own device.'
      )}
      <View style={styles.flourish}>
        <Flourish size={150} color={lavender(0.7)} />
      </View>
      {sampled ? <Button label="Take the sample week out" variant="quiet" size="md" onPress={emptyBook} /> : <Button label="Fill it with a sample week" variant="secondary" size="md" onPress={fillBook} />}
      <ThemedText variant="footnote" style={styles.note}>
        The phone beside this page is the real app, running here. What you log in it stays in this browser.
      </ThemedText>
    </Page>
  );
}

const CHAPTERS = [
  { numeral: 'i', title: 'the ledger', line: 'today, and what is left of it', path: '/' },
  { numeral: 'ii', title: 'the lens', line: 'a photo of the plate becomes a meal', path: '/scan' },
  { numeral: 'iii', title: 'the pantry', line: 'search foods and restaurant menus', path: '/food/search' },
  { numeral: 'iv', title: 'the days', line: 'streaks, weight, the week behind', path: '/stats' },
  { numeral: 'v', title: 'the keeper', line: 'goals, reminders, a fast to keep', path: '/profile' },
] as const;

/** The right-hand page: the app's screens as chapters, each one a door into the phone. */
export function ChaptersPage({ compact }: { compact: boolean }) {
  const { welcomed } = usePageState();
  const pathname = usePathname();

  return (
    <Page side="right" label="Chapters">
      <ThemedText variant="overline" style={styles.overline}>
        THE CHAPTERS
      </ThemedText>
      <View style={styles.chapters}>
        {CHAPTERS.map((chapter) => {
          const open = welcomed && pathname === chapter.path;
          return (
            <PressScale
              key={chapter.path}
              onPress={() => turnTo(chapter.path)}
              disabled={!welcomed}
              haptic={null}
              pressScale={0.98}
              accessibilityRole="button"
              accessibilityLabel={`Chapter ${chapter.numeral}, ${chapter.title}: ${chapter.line}`}
              accessibilityState={{ disabled: !welcomed, selected: open }}
              style={[styles.chapter, { opacity: welcomed ? 1 : 0.5, borderColor: open ? lavender(0.55) : lavender(0.14), backgroundColor: open ? lavender(0.1) : 'transparent' }]}
            >
              <ThemedText variant="blackletter" style={styles.numeral}>
                {chapter.numeral}
              </ThemedText>
              <View style={styles.chapterText}>
                <ThemedText variant="title3" style={styles.chapterTitle}>
                  {chapter.title}
                </ThemedText>
                {compact ? null : (
                  <ThemedText variant="tagline" style={styles.chapterLine}>
                    {chapter.line}
                  </ThemedText>
                )}
              </View>
            </PressScale>
          );
        })}
      </View>
      <ThemedText variant="tagline" style={styles.hint}>
        {welcomed ? 'Pick a chapter and the phone turns to it.' : 'The chapters open once the welcome on the phone is done, or the book has a sample week in it.'}
      </ThemedText>
      <View style={styles.links}>
        <QuietLink label="the code" onPress={() => void Linking.openURL(REPOSITORY_URL)} />
        <QuietLink label="privacy" onPress={() => turnTo('/privacy')} />
        <QuietLink label="support" onPress={() => turnTo('/support')} />
      </View>
      <ThemedText variant="overline" style={styles.colophon}>
        {SHATTER_LINE.toUpperCase()}
      </ThemedText>
    </Page>
  );
}

function QuietLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressScale onPress={onPress} haptic={null} accessibilityRole="link" accessibilityLabel={label} style={styles.link}>
      <ThemedText variant="footnoteEmphasized" style={styles.linkText}>
        {label}
      </ThemedText>
    </PressScale>
  );
}

const prose = {
  margin: 0,
  fontFamily: Fonts.tagline,
  fontStyle: 'italic',
  fontSize: 19,
  lineHeight: '27px',
  color: PAPER,
  opacity: 0.92,
} as const;

const dropCap = {
  float: 'left',
  fontFamily: Fonts.blackletter,
  fontStyle: 'normal',
  fontSize: 58,
  lineHeight: '50px',
  paddingRight: 8,
  paddingTop: 4,
  color: LAVENDER,
} as const;

/** The drop cap is drawn for the eye; this copy of the letter is the one a screen reader meets. */
const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' } as const;

const styles = StyleSheet.create({
  page: {
    borderRadius: Radii.lg,
    borderWidth: HAIRLINE,
    borderColor: lavender(0.22),
    backgroundColor: ink(0.58),
    backdropFilter: 'blur(10px)',
    boxShadow: `0 30px 70px ${ink(0.6)}`,
  } as never,
  left: { width: 330 },
  right: { width: 336 },
  pageBody: { paddingHorizontal: 28, paddingVertical: 30, gap: Spacing.md },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  overline: { color: lavender(0.85) },
  title: { color: PAPER, fontSize: 30, lineHeight: 38, letterSpacing: 2 },
  flourish: { alignItems: 'center', marginVertical: -Spacing.xs },
  note: { color: PAPER, opacity: 0.62 },
  chapters: { gap: Spacing.xs },
  chapter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radii.md, borderWidth: HAIRLINE, minHeight: 48 },
  numeral: { color: LAVENDER, fontSize: 26, lineHeight: 30, width: 34, textAlign: 'center' },
  chapterText: { flex: 1 },
  chapterTitle: { color: PAPER, fontSize: 16, lineHeight: 22, letterSpacing: 1.5 },
  chapterLine: { color: PAPER, opacity: 0.7, fontSize: 15, lineHeight: 19 },
  hint: { color: PAPER, opacity: 0.72, fontSize: 15, lineHeight: 20 },
  links: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.xs },
  link: { minHeight: 32, justifyContent: 'center' },
  linkText: { color: LAVENDER, textDecorationLine: 'underline' },
  colophon: { color: PAPER, opacity: 0.45 },
});
