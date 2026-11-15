import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { INK } from '@/constants/theme';
import type { LiveCameraProps } from './LiveCamera';

const CAPTURE_EDGE = 1280;

/**
 * Web: the browser camera as a viewfinder. The stream is only opened while
 * the screen is focused and is stopped the moment it isn't. Capturing a
 * frame draws the video onto a canvas and hands back a JPEG.
 */
export function LiveCamera({ active, onCapture, onUnavailable, bindCapture }: LiveCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!active || !video) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      onUnavailable('unsupported');
      return;
    }
    let stream: MediaStream | null = null;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((started) => {
        if (cancelled) {
          started.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = started;
        video.srcObject = started;
        return video.play().catch(() => undefined);
      })
      .then(() => {
        if (cancelled) return;
        bindCapture(() => {
          if (!video.videoWidth) return;
          const scale = Math.min(1, CAPTURE_EDGE / Math.max(video.videoWidth, video.videoHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(video.videoWidth * scale);
          canvas.height = Math.round(video.videoHeight * scale);
          canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
          onCapture(canvas.toDataURL('image/jpeg', 0.86));
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const name = error instanceof Error ? error.name : '';
        onUnavailable(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : name === 'NotFoundError' || name === 'OverconstrainedError' ? 'no_camera' : 'unsupported');
      });

    return () => {
      cancelled = true;
      bindCapture(null);
      stream?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    };
  }, [active, onCapture, onUnavailable, bindCapture]);

  return (
    <View style={styles.container}>
      <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: INK, overflow: 'hidden' },
});
