import * as Haptics from 'expo-haptics';
import { Easing } from 'react-native-reanimated';

/**
 * The app's motion vocabulary. Everything that moves takes its timing,
 * spring and easing from here, through the primitives in components/motion,
 * so a press, a stamp or a wipe feels the same on every screen.
 *
 * Reanimated honours the system "Reduce Motion" setting for every timing
 * and spring by default (it jumps to the end value), and the primitives add
 * a plain fade where a jump would look broken.
 */

/** Milliseconds. Micro for presses and ticks, standard for most transitions, hero for the few big moments. */
export const Duration = {
  micro: 150,
  standard: 260,
  hero: 520,
  /** Gap between neighbours in a staggered list. */
  stagger: 35,
  /** Background and tab crossfades. */
  crossfade: 250,
  /** A slow, ambient loop: breathing corners, the scan button's ring. */
  ambient: 2400,
} as const;

export const Springs = {
  /** Presses, toggles, steppers: quick and tight. */
  snappy: { damping: 18, stiffness: 320, mass: 0.8 },
  /** Sheets and panels coming to rest. */
  settle: { damping: 22, stiffness: 210, mass: 1 },
  /** The stamp: overshoots once, hard. */
  thump: { damping: 9, stiffness: 420, mass: 0.7 },
  /** The tab indicator gliding across. */
  glide: { damping: 17, stiffness: 240, mass: 0.9 },
} as const;

export const Easings = {
  out: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
  /** Fast in the middle, like a blade: wipes and streaks. */
  slash: Easing.bezier(0.7, 0, 0.2, 1),
  /** A pen settling at the end of a stroke. */
  draw: Easing.bezier(0.3, 0, 0.1, 1),
} as const;

/** How far a pressed control shrinks. */
export const PRESS_SCALE = 0.96;
/** How far a row or a chip rises as it staggers in. */
export const RISE = 10;

/** The moments that get a tap from the phone, by name, so the feel is consistent. */
export const Haptic = {
  /** Any ordinary press. */
  tap: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  /** Moving between choices: tabs, pills, steppers. */
  select: () => void Haptics.selectionAsync(),
  /** Food goes into the log. */
  log: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  /** The LOGGED stamp: a heavy double knock. */
  stamp: () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid), 90);
  },
  success: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  /** Something needs fixing. */
  error: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
} as const;

export type HapticName = keyof typeof Haptic;
