import { Image } from 'expo-image';
import { useIsFocused } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { AppState, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useMotion } from '@/components/motion';
import { Duration } from '@/constants/motion';
import { ART_ASPECT, PAGE_ART, type BackgroundPage } from './pages';
import { useLowPower } from './useLowPower';
import { VideoLayer } from './VideoLayer';

interface AnimatedBackgroundProps {
  page: BackgroundPage;
  /**
   * top: the art keeps its shape and hangs from the top of the frame, for a header that content scrolls under.
   * cover: the art fills the frame, for a full-screen page.
   */
  fit?: 'top' | 'cover';
  /** 0–1. Profile shows its art at 0.4. */
  opacity?: number;
  /** Never play the video here (modals, dense lists). */
  stillOnly?: boolean;
  style?: StyleProp<ViewStyle>;
}

function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);
  return active;
}

/**
 * A page's collage artwork. The still is always there; the video plays over
 * it only while this page is the one in front, the app is open, and neither
 * Reduce Motion nor Low Power Mode is on. Leaving the page unmounts the
 * player, so two videos never run at once. The whole layer fades in over a
 * quarter of a second each time its page comes to the front.
 */
export function AnimatedBackground({ page, fit = 'top', opacity = 1, stillOnly = false, style }: AnimatedBackgroundProps) {
  const art = PAGE_ART[page];
  const focused = useIsFocused();
  const appActive = useAppActive();
  const lowPower = useLowPower();
  const { reduced } = useMotion();
  const playing = art.video !== null && !stillOnly && focused && appActive && !lowPower && !reduced;

  const shown = useSharedValue(0);
  useEffect(() => {
    shown.set(focused ? withTiming(1, { duration: Duration.crossfade }) : 0);
  }, [focused, shown]);
  const layer = useAnimatedStyle(() => ({ opacity: shown.get() * opacity }));

  // The still gives way to the video once a frame of it is really on screen.
  const [videoReady, setVideoReady] = useState(false);
  const video = useSharedValue(0);
  useEffect(() => {
    video.set(withTiming(playing && videoReady ? 1 : 0, { duration: Duration.crossfade }));
  }, [playing, video, videoReady]);
  const videoStyle = useAnimatedStyle(() => ({ opacity: video.get() }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, layer, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={fit === 'top' ? styles.top : StyleSheet.absoluteFill}>
        <Image source={art.still} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" />
        {playing && art.video !== null ? (
          <Animated.View style={[StyleSheet.absoluteFill, videoStyle]}>
            <VideoLayer source={art.video} onReady={() => setVideoReady(true)} />
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0, aspectRatio: ART_ASPECT },
});
