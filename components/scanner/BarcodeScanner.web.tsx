import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { INK } from '@/constants/theme';
import type { BarcodeScannerProps } from './BarcodeScanner';

const FORMATS = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E];

/**
 * Web: reads product barcodes from the live camera with ZXing. The camera is
 * only opened while this component is on screen.
 */
export function BarcodeScanner({ onDetected, onError }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS);
    const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 250, delayBetweenScanSuccess: 1500 });
    let controls: IScannerControls | null = null;
    let done = false;

    reader
      .decodeFromVideoDevice(undefined, video, (result) => {
        if (result && !done) {
          done = true;
          onDetected(result.getText());
        }
      })
      .then((started) => {
        controls = started;
        if (done) started.stop();
      })
      .catch((error: unknown) => {
        const name = error instanceof Error ? error.name : '';
        onError(
          name === 'NotAllowedError'
            ? 'Camera access was blocked. Allow it in your browser settings, or search by name instead.'
            : name === 'NotFoundError'
              ? 'No camera was found on this device.'
              : 'The camera couldn’t be started.'
        );
      });

    return () => {
      done = true;
      controls?.stop();
    };
  }, [onDetected, onError]);

  return (
    <View style={styles.container}>
      <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: INK, overflow: 'hidden' },
});
