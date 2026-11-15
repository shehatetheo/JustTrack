import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef } from 'react';

/** How hard, in g, the phone has to be moved, and how long before another shake counts. */
const THRESHOLD = 2.3;
const COOLDOWN_MS = 1500;

/**
 * Calls `onShake` when the phone is shaken, while `active`. Reads the
 * accelerometer a few times a second and only while it is wanted; nothing
 * is stored or sent.
 */
export function useShake(onShake: () => void, active: boolean): void {
  const handler = useRef(onShake);
  useEffect(() => {
    handler.current = onShake;
  });

  useEffect(() => {
    if (!active) return;
    let last = 0;
    let subscription: { remove: () => void } | null = null;
    let cancelled = false;
    void Accelerometer.isAvailableAsync()
      .then((available) => {
        if (!available || cancelled) return;
        Accelerometer.setUpdateInterval(120);
        subscription = Accelerometer.addListener(({ x, y, z }) => {
          const force = Math.sqrt(x * x + y * y + z * z);
          const now = Date.now();
          if (force > THRESHOLD && now - last > COOLDOWN_MS) {
            last = now;
            handler.current();
          }
        });
      })
      .catch(() => {
        // No accelerometer: there is simply no shake to notice.
      });
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [active]);
}
