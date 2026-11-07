import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { prepareImage, type PhotoInput } from '@/lib/scan/prepareImage';
import { failAnalysis, finishAnalysis, setReviewThumbnail, startAnalysis, startDescription } from '@/lib/scan/reviewStore';
import { analyzeMealDescription, analyzeMealPhoto, ScanError } from '@/services/mealScanService';

/**
 * Take or choose a photo, or type a description, hand it to the analyzer,
 * and open the review screen while it works. Camera and photo access are only requested here,
 * at the moment the user asks to scan.
 */
export function useMealScan() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  // Mirrors `busy` for the callbacks, which stay the same function between renders.
  const inFlight = useRef(false);

  const setInFlight = (value: boolean) => {
    inFlight.current = value;
    setBusy(value);
  };

  /** Analyze a photo that's already in hand (from the picker, or the live camera). */
  const analyze = useCallback(
    async (photo: PhotoInput) => {
      if (inFlight.current) return;
      setInFlight(true);
      startAnalysis(photo.uri);
      router.push('/scan/review');
      try {
        const prepared = await prepareImage(photo);
        setReviewThumbnail(prepared.thumbnail);
        finishAnalysis(await analyzeMealPhoto(prepared));
      } catch (error) {
        failAnalysis(error instanceof Error ? error.message : 'Something went wrong.', error instanceof ScanError ? error.code : null);
      } finally {
        setInFlight(false);
      }
    },
    [router]
  );

  /** Analyze a typed description of the meal; opens the review screen while it works. */
  const describe = useCallback(
    async (text: string) => {
      if (inFlight.current) return;
      setInFlight(true);
      startDescription(text.trim());
      router.replace('/scan/review');
      try {
        finishAnalysis(await analyzeMealDescription(text));
      } catch (error) {
        failAnalysis(error instanceof Error ? error.message : 'Something went wrong.', error instanceof ScanError ? error.code : null);
      } finally {
        setInFlight(false);
      }
    },
    [router]
  );

  const scan = async (from: 'camera' | 'library') => {
    if (inFlight.current) return;
    if (from === 'camera' && Platform.OS !== 'web') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera access needed', 'Allow camera access in Settings to photograph a meal, or choose a photo from your library instead.');
        return;
      }
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, base64: Platform.OS !== 'web', exif: false };
    const result = from === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;
    await analyze({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType });
  };

  return { scan, analyze, describe, busy };
}
