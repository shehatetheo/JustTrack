import { useVideoPlayer, VideoView } from 'expo-video';
import React from 'react';
import { StyleSheet } from 'react-native';

interface VideoLayerProps {
  source: number;
  /** Called when the first frame is on screen, so the still can give way. */
  onReady: () => void;
}

/**
 * One muted, looping, control-less video. Mounting it creates the player and
 * unmounting releases it, so "only the focused page plays" is just a matter
 * of which page renders this.
 */
export function VideoLayer({ source, onReady }: VideoLayerProps) {
  const player = useVideoPlayer(source, (created) => {
    created.loop = true;
    created.muted = true;
    // Decoration must never pause someone's music.
    created.audioMixingMode = 'mixWithOthers';
    created.play();
  });

  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} allowsPictureInPicture={false} onFirstFrameRender={onReady} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
}
