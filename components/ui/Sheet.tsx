import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, PanResponder, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMotion } from '@/components/motion';
import { Duration, Easings, Springs } from '@/constants/motion';
import { HAIRLINE, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { OrnateFrame } from './OrnateFrame';
import { ThemedText } from './ThemedText';

interface OverlayProps {
  visible: boolean;
  /** Asked to close: a tap on the curtain, a drag down, the back button. */
  onClose: () => void;
  /** The overlay has left the screen and it is safe to navigate. */
  onClosed?: () => void;
  /** Draw in place rather than in a native modal. Right when nothing native is on top of the app, and always on the web. */
  inline?: boolean;
  /** Where the panel sits. */
  placement: 'bottom' | 'center';
  children: React.ReactNode;
}

const EXIT_MS = Duration.micro + 30;
/** How far a sheet starts below its resting place. */
const TRAVEL = 420;

/**
 * The curtain and the panel on it. A bottom panel rises on a spring and can
 * be dragged down to dismiss; a centred one settles in. Stays mounted while
 * it leaves, and only then reports that it has closed.
 */
function Overlay({ visible, onClose, onClosed, inline = false, placement, children }: OverlayProps) {
  const { colors } = useAppTheme();
  const { reduced } = useMotion();
  const [shown, setShown] = useState(visible);
  const progress = useSharedValue(0);
  const drag = useSharedValue(0);
  const closed = useRef(onClosed);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    closed.current = onClosed;
  });

  if (visible && !shown) setShown(true);

  const reportClosed = () => {
    if (pending.current) clearTimeout(pending.current);
    pending.current = null;
    const done = closed.current;
    closed.current = undefined;
    done?.();
  };

  useEffect(() => {
    if (visible) {
      drag.set(0);
      progress.set(reduced ? withTiming(1, { duration: Duration.micro }) : placement === 'bottom' ? withSpring(1, Springs.settle) : withTiming(1, { duration: Duration.standard, easing: Easings.out }));
      return;
    }
    progress.set(withTiming(0, { duration: EXIT_MS, easing: Easings.inOut }));
    const timer = setTimeout(() => {
      setShown(false);
      // A native modal tells us when it has gone (onDismiss); if it never does, go ahead anyway.
      if (inline || Platform.OS !== 'ios') reportClosed();
      else pending.current = setTimeout(reportClosed, 320);
    }, EXIT_MS);
    return () => clearTimeout(timer);
    // Runs when the overlay opens or closes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => placement === 'bottom' && gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_event, gesture) => drag.set(Math.max(0, gesture.dy)),
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dy > 80 || gesture.vy > 0.9) onClose();
          else drag.set(withSpring(0, Springs.snappy));
        },
        onPanResponderTerminate: () => drag.set(withSpring(0, Springs.snappy)),
      }),
    [drag, onClose, placement]
  );

  const curtain = useAnimatedStyle(() => ({ opacity: progress.get() * (1 - Math.min(drag.get() / TRAVEL, 0.6)) }));
  const panel = useAnimatedStyle(() => {
    if (reduced) return { opacity: progress.get() };
    if (placement === 'center') return { opacity: progress.get(), transform: [{ scale: 0.94 + progress.get() * 0.06 }] };
    return { transform: [{ translateY: (1 - progress.get()) * TRAVEL + drag.get() }] };
  });

  const body = (
    <View style={styles.root} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.curtain }, curtain]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss" />
      </Animated.View>
      <Animated.View style={[placement === 'bottom' ? styles.bottom : styles.center, panel]} pointerEvents="box-none" accessibilityViewIsModal {...(placement === 'bottom' ? responder.panHandlers : null)}>
        {children}
      </Animated.View>
    </View>
  );

  if (inline) return shown ? <View style={[StyleSheet.absoluteFill, styles.inline]}>{body}</View> : null;
  return (
    <Modal visible={shown} transparent animationType="none" statusBarTranslucent onRequestClose={onClose} onDismiss={reportClosed}>
      {body}
    </Modal>
  );
}

interface PanelProps extends Omit<OverlayProps, 'placement' | 'children'> {
  title?: string;
  /** One italic line under the title. */
  tagline?: string;
  children: React.ReactNode;
}

/** A sheet that rises from the bottom edge: a grabber, a centred title, then whatever it holds. */
export function BottomSheet({ title, tagline, children, ...overlay }: PanelProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Overlay placement="bottom" {...overlay}>
      {/* The filigree along the top edge draws on each time the sheet is shown. */}
      <OrnateFrame variant="top" corner={30} replay={overlay.visible} style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.borderAccent, paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={[styles.grabber, { backgroundColor: colors.border }]} />
        {title ? (
          <View style={styles.heading}>
            <ThemedText variant="title3" style={styles.centerText} accessibilityRole="header">
              {title.toLowerCase()}
            </ThemedText>
            {tagline ? (
              <ThemedText variant="tagline" color="secondary" style={styles.centerText}>
                {tagline}
              </ThemedText>
            ) : null}
          </View>
        ) : null}
        {children}
      </OrnateFrame>
    </Overlay>
  );
}

/** A framed card in the middle of the screen, for a question or a notice. */
export function DialogCard({ title, tagline, children, ...overlay }: PanelProps) {
  const { colors, shadows } = useAppTheme();
  return (
    <Overlay placement="center" {...overlay}>
      <View style={[styles.dialog, shadows.lg, { backgroundColor: colors.surface, borderColor: colors.borderAccent }]}>
        <OrnateFrame variant="corners" corner={34} style={styles.dialogFrame}>
          {title ? (
            <ThemedText variant="title3" style={styles.centerText} accessibilityRole="header">
              {title.toLowerCase()}
            </ThemedText>
          ) : null}
          {tagline ? (
            <ThemedText variant="subhead" color="secondary" style={styles.centerText}>
              {tagline}
            </ThemedText>
          ) : null}
          {children}
        </OrnateFrame>
      </View>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inline: { zIndex: 50, elevation: 50 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  sheet: { width: '100%', maxWidth: 480, borderTopLeftRadius: Radii['2xl'], borderTopRightRadius: Radii['2xl'], borderWidth: HAIRLINE, borderBottomWidth: 0, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.md },
  grabber: { width: 40, height: 4, borderRadius: Radii.full, alignSelf: 'center' },
  heading: { gap: Spacing.xxs, paddingTop: Spacing.xs },
  centerText: { textAlign: 'center' },
  dialog: { width: '100%', maxWidth: 360, borderRadius: Radii['2xl'], borderWidth: HAIRLINE },
  dialogFrame: { padding: Spacing.xl, paddingTop: Spacing['2xl'], gap: Spacing.md },
});
