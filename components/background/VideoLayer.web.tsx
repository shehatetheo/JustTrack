import { Asset } from 'expo-asset';
import React from 'react';

interface VideoLayerProps {
  source: number;
  onReady: () => void;
}

/** The web's background video: a plain <video>, muted and inline so browsers let it start on its own. If it can't play, the still underneath simply stays. */
export function VideoLayer({ source, onReady }: VideoLayerProps) {
  return React.createElement('video', {
    src: Asset.fromModule(source).uri,
    autoPlay: true,
    muted: true,
    loop: true,
    playsInline: true,
    disablePictureInPicture: true,
    'aria-hidden': true,
    tabIndex: -1,
    onPlaying: onReady,
    style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' },
  });
}
