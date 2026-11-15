import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { INK } from '@/constants/theme';

export interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onError: (message: string) => void;
}

/**
 * Native: reads product barcodes with expo-camera. Permission is requested
 * when the screen opens, which is when the user asked to scan. (The web
 * build decodes the browser camera with ZXing — see BarcodeScanner.web.tsx.)
 */
export function BarcodeScanner({ onDetected, onError }: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const done = useRef(false);

  useEffect(() => {
    if (!permission || permission.granted) return;
    if (!permission.canAskAgain) {
      onError('Camera access is off for JustTrack. Allow it in Settings, or search by name instead.');
      return;
    }
    requestPermission().then((result) => {
      if (!result.granted) onError('Camera access was declined. Allow it in Settings, or search by name instead.');
    });
  }, [permission, requestPermission, onError]);

  if (!permission?.granted) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        mute
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={(result) => {
          if (done.current || !result.data) return;
          done.current = true;
          onDetected(result.data);
        }}
        onMountError={() => onError('The camera couldn’t be started.')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: INK, overflow: 'hidden' },
});
