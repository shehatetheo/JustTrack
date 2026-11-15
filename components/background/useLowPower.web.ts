/** Browsers don't report a low-power mode, so the web build never rests its video for one. */
export function useLowPower(): boolean {
  return false;
}
