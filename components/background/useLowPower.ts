import { useLowPowerMode } from 'expo-battery';

/** True while the phone is in Low Power Mode, when decorative video should rest. */
export function useLowPower(): boolean {
  return useLowPowerMode();
}
